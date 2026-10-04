import { useEffect, useState } from 'react';
import './HelperPanel.css';

export default function HelperPanel({ request, projects = [] }) {
  const [status,setStatus]=useState(null),[error,setError]=useState(''),[working,setWorking]=useState(false),[pairing,setPairing]=useState(null),[copied,setCopied]=useState(false);
  useEffect(()=>{
    let active=true;
    const refresh=()=>{if(document.hidden)return;request('/api/admin/helper').then(data=>{if(active){setStatus(data);setError('');}}).catch(()=>{if(active)setError('Could not check your PC. Your draft is safe.');});};
    refresh();const timer=setInterval(refresh,15000);return()=>{active=false;clearInterval(timer);};
  },[request]);
  const action=async(path,body={})=>{if(working)return;setWorking(true);setError('');try{const result=await request(path,'POST',body);try{setStatus(await request('/api/admin/helper'));}catch{setError('Change saved. The PC status will refresh shortly.');}return result;}catch(failure){setError(failure.message);}finally{setWorking(false);}};
  const connect=async()=>{const result=await action('/api/admin/helper/pairing');if(result){setPairing(result);setCopied(false);}};
  const devices=status?.devices?.filter(device=>!device.revokedAt)||[];
  const ready=devices.some(device=>device.online&&!device.paused&&!device.localPaused&&device.modelStatus==='ready');
  const pending=status?.jobs?.filter(job=>['queued','processing','leased','working'].includes(job.status)).length||0;
  const failed=status?.jobs?.filter(job=>job.status==='failed').length||0;
  return <details className="cms-helper-panel">
    <summary><strong>Transparent thumbnails</strong><span>{ready?'PC ready':devices.length?'PC not ready':'Connect your PC'}{pending?` · ${pending} waiting`:''}</span></summary>
    <p>Your PC makes the cutouts. Your original images and videos stay unchanged. Choose a cover with the whole object inside the frame, then save your draft to send it for processing.</p>
    {error&&<p role="alert" className="cms-error">{error}</p>}
    <div className="cms-helper-actions">
      {status?.download?.ready&&status.download.url?<a className="cms-helper-download" href={status.download.url} download>Download Windows helper</a>:<span className="cms-muted">Windows installer is being prepared.</span>}
      <button type="button" disabled={working||!status?.download?.ready} onClick={connect}>Connect a PC</button>
    </div>
    <p className="cms-muted">Install once, then enter the connection code in the helper. It can start with Windows if you choose. Keep it running when you upload; you can pause or disconnect it here.</p>
    {pairing&&<div className="cms-helper-pair"><label>Connection code<input readOnly value={pairing.pairingCode} onFocus={event=>event.target.select()} autoComplete="off" spellCheck={false}/></label><button type="button" onClick={async()=>{try{await navigator.clipboard.writeText(pairing.pairingCode);setCopied(true);}catch{setError('Select the code and copy it, then paste it into your PC helper.');}}}>{copied?'Copied':'Copy code'}</button><small>Expires {new Date(pairing.expiresAt*1000).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}. Enter it only in your helper.</small></div>}
    {devices.map(device=><div className="cms-helper-device" key={device.id}><div><strong>{device.name}</strong><small>{device.localPaused?'Paused on PC':device.paused?'Paused from the website':!device.online?'Offline':device.modelStatus==='loading'?'Setting up image processing…':device.modelStatus==='failed'?'Setup needs attention on your PC':device.modelStatus==='ready'?'Connected and ready':'Connected · finish setup on your PC'}</small></div><button type="button" disabled={working||device.localPaused&&!device.paused} onClick={()=>action(`/api/admin/helper/devices/${device.id}/pause`,{paused:!device.paused})}>{device.paused?'Resume':device.localPaused?'Resume on PC':'Pause'}</button><button type="button" disabled={working} onClick={()=>{if(window.confirm(`Disconnect ${device.name}? It will need a new connection code to process more images.`))action(`/api/admin/helper/devices/${device.id}/revoke`);}}>Disconnect</button></div>)}
    {pending>0&&<p role="status">{pending} thumbnail{pending===1?'':'s'} waiting or processing. The site shows a placeholder until a transparent cutout is ready.</p>}
    {failed>0&&<><p>{failed} thumbnail{failed===1?' needs':'s need'} attention. You can retry after checking the helper on your PC.</p>{status.jobs.filter(job=>job.status==='failed').slice(0,5).map(job=><div className="cms-helper-device" key={job.id}><div><strong>{projects.find(project=>project.id===job.projectId)?.title||`Project ${job.projectId}`}</strong><small>{job.errorCode==='input_unsupported'?'Upload a supported cover image and save the draft.':job.errorCode==='input_invalid'?'Choose a complete view of the object, with space around its edges.':'If it fails again, try a clearer cover image.'}</small></div><button type="button" disabled={working||job.errorCode==='input_unsupported'} onClick={()=>action('/api/admin/helper/retry',{jobId:job.id})}>Retry thumbnail</button></div>)}</>}
  </details>;
}
