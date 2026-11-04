/** Lossless gzip transport; decoded bytes are identical to the source PLY. */
export async function loadModelBytes(name, onProgress) {
  const base=import.meta.env.BASE_URL+'models/'+name+'.ply';
  if(typeof DecompressionStream==='undefined') {
    const response=await fetch(base);
    if(!response.ok)throw new Error('Model download failed: '+response.status);
    return new Uint8Array(await response.arrayBuffer());
  }
  const response=await fetch(base+'.gz');
  if(!response.ok)throw new Error('Model download failed: '+response.status);
  const total=Number(response.headers.get('content-length'));
  let loaded=0;
  const progress=new TransformStream({transform(chunk,controller){loaded+=chunk.byteLength;onProgress?.({loaded,total});controller.enqueue(chunk);}});
  const stream=response.body.pipeThrough(progress).pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
