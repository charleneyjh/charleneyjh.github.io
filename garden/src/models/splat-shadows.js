import * as THREE from 'three';

// Shadow-only geometry: splats do not participate in Three.js shadow maps.
// Open frames preserve light through the glass and floral arch.
const material = new THREE.MeshStandardMaterial({colorWrite:false,depthWrite:false});
function rod(group,a,b,r=.045){
  const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start);
  const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),6),material);
  mesh.position.copy(start.add(end).multiplyScalar(.5));
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
  mesh.castShadow=true;group.add(mesh);
}
export function addSplatShadow(container,width,height,depth,type){
  const group=new THREE.Group();group.name=type+'-shadow-proxy';container.add(group);
  const w=width*.92,d=depth*.88,h=height*.9;
  if(type==='greenhouse'){
    // Transparent roof silhouette represented by ribs, not a solid opaque box.
    for(let i=0;i<6;i++){
      const z=-d/2+i*d/5;
      const pts=[];
      for(let j=0;j<=16;j++){
        const t=j/16*Math.PI;
        pts.push([-Math.cos(t)*w*.31,h*.32+Math.sin(t)*h*.68,z]);
      }
      rod(group,[pts[0][0],0,z],pts[0]);
      rod(group,[pts[16][0],0,z],pts[16]);
      for(let j=1;j<pts.length;j++)rod(group,pts[j-1],pts[j],.035);
    }
    for(const x of [-w*.48,w*.48])for(const z of [-d*.4,d*.4])rod(group,[x,0,z],[x,h*.42,z]);
    for(const x of [-w*.31,0,w*.31])rod(group,[x,h*(x===0?1:.32),-d/2],[x,h*(x===0?1:.32),d/2],.035);
  }else{
    const r=w*.46;
    for(const x of [-r,r])rod(group,[x,0,0],[x,h-r,0],.08);
    for(let j=0;j<20;j++){
      const a=j/20*Math.PI,b=(j+1)/20*Math.PI;
      rod(group,[Math.cos(a)*r,h-r+Math.sin(a)*r,0],[Math.cos(b)*r,h-r+Math.sin(b)*r,0],.09);
    }
  }
  // Soft contact shadow makes the feet meet the ground without dark solid roofs.
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const ctx=canvas.getContext('2d');const gradient=ctx.createRadialGradient(64,64,12,64,64,64);
  gradient.addColorStop(0,'rgba(33,44,27,0.28)');gradient.addColorStop(1,'rgba(33,44,27,0)');
  ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(width*1.12,depth*1.15),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false}));
  contact.rotation.x=-Math.PI/2;contact.position.y=.006;group.add(contact);
}
