import { HttpError, hex } from './security';

export const MAX_OUTPUT_BYTES = 2 * 1024 * 1024;
export const MAX_DIMENSION = 1600;
const invalid = (): never => { throw new HttpError(422,'cutout_invalid','Send a valid transparent RGBA PNG thumbnail.'); };
const uint32 = (bytes: Uint8Array, offset: number) => new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength).getUint32(offset);
function crc32(bytes: Uint8Array) {
  let crc=0xffffffff;
  for(const byte of bytes) { crc ^= byte; for(let i=0;i<8;i++) crc=(crc>>>1)^((crc&1)?0xedb88320:0); }
  return (crc^0xffffffff)>>>0;
}
function paeth(a:number,b:number,c:number) { const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c); return pa<=pb&&pa<=pc?a:pb<=pc?b:c; }
/** Decode bounded PNG scanlines to verify real transparency, not merely an alpha-capable header. */
export async function validateCutoutPng(bytes: Uint8Array) {
  if(bytes.length<57||bytes.length>MAX_OUTPUT_BYTES||![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)) invalid();
  let offset=8,width=0,height=0,end=false,seenData=false,dataEnded=false;
  const chunks:Uint8Array[]=[];
  while(offset<bytes.length) {
    if(offset+12>bytes.length) invalid();
    const length=uint32(bytes,offset),finish=offset+12+length;
    if(finish>bytes.length) invalid();
    const type=new TextDecoder().decode(bytes.subarray(offset+4,offset+8)),data=bytes.subarray(offset+8,offset+8+length);
    if(crc32(bytes.subarray(offset+4,offset+8+length))!==uint32(bytes,offset+8+length)) invalid();
    if(offset===8&&type!=='IHDR') invalid();
    if(type==='IHDR') {
      if(offset!==8||length!==13) invalid();
      width=uint32(data,0);height=uint32(data,4);
      if(width<16||height<16||width>MAX_DIMENSION||height>MAX_DIMENSION||data[8]!==8||data[9]!==6||data[10]!==0||data[11]!==0||data[12]!==0) invalid();
    } else if(type==='IDAT') {
      if(dataEnded) invalid(); seenData=true; chunks.push(data);
    } else if(type==='IEND') { if(length!==0||!seenData||finish!==bytes.length) invalid(); end=true; }
    else { if(seenData) dataEnded=true; if(!/^[a-z][A-Za-z]{3}$/.test(type)) invalid(); }
    offset=finish;
  }
  if(!end||!width||!height) invalid();
  const compressed=new Uint8Array(chunks.reduce((sum,chunk)=>sum+chunk.length,0));let start=0;
  for(const chunk of chunks){compressed.set(chunk,start);start+=chunk.length;}
  const rowBytes=width*4,expected=(rowBytes+1)*height;
  const decoded=new Uint8Array(expected);let size=0;
  try {
    const stream=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate'));
    const reader=stream.getReader();
    try { while(true){const {done,value}=await reader.read();if(done)break;if(size+value.length>expected){await reader.cancel();invalid();}decoded.set(value,size);size+=value.length;} }
    finally {reader.releaseLock();}
  } catch { invalid(); }
  if(size!==expected) invalid();
  let previous=new Uint8Array(rowBytes),transparent=0,visible=0;
  for(let y=0;y<height;y++) {
    const pos=y*(rowBytes+1),filter=decoded[pos],row=decoded.subarray(pos+1,pos+1+rowBytes);
    if(filter>4) invalid();
    for(let x=0;x<rowBytes;x++) {
      const left=x>=4?row[x-4]:0,above=previous[x],upperLeft=x>=4?previous[x-4]:0;
      const predictor=filter===0?0:filter===1?left:filter===2?above:filter===3?Math.floor((left+above)/2):paeth(left,above,upperLeft);
      row[x]=(row[x]+predictor)&255;
      if(x%4===3){if(row[x]===0)transparent++;if(row[x]>0)visible++;}
    }
    previous=row;
  }
  if(transparent<Math.ceil(width*height/100)||visible<Math.ceil(width*height/100)) invalid();
  return {width,height,sha256:hex(await crypto.subtle.digest('SHA-256',bytes))};
}
