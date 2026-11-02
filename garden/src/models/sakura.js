import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Airy, asymmetrical branching with small individual flowers in uneven drifts. */
export function createSakura({seed=712,scale=1}={}){
 const group=new THREE.Group();group.name='branching-cherry-tree';group.userData.sakura=true;
 let state=seed;const random=()=>{state=state*16807%2147483647;return(state-1)/2147483646;};const between=(a,b)=>a+(b-a)*random();
 const batches=new Map();function add(geo,color){geo.scale(scale,scale,scale);if(geo.index)geo=geo.toNonIndexed();geo.deleteAttribute('uv');if(!batches.has(color))batches.set(color,[]);batches.get(color).push(geo);}
 const up=new THREE.Vector3(0,1,0);
 function branch(a,b,r1,r2){const delta=b.clone().sub(a),geo=new THREE.CylinderGeometry(r2,r1,delta.length(),6);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(up,delta.normalize()));geo.translate(...a.clone().add(b).multiplyScalar(.5).toArray());add(geo,r1>.06?'#735b49':'#896c55');}
 function blossom(center,r){
  const tilt=new THREE.Quaternion().setFromEuler(new THREE.Euler(between(-.65,.65),random()*6.28,between(-.6,.6))),color=['#ddb3b7','#e7c3bf','#d4a3ae'][Math.floor(random()*3)];
  for(let i=0;i<5;i++){
   const a=i*Math.PI*2/5,points=[0,0,0,Math.cos(a-.45)*r*.72,r*.1,Math.sin(a-.45)*r*.72,Math.cos(a-.15)*r,r*.24,Math.sin(a-.15)*r,Math.cos(a+.15)*r,r*.24,Math.sin(a+.15)*r,Math.cos(a+.45)*r*.72,r*.1,Math.sin(a+.45)*r*.72];
   const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setIndex([0,1,2,0,2,3,0,3,4]);geo.applyQuaternion(tilt);geo.translate(...center.toArray());geo.computeVertexNormals();add(geo,color);
  }
  const core=new THREE.IcosahedronGeometry(r*.15,0);core.translate(center.x,center.y+.008,center.z);add(core,'#c99c9a');
 }
 const trunk=[new THREE.Vector3(0,0,0),new THREE.Vector3(.16,.75,.03),new THREE.Vector3(.07,1.46,.08),new THREE.Vector3(.32,2.05,-.04),new THREE.Vector3(.2,2.62,-.08)];
 for(let i=1;i<trunk.length;i++)branch(trunk[i-1],trunk[i],.2-i*.035,.165-i*.034);
 // One long lateral limb, shorter counterweight and an off-center upper crown.
 const limbs=[{a:0.12,l:2.05,y:1.22,rise:.7},{a:2.95,l:1.63,y:1.4,rise:.85},{a:4.3,l:1.6,y:1.6,rise:.82},{a:1.35,l:1.4,y:1.75,rise:.55},{a:5.65,l:1.37,y:1.95,rise:.85},{a:2.3,l:1.06,y:2.15,rise:.92},{a:3.65,l:1.05,y:1.02,rise:.64}];
 for(let n=0;n<limbs.length;n++){
  const limb=limbs[n],start=new THREE.Vector3(.1,limb.y,.04),elbow=start.clone().add(new THREE.Vector3(Math.cos(limb.a)*limb.l*.48,limb.rise*.67,Math.sin(limb.a)*limb.l*.48)),tip=start.clone().add(new THREE.Vector3(Math.cos(limb.a)*limb.l,limb.rise,Math.sin(limb.a)*limb.l));
  branch(start,elbow,.075,.04);branch(elbow,tip,.04,.013);
  for(let j=0;j<4;j++){
   const origin=elbow.clone().lerp(tip,.12+j*.25),angle=limb.a+(j%2?1:-1)*between(.4,.95),length=between(.36,.68),fork=origin.clone().add(new THREE.Vector3(Math.cos(angle)*length,between(.2,.48),Math.sin(angle)*length));branch(origin,fork,.021,.006);
   for(let k=0;k<2;k++){
    const twStart=origin.clone().lerp(fork,.4+k*.35),twEnd=twStart.clone().add(new THREE.Vector3(Math.cos(angle+.5)*.25,between(-.08,.2),Math.sin(angle+.5)*.25));branch(twStart,twEnd,.009,.003);
    // Some twigs stay bare; others carry unequal clusters, never a solid pink canopy.
    if(random()<.15)continue;
    const flowers=18+Math.floor(random()*21);
    for(let f=0;f<flowers;f++){const t=between(.1,1.15),p=twStart.clone().lerp(twEnd,t);p.add(new THREE.Vector3(between(-.15,.15),between(-.07,.14),between(-.15,.15)));blossom(p,between(.065,.095));}
   }
  }
 }
 for(const [color,geometries]of batches){const geometry=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());const mesh=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true,side:THREE.DoubleSide}));mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);}
 return group;
}
