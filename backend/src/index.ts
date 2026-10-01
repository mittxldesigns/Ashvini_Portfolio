import { authRoute, requireSession, SecretEnv } from "./auth";
import { contentRoute, published } from "./content";
import { createMedia, serveMedia, serveSiteTour, uploadMedia } from "./media";
import { proxy } from "./proxy";
import { HttpError, json, rateLimit } from "./security";

export default {
  async fetch(request: Request, env: SecretEnv): Promise<Response> {
    try {
      const path = new URL(request.url).pathname;
      if (path === "/site-tour.mp4" && ["GET","HEAD"].includes(request.method)) return await serveSiteTour(env,request);
      if (path === "/api/portfolio" && request.method === "GET") {
        const content = await published(env);
        // Null explicitly tells the frontend to preserve its bundled seed.
        return json(content);
      }
      if (path.startsWith("/api/auth/")) return await authRoute(env,request,path.slice(10));
      if (path.startsWith("/api/admin/")) {
        const session = await requireSession(env,request,request.method !== "GET");
        const action = path.slice(11);
        if (action === "media" && request.method === "POST") {
          await rateLimit(env,request,"upload-create",60,3600,session.email);
          return await createMedia(env,request);
        }
        const upload = /^media\/([a-f0-9-]{36})\/(original|preview)$/.exec(action);
        if (upload && request.method === "PUT") {
          await rateLimit(env,request,"upload-bytes",120,3600,session.email);
          return await uploadMedia(env,request,upload[1],upload[2]);
        }
        if (["content","publish","rollback"].includes(action) && ["GET","PUT","POST"].includes(request.method)) return await contentRoute(env,request,action);
        throw new HttpError(404,"not_found","This endpoint does not exist.");
      }
      if (path.startsWith("/api/")) throw new HttpError(404,"not_found","This endpoint does not exist.");
      const media = /^\/media\/([a-f0-9-]{36})\/(original|preview)$/.exec(path);
      if (media && ["GET","HEAD"].includes(request.method)) return await serveMedia(env,request,media[1],media[2]);
      if (String(env.PROXY_ENABLED) === "true" && ["GET","HEAD"].includes(request.method)) return await proxy(env,request);
      throw new HttpError(404,"not_found","This page was not found.");
    } catch (error) {
      if (error instanceof HttpError) return json({error:{code:error.code,message:error.message}},error.status,error.status === 429 ? {"Retry-After":"600"} : {});
      // No request bodies, cookies, tokens, passwords, or database errors enter logs.
      const incident = crypto.randomUUID();
      console.error(JSON.stringify({event:"cms_request_failed",incident}));
      return json({error:{code:"server_error",message:"The request could not be completed. Try again.",incident}},500);
    }
  }
} satisfies ExportedHandler<SecretEnv>;
