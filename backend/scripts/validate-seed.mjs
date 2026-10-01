import { build } from "esbuild";
import { fileURLToPath } from "node:url";

export async function validateSeed(content) {
  const result = await build({entryPoints:[fileURLToPath(new URL("../src/content.ts",import.meta.url))],bundle:true,write:false,format:"esm",platform:"neutral",logLevel:"silent"});
  const module = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString("base64")}`);
  return module.validateContent(content,{publishing:true});
}
