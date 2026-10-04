import { reviewedSticker } from "../../src/lib/projectSticker.js";
import type { Content, RecordValue } from './content';
import { getSession } from './auth';
import { digest, hex, HttpError, json, now, rateLimit, readJson, safeEqual, token } from './security';
import { MAX_DIMENSION, MAX_OUTPUT_BYTES, validateCutoutPng } from './helperPng';

const LEASE_SECONDS=300,SETTINGS='cutout-v1-birefnet-general-lite',UUID=/^[a-f0-9-]{36}$/;
type Device={id:string;name:string;version:string;paused:number;local_paused:number;model_status:string;revoked_at:number|null;last_seen_at:number;created_at:number};
type Job={id:string;project_id:number;source_fingerprint:string;input_key:string;input_sha256:string;input_mime:string;input_bytes:number;status:string;device_id:string|null;lease_hash:string|null;lease_expires_at:number|null;attempts:number;result_key:string|null;result_sha256:string|null;result_bytes:number|null;result_width:number|null;result_height:number|null;error_code:string|null;created_at:number;updated_at:number};
type Source={projectId:number;sourceFingerprint:string;key:string;variant:string;mediaId:string};
type Snapshot={draft_json:string;published_json:string|null};
const missing=()=>new HttpError(404,'helper_job_missing','That thumbnail job was not found.');
const conflict=()=>new HttpError(409,'helper_lease_invalid','The job lease expired or changed. Poll for another job.');
const label=(value:unknown,fallback:string,max=80)=>typeof value==='string'&&value.trim()&&value.length<=max&&!/[\u0000-\u001f]/.test(value)?value.trim():fallback;
const text=(value:unknown)=>typeof value==='string'?value:'';
const modelStatus=(value:unknown)=>['ready','loading','failed','missing'].includes(String(value))?String(value):'missing';

/** The original chosen thumbnail remains the source. Derived gridThumb never participates. */
export async function thumbnailSource(env: Env,project:RecordValue):Promise<Source|null> {
  if (reviewedSticker(project)) return null;
  const source=text(project.thumbWebp)||text(project.thumbAvif)||text(project.poster);
  if(!Number.isSafeInteger(project.id)||!source)return null;
  let url:URL;try{url=new URL(source,env.SITE_ORIGIN);}catch{return null;}
  if(url.origin!==new URL(env.SITE_ORIGIN).origin||url.search||url.hash)return null;
  const match=/^\/media\/([a-f0-9-]{36})\/(preview|original)$/.exec(url.pathname);
  // Existing static transparent portfolio assets are preserved. No remote fetches.
  if(!match)return null;
  const original=text(project.full)||text(project.heroWebp)||text(project.heroAvif);
  const sourceFingerprint=await digest(JSON.stringify([project.id,url.pathname,original,SETTINGS]));
  return {projectId:Number(project.id),sourceFingerprint,key:`${match[1]}/${match[2]}`,variant:match[2],mediaId:match[1]};
}
async function snapshots(env:Env) {
  const row=await env.DB.prepare('SELECT draft_json,published_json FROM cms_state WHERE id=1').first<Snapshot>();
  return row?[JSON.parse(row.draft_json),...(row.published_json?[JSON.parse(row.published_json)]:[]) ] as Content[]:[];
}
async function matchesCurrent(env:Env,job:Job,publishedOnly=false) {
  const all=await snapshots(env);
  const docs=publishedOnly?(all.length===2?[all[1]]:[]):all;
  for(const content of docs)for(const project of content.projects){if(Number(project.id)===job.project_id&&(await thumbnailSource(env,project))?.sourceFingerprint===job.source_fingerprint)return true;}
  return false;
}
/** Idempotent reconciliation after owner saves/publishes. Never writes content or originals. */
export async function reconcileThumbnailJobs(env:Env) {
  const docs=await snapshots(env),seen=new Set<string>(),sources:Source[]=[];
  for(const content of docs)for(const project of content.projects) {
    const source=await thumbnailSource(env,project);
    if(source&&!seen.has(source.sourceFingerprint)){seen.add(source.sourceFingerprint);sources.push(source);}
  }
  if(!sources.length)return {queued:0};
  const rows=await env.DB.prepare('SELECT * FROM cms_thumbnail_jobs WHERE source_fingerprint IN (SELECT value FROM json_each(?))').bind(JSON.stringify(sources.map(source=>source.sourceFingerprint))).all<Job>();
  const bySource=new Map(rows.results.map(job=>[job.source_fingerprint,job]));
  const newIds=[...new Set(sources.filter(source=>!bySource.has(source.sourceFingerprint)).map(source=>source.mediaId))];
  type SourceMedia={id:string;mime:string;size:number;preview_mime:string;preview_size:number;original_uploaded:number;preview_uploaded:number};
  const mediaRows=newIds.length?await env.DB.prepare('SELECT id,mime,size,preview_mime,preview_size,original_uploaded,preview_uploaded FROM cms_media WHERE id IN (SELECT value FROM json_each(?))').bind(JSON.stringify(newIds)).all<SourceMedia>():null;
  const byMedia=new Map((mediaRows?.results||[]).map(media=>[media.id,media]));
  let queued=0,handled=0;
  for(const source of sources) {
    const existing=bySource.get(source.sourceFingerprint);
    if(existing) {
      if(existing.status==='stale') {
        if(handled>=8)break;handled++;
        const input=await env.MEDIA.head(existing.input_key);
        if(input&&input.size===existing.input_bytes&&existing.input_bytes<=MAX_OUTPUT_BYTES&&/^[a-f0-9]{64}$/.test(existing.input_sha256)&&['image/png','image/jpeg','image/webp'].includes(existing.input_mime)) {
          // Reselecting a former source revives its immutable input, without reviving an old lease.
          const revived=await env.DB.prepare(`UPDATE cms_thumbnail_jobs SET status='queued',device_id=NULL,lease_hash=NULL,lease_expires_at=NULL,attempts=0,error_code=NULL,updated_at=? WHERE id=? AND status='stale' AND source_fingerprint=?`).bind(now(),existing.id,source.sourceFingerprint).run();
          if(revived.meta.changes)queued++;
        }
      }
      continue;
    }
    const media=byMedia.get(source.mediaId);if(!media)continue;
    const mime=source.variant==='preview'?media.preview_mime:media.mime,size=source.variant==='preview'?media.preview_size:media.size,uploaded=source.variant==='preview'?media.preview_uploaded:media.original_uploaded;
    if(uploaded!==1)continue;
    // Eight candidates bound storage subrequests even when an input is unavailable.
    if(handled>=8)break;handled++;
    if(!['image/png','image/jpeg','image/webp'].includes(mime)||size<16||size>MAX_OUTPUT_BYTES) {
      const time=now();
      await env.DB.prepare(`INSERT OR IGNORE INTO cms_thumbnail_jobs(id,project_id,source_fingerprint,input_key,input_sha256,input_mime,input_bytes,status,error_code,created_at,updated_at) VALUES (?,?,?,?,'',?,?,'failed','input_unsupported',?,?)`).bind(crypto.randomUUID(),source.projectId,source.sourceFingerprint,source.key,mime,size,time,time).run();
      continue;
    }
    const input=await env.MEDIA.get(source.key);if(!input||input.size!==size)continue;
    // All supported inputs are capped at 2 MiB. Copying makes the job snapshot independently immutable.
    const bytes=new Uint8Array(await input.arrayBuffer()),sha256=hex(await crypto.subtle.digest('SHA-256',bytes)),id=crypto.randomUUID(),inputKey=`helper/${id}/input`;
    await env.MEDIA.put(inputKey,bytes,{httpMetadata:{contentType:mime,cacheControl:'private, no-store'}});
    const time=now();
    const added=await env.DB.prepare(`INSERT OR IGNORE INTO cms_thumbnail_jobs(id,project_id,source_fingerprint,input_key,input_sha256,input_mime,input_bytes,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,'queued',?,?)`).bind(id,source.projectId,source.sourceFingerprint,inputKey,sha256,mime,size,time,time).run();
    if(added.meta.changes)queued++;
  }
  return {queued};
}
export async function overlayThumbnails(env:Env,content:Content):Promise<Content> {
  const sources=await Promise.all(content.projects.map(project=>thumbnailSource(env,project)));
  if(!sources.some(Boolean))return content;
  const rows=await env.DB.prepare('SELECT * FROM cms_thumbnail_jobs WHERE source_fingerprint IN (SELECT value FROM json_each(?))').bind(JSON.stringify(sources.filter(Boolean).map(source=>source!.sourceFingerprint))).all<Job>();
  const bySource=new Map(rows.results.map(job=>[`${job.project_id}:${job.source_fingerprint}`,job]));
  const projects=await Promise.all(content.projects.map(async project=>{
    const source=await thumbnailSource(env,project);if(!source)return project;
    const job=bySource.get(`${source.projectId}:${source.sourceFingerprint}`),status=job?.status==='ready'&&job.result_key?'ready':job?.status==='working'?'processing':job?.status==='failed'?'failed':'queued';
    return {...project,thumbnailStatus:status,gridThumb:status==='ready'?`/helper-media/${job!.id}.png`:null};
  }));
  return {...content,projects};
}
async function helperDevice(env:Env,request:Request) {
  const header=request.headers.get('Authorization')||'';
  if(!/^Bearer [a-f0-9]{64}$/.test(header))throw new HttpError(401,'helper_auth_required','Pair this helper with the website first.');
  // Native helper requests do not have a browser Origin. Cookies never grant helper scope.
  if(request.headers.has('Origin'))throw new HttpError(403,'helper_origin_denied','Use the paired PC helper for this request.');
  const device=await env.DB.prepare('SELECT * FROM cms_helper_devices WHERE token_hash=? AND revoked_at IS NULL').bind(await digest(header.slice(7))).first<Device>();
  if(!device)throw new HttpError(401,'helper_revoked','This helper is no longer paired. Pair it again from the editor.');
  await rateLimit(env,request,'helper-device',120,60,device.id);
  return device;
}
async function leasedJob(env:Env,device:Device,id:string,raw:string) {
  if(!UUID.test(id)||!/^[a-f0-9]{64}$/.test(raw))throw conflict();
  const job=await env.DB.prepare('SELECT * FROM cms_thumbnail_jobs WHERE id=? AND status=\'working\' AND device_id=? AND lease_expires_at>?').bind(id,device.id,now()).first<Job>();
  if(!job||!job.lease_hash||!safeEqual(await digest(raw),job.lease_hash))throw conflict();
  return job;
}
async function requeueExpired(env:Env) {
  await env.DB.prepare(`UPDATE cms_thumbnail_jobs SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,device_id=NULL,lease_hash=NULL,lease_expires_at=NULL,error_code='lease_expired',updated_at=? WHERE status='working' AND lease_expires_at<=?`).bind(now(),now()).run();
}
async function pair(env:Env,request:Request) {
  if(request.headers.has('Origin'))throw new HttpError(403,'helper_origin_denied','Pair from the PC helper.');
  await rateLimit(env,request,'helper-pair',8,600);
  await rateLimit(env,request,'helper-pair-global',60,600,'owner');
  const body=await readJson(request,2048),code=text(body.pairingCode).replace(/[\s-]/g,'').toUpperCase();
  if(!/^[A-F0-9]{10}$/.test(code))throw new HttpError(403,'pairing_invalid','The pairing code is invalid or expired.');
  const time=now(),codeHash=await digest(code),id=crypto.randomUUID(),raw=token();
  const result=await env.DB.batch([
    env.DB.prepare('UPDATE cms_helper_pairings SET consumed_at=? WHERE code_hash=? AND consumed_at IS NULL AND expires_at>?').bind(time,codeHash,time),
    env.DB.prepare(`INSERT INTO cms_helper_devices(id,name,version,token_hash,last_seen_at,created_at) SELECT ?,?,?,?,?,? WHERE changes()=1`).bind(id,label(body.deviceName,'Windows PC'),label(body.version,'unknown',40),await digest(raw),time,time)
  ]);
  if(!result[0].meta.changes)throw new HttpError(403,'pairing_invalid','The pairing code is invalid or expired.');
  return json({deviceId:id,token:raw},201);
}
export async function adminHelperRoute(env:Env,request:Request,action:string) {
  if(action==='helper/pairing'&&request.method==='POST') {
    await rateLimit(env,request,'helper-pair-create',6,600,'owner');
    const time=now(),code=token().slice(0,10).toUpperCase();
    await env.DB.batch([env.DB.prepare('UPDATE cms_helper_pairings SET expires_at=? WHERE consumed_at IS NULL').bind(time),env.DB.prepare('INSERT INTO cms_helper_pairings(code_hash,expires_at,created_at) VALUES (?,?,?)').bind(await digest(code),time+600,time)]);
    return json({pairingCode:code,expiresAt:time+600},201);
  }
  if(action==='helper'&&request.method==='GET') {
    await reconcileThumbnailJobs(env);
    await requeueExpired(env);
    const devices=await env.DB.prepare('SELECT id,name,version,paused,local_paused,model_status,revoked_at,last_seen_at,created_at FROM cms_helper_devices ORDER BY created_at DESC LIMIT 20').all<Device>();
    const jobs=await env.DB.prepare('SELECT id,project_id,source_fingerprint,status,attempts,error_code,created_at,updated_at FROM cms_thumbnail_jobs ORDER BY created_at DESC LIMIT 600').all<Job>();
    const release=await helperRelease(env),verified=!!release;
    return json({devices:devices.results.map(d=>({id:d.id,name:d.name,version:d.version,paused:!!d.paused,localPaused:!!d.local_paused,modelStatus:d.model_status,lastSeenAt:d.last_seen_at,online:!d.revoked_at&&now()-d.last_seen_at<=60,revokedAt:d.revoked_at,createdAt:d.created_at})),jobs:jobs.results.map(j=>({id:j.id,projectId:j.project_id,sourceFingerprint:j.source_fingerprint,status:j.status,attempts:j.attempts,errorCode:j.error_code,createdAt:j.created_at,updatedAt:j.updated_at})),download:{ready:verified,url:verified?'/downloads/ashvini-helper.exe':null,sha256:release?.sha256??null,version:release?.version??null,size:release?.size??null,platform:'windows-amd64'},model:{id:'birefnet-general-lite',execution:'local',status:'device-managed'}});
  }
  const device=/^helper\/devices\/([a-f0-9-]{36})\/(revoke|pause)$/.exec(action);
  if(device&&request.method==='POST') {
    const body=await readJson(request,1024),time=now();
    if(device[2]==='pause'&&typeof body.paused!=='boolean')throw new HttpError(422,'pause_invalid','Choose pause or resume.');
    const changed=device[2]==='revoke'?await env.DB.prepare('UPDATE cms_helper_devices SET revoked_at=? WHERE id=? AND revoked_at IS NULL').bind(time,device[1]).run():await env.DB.prepare('UPDATE cms_helper_devices SET paused=? WHERE id=? AND revoked_at IS NULL').bind(body.paused?1:0,device[1]).run();
    if(!changed.meta.changes)throw new HttpError(404,'helper_device_missing','That paired helper was not found.');
    if(device[2]==='revoke')await env.DB.prepare(`UPDATE cms_thumbnail_jobs SET status=CASE WHEN attempts>=3 THEN 'failed' ELSE 'queued' END,device_id=NULL,lease_hash=NULL,lease_expires_at=NULL,updated_at=? WHERE device_id=? AND status='working'`).bind(time,device[1]).run();
    return json({updated:true});
  }
  if(action==='helper/retry'&&request.method==='POST') {
    const body=await readJson(request,1024);if(!UUID.test(text(body.jobId)))throw missing();
    const result=await env.DB.prepare(`UPDATE cms_thumbnail_jobs SET status='queued',attempts=0,error_code=NULL,updated_at=? WHERE id=? AND status='failed' AND error_code IN ('processing_failed','lease_expired')`).bind(now(),body.jobId).run();
    if(!result.meta.changes)throw new HttpError(409,'helper_retry_invalid','Only failed thumbnail jobs can be retried.');
    return json({updated:true});
  }
  throw missing();
}
export async function helperRoute(env:Env,request:Request,action:string) {
  if(action==='pair'&&request.method==='POST')return pair(env,request);
  const device=await helperDevice(env,request);
  if(action==='claim'&&request.method==='POST') {
    const body=await readJson(request,2048);
    if(typeof body.paused!=='boolean')throw new HttpError(422,'pause_invalid','Send the helper pause state.');
    await env.DB.prepare('UPDATE cms_helper_devices SET last_seen_at=?,local_paused=?,version=?,model_status=? WHERE id=? AND revoked_at IS NULL').bind(now(),body.paused?1:0,label(body.version,device.version,40),modelStatus(body.modelStatus),device.id).run();
    await requeueExpired(env);
    if(device.paused||body.paused||body.modelStatus!=='ready')return json({job:null,retryAfterSeconds:15,paused:!!device.paused});
    // A lost claim response must expire naturally; never hand out a second concurrent job.
    if(await env.DB.prepare(`SELECT id FROM cms_thumbnail_jobs WHERE device_id=? AND status='working'`).bind(device.id).first())return json({job:null,retryAfterSeconds:15,paused:false});
    const time=now(),raw=token();
    const job=await env.DB.prepare(`UPDATE cms_thumbnail_jobs SET status='working',device_id=?,lease_hash=?,lease_expires_at=?,attempts=attempts+1,error_code=NULL,updated_at=? WHERE id=(SELECT id FROM cms_thumbnail_jobs WHERE status='queued' AND attempts<3 ORDER BY created_at,id LIMIT 1) AND status='queued' AND NOT EXISTS (SELECT 1 FROM cms_thumbnail_jobs WHERE device_id=? AND status='working') AND EXISTS (SELECT 1 FROM cms_helper_devices WHERE id=? AND paused=0 AND local_paused=0 AND revoked_at IS NULL) RETURNING *`).bind(device.id,await digest(raw),time+LEASE_SECONDS,time,device.id,device.id).first<Job>();
    if(!job)return json({job:null,retryAfterSeconds:15,paused:false});
    if(!await matchesCurrent(env,job)){await env.DB.prepare(`UPDATE cms_thumbnail_jobs SET status='stale',lease_hash=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND lease_hash=?`).bind(time,job.id,job.lease_hash).run();return json({job:null,retryAfterSeconds:1,paused:false});}
    return json({job:{id:job.id,leaseToken:raw,leaseExpiresAt:job.lease_expires_at,projectId:job.project_id,sourceFingerprint:job.source_fingerprint,inputUrl:new URL(`/api/helper/jobs/${job.id}/input`,env.SITE_ORIGIN).href,inputSha256:job.input_sha256,inputMime:job.input_mime,inputBytes:job.input_bytes,maxOutputBytes:MAX_OUTPUT_BYTES,maxOutputDimension:MAX_DIMENSION},paused:false});
  }
  const route=/^jobs\/([a-f0-9-]{36})\/(heartbeat|input|result|fail)$/.exec(action);
  if(!route)throw missing();
  const [,id,kind]=route;
  if(kind==='input'&&request.method==='GET') {
    const job=await leasedJob(env,device,id,request.headers.get('X-Job-Lease')||'');
    const input=await env.MEDIA.get(job.input_key);if(!input||input.size!==job.input_bytes)throw missing();
    return new Response(input.body,{headers:{'Content-Type':job.input_mime,'Content-Length':String(input.size),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(['heartbeat','fail'].includes(kind)&&request.method==='POST') {
    const body=await readJson(request,1024),job=await leasedJob(env,device,id,text(body.leaseToken)),time=now();
    await env.DB.prepare('UPDATE cms_helper_devices SET last_seen_at=? WHERE id=? AND revoked_at IS NULL').bind(time,device.id).run();
    if(kind==='heartbeat') {
      const result=await env.DB.prepare(`UPDATE cms_thumbnail_jobs SET lease_expires_at=?,updated_at=? WHERE id=? AND lease_hash=? AND lease_expires_at>? AND status='working'`).bind(time+LEASE_SECONDS,time,id,job.lease_hash,time).run();
      if(!result.meta.changes)throw conflict();
      return json({leaseExpiresAt:time+LEASE_SECONDS,paused:!!device.paused});
    }
    if(!['processing_failed','input_invalid'].includes(String(body.code)))throw new HttpError(422,'helper_error_invalid','Send a supported failure code.');
    const status=job.attempts>=3||body.code==='input_invalid'?'failed':'queued';
    const result=await env.DB.prepare(`UPDATE cms_thumbnail_jobs SET status=?,device_id=NULL,lease_hash=NULL,lease_expires_at=NULL,error_code=?,updated_at=? WHERE id=? AND lease_hash=? AND status='working' AND lease_expires_at>?`).bind(status,body.code,time,id,job.lease_hash,time).run();
    if(!result.meta.changes)throw conflict();return json({jobId:id,status});
  }
  if(kind==='result'&&request.method==='PUT') {
    const job=await leasedJob(env,device,id,request.headers.get('X-Job-Lease')||'');
    if(device.paused)throw new HttpError(409,'helper_paused','The owner paused this helper.');
    if(request.headers.get('Content-Type')!=='image/png')throw new HttpError(415,'cutout_type_invalid','Send a transparent PNG thumbnail.');
    const size=Number(request.headers.get('Content-Length'));
    if(!Number.isSafeInteger(size)||size<57||size>MAX_OUTPUT_BYTES||!request.body)throw new HttpError(413,'cutout_size_invalid','Send a PNG thumbnail smaller than 2 MiB.');
    const bytes=await boundedBytes(request,size),image=await validateCutoutPng(bytes);
    if(!await matchesCurrent(env,job)){await env.DB.prepare(`UPDATE cms_thumbnail_jobs SET status='stale',lease_hash=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND lease_hash=? AND status='working'`).bind(now(),id,job.lease_hash).run();return json({jobId:id,status:'stale'});}
    // A unique object per upload prevents concurrent requests from replacing an accepted result.
    const resultKey=`helper/${id}/results/${crypto.randomUUID()}.png`;
    await env.MEDIA.put(resultKey,bytes,{httpMetadata:{contentType:'image/png',cacheControl:'public, max-age=31536000, immutable'}});
    const result=await env.DB.prepare(`UPDATE cms_thumbnail_jobs SET status='ready',result_key=?,result_sha256=?,result_bytes=?,result_width=?,result_height=?,lease_hash=NULL,lease_expires_at=NULL,updated_at=? WHERE id=? AND lease_hash=? AND status='working' AND lease_expires_at>? AND EXISTS (SELECT 1 FROM cms_helper_devices WHERE id=? AND revoked_at IS NULL AND paused=0)`).bind(resultKey,image.sha256,size,image.width,image.height,now(),id,job.lease_hash,now(),device.id).run();
    if(!result.meta.changes)throw conflict();return json({jobId:id,status:'ready'});
  }
  throw missing();
}
async function boundedBytes(request:Request,expected:number) {
  const reader=request.body!.getReader(),bytes=new Uint8Array(expected);let size=0;
  try{while(true){const {done,value}=await reader.read();if(done)break;if(size+value.length>expected){await reader.cancel();throw new HttpError(413,'cutout_size_invalid','The thumbnail is larger than declared.');}bytes.set(value,size);size+=value.length;}}
  finally{reader.releaseLock();}
  if(size!==expected)throw new HttpError(413,'cutout_size_invalid','The thumbnail upload was incomplete.');return bytes;
}
export async function serveHelperThumbnail(env:Env,request:Request,id:string) {
  const job=await env.DB.prepare(`SELECT * FROM cms_thumbnail_jobs WHERE id=? AND status='ready'`).bind(id).first<Job>();
  if(!job?.result_key)throw missing();
  const isPublic=await matchesCurrent(env,job,true);
  if(!isPublic&&!await getSession(env,request))throw missing();
  const object=await env.MEDIA.get(job.result_key);if(!object)throw missing();
  const headers=new Headers({'Content-Type':'image/png','Content-Length':String(object.size),'Cache-Control':isPublic?'public, max-age=3600':'private, no-store','ETag':object.httpEtag,'X-Content-Type-Options':'nosniff'});
  // Visibility is checked on every request; a removed sensitive image cannot remain publicly cached for a year.
  if(request.headers.get('If-None-Match')===object.httpEtag)return new Response(null,{status:304,headers});
  return new Response(request.method==='HEAD'?null:object.body,{headers});
}

// A release manifest is uploaded only after the operator verifies the hosted EXE bytes.
export async function helperRelease(env:Env):Promise<{sha256:string;version:string;size:number}|null> {
  const manifest=await env.MEDIA.get('downloads/helper-release.json');
  if(!manifest||manifest.size>4096)return null;
  try {
    const value:unknown=JSON.parse(await manifest.text());
    if(!value||typeof value!=='object'||Array.isArray(value))return null;
    const entry=value as Record<string,unknown>;
    if(entry.buildVerified!==true||typeof entry.sha256!=='string'||!/^[a-f0-9]{64}$/.test(entry.sha256)||typeof entry.version!=='string'||!/^\d+\.\d+\.\d+$/.test(entry.version)||!Number.isSafeInteger(entry.size)||Number(entry.size)<1||Number(entry.size)>128*1024*1024)return null;
    const file=await env.MEDIA.head('downloads/ashvini-helper.exe');
    return file&&file.size===entry.size?{sha256:entry.sha256,version:entry.version,size:Number(entry.size)}:null;
  }catch{return null;}
}
export async function serveHelperDownload(env:Env,request:Request) {
  if(!await helperRelease(env))throw new HttpError(404,'helper_download_pending','The verified helper download is not ready yet.');
  const range=request.headers.get('Range'),file=await env.MEDIA.get('downloads/ashvini-helper.exe',range?{range:request.headers}:{});
  if(!file)throw missing();
  const headers=new Headers({'Content-Type':'application/octet-stream','Content-Disposition':'attachment; filename="AshviniHelperSetup.exe"','X-Content-Type-Options':'nosniff','Cache-Control':'public, max-age=3600','Accept-Ranges':'bytes','ETag':file.httpEtag,'Content-Length':String(file.size)});
  if(!range&&request.headers.get('If-None-Match')===file.httpEtag)return new Response(null,{status:304,headers});
  let status=200;
  if(range&&file.range&&'offset' in file.range&&'length' in file.range){const offset=file.range.offset||0,length=file.range.length||0;headers.set('Content-Range',`bytes ${offset}-${offset+length-1}/${file.size}`);headers.set('Content-Length',String(length));status=206;}
  return new Response(request.method==='HEAD'?null:file.body,{status,headers});
}
