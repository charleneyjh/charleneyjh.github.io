import * as THREE from 'three';

// Poses blend toward one another; behaviour only chooses the target.
const POSES={
 stand:{y:.23,pitch:0,roll:0,front:0,rear:0,head:0},
 sit:{y:.19,pitch:-.52,roll:0,front:.52,rear:1.35,head:.42},
 nap:{y:.1,pitch:0,roll:0,front:-1.45,rear:1.45,head:.5},
 lie:{y:.11,pitch:0,roll:0,front:-1.2,rear:1.2,head:0},
 belly:{y:.13,pitch:0,roll:2.7,front:-.55,rear:.45,head:-.15}
};
const ROLL={look:.45,down:1.1,hold:3,up:3.7,end:4.2};

/** A small low-poly orange cat that walks a garden route and rolls over when greeted. */
export function createCat(scene,route,reduced){
 const cache=new Map();const mat=color=>{if(!cache.has(color))cache.set(color,new THREE.MeshStandardMaterial({color,roughness:.9,flatShading:true}));return cache.get(color);};
 const sphere=new THREE.IcosahedronGeometry(1,1),cone=new THREE.ConeGeometry(1,1,4),leg=new THREE.CylinderGeometry(.026,.022,.17,6);leg.translate(0,-.085,0);
 function part(parent,geo,color,x,y,z,sx=1,sy=sx,sz=sx){const m=new THREE.Mesh(geo,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=false;m.receiveShadow=true;parent.add(m);return m;}
 const orange='#d98845',stripe='#b9692f',cream='#f0dcb8';
 const root=new THREE.Group();root.name='garden-cat';root.userData.interaction='cat';root.userData.dynamic=true;scene.add(root);
 const body=new THREE.Group();root.add(body);
 part(body,sphere,orange,0,0,0,.12,.105,.24);
 part(body,sphere,cream,0,-.045,.01,.095,.07,.19);
 part(body,sphere,cream,0,-.01,.19,.075,.075,.06);
 for(const z of [-.12,-.04,.04,.12])part(body,new THREE.BoxGeometry(1,1,1),stripe,0,.095,z,.15,.025,.035);
 const head=new THREE.Group();head.position.set(0,.09,.25);body.add(head);
 part(head,sphere,orange,0,0,0,.105,.095,.095);
 part(head,sphere,cream,0,-.03,.075,.055,.04,.04);
 part(head,sphere,'#d99a93',0,-.012,.112,.012,.01,.008);
 for(const x of [-.042,.042]){part(head,sphere,'#2f342c',x,.018,.083,.013,.016,.008);const ear=part(head,cone,orange,x*1.45,.09,-.005,.04,.075,.03);ear.rotation.z=-x*6;part(head,cone,'#e4b39a',x*1.45,.083,.008,.022,.045,.012).rotation.z=-x*6;}
 for(let i=0;i<2;i++)part(head,new THREE.BoxGeometry(1,1,1),stripe,0,.085-i*.025,-.01,.06-i*.02,.012,.06);
 const legs=[];
 for(const [x,z,front]of [[-.065,.15,true],[.065,.15,true],[-.07,-.15,false],[.07,-.15,false]]){
  const hip=new THREE.Group();hip.position.set(x,-.055,z);body.add(hip);
  part(hip,leg,orange,0,0,0);part(hip,sphere,cream,0,-.17,.012,.03,.022,.038);
  legs.push({hip,front,side:Math.sign(x)*(front?1:-1)});
 }
 const tail=new THREE.Group();tail.position.set(0,.04,-.22);body.add(tail);
 const tailCurve=new THREE.CatmullRomCurve3([[0,0,0],[0,.06,-.07],[0,.17,-.11],[.02,.26,-.08]].map(p=>new THREE.Vector3(...p)));
 const tailMesh=new THREE.Mesh(new THREE.TubeGeometry(tailCurve,10,.022,5,false),mat(orange));tailMesh.castShadow=false;tail.add(tailMesh);part(tail,sphere,stripe,.02,.26,-.08,.026);
 // Soft contact shadow follows the cat, because the scene's shadow map is baked once.
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,20),new THREE.MeshBasicMaterial({color:'#3d4a32',transparent:true,opacity:.2,depthWrite:false}));
 shadow.rotation.x=-Math.PI/2;shadow.position.y=-.03;shadow.scale.set(.16,.3,1);root.add(shadow);
 const hit=new THREE.Mesh(new THREE.SphereGeometry(.42,8,6),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=.22;root.add(hit);
 root.scale.setScalar(.95);

 const length=route.getLength(),pose={...POSES.stand},target={...POSES.stand};
 const toCamera=new THREE.Vector3(),tangent=new THREE.Vector3();
 let state=reduced?'sit':'walk',t=.18,dir=1,stride=0,stateUntil=6,lastTime=0,rollStart=0,rollSign=1,cooldownUntil=0,resume='walk';
 function place(){const p=route.getPointAt(t);route.getTangentAt(t,tangent);root.position.set(p.x,-.02,p.z);root.rotation.y=Math.atan2(tangent.x*dir,tangent.z*dir);}
 place();
 function choose(time){
  if(reduced){state='sit';stateUntil=Infinity;return;}
  const r=Math.random();
  if(state!=='walk'){state='walk';stateUntil=time+9+Math.random()*9;}
  else if(r<.62){state='sit';stateUntil=time+4+Math.random()*4;}
  else{state='nap';stateUntil=time+9+Math.random()*6;}
 }
 /** Hover or tap: stop, look, roll over. Repeats during the roll or its cooldown are ignored. */
 function poke(camera,time){
  if(state==='roll'||time<cooldownUntil)return false;
  if(reduced){lookAt(camera,1);return true;}
  resume=state==='nap'?'walk':state;state='roll';rollStart=time;
  // Roll toward the visitor so the belly faces the camera rather than away from it.
  toCamera.copy(camera.position).sub(root.position);const side=new THREE.Vector3(1,0,0).applyQuaternion(root.quaternion);rollSign=side.dot(toCamera)>=0?1:-1;
  return true;
 }
 let lookWeight=0;
 function lookAt(camera,weight){
  toCamera.copy(camera.position).sub(root.position);
  const yaw=Math.atan2(toCamera.x,toCamera.z)-root.rotation.y,wrapped=Math.atan2(Math.sin(yaw),Math.cos(yaw));
  lookWeight=weight;head.userData.yaw=THREE.MathUtils.clamp(wrapped,-1.1,1.1);
 }
 function update(time,camera){
  const dt=Math.min(.05,Math.max(0,time-lastTime));lastTime=time;
  let wiggle=0;
  if(state==='roll'){
   const e=time-rollStart;
   Object.assign(target,e<ROLL.look?POSES.stand:e<ROLL.down?POSES.lie:e<ROLL.hold?POSES.belly:e<ROLL.up?POSES.lie:POSES.stand);
   target.roll=POSES.belly.roll*rollSign*(e>=ROLL.down&&e<ROLL.hold?1:0);
   lookAt(camera,e<ROLL.up?1:0);
   if(e>ROLL.down+.3&&e<ROLL.hold)wiggle=Math.sin((e-ROLL.down)*9)*.35;
   if(e>=ROLL.end){state=resume;stateUntil=time+(resume==='walk'?6+Math.random()*6:2+Math.random()*3);cooldownUntil=time+2.5;}
  }else{
   if(time>stateUntil)choose(time);
   Object.assign(target,POSES[state==='walk'?'stand':state]);
   if(!reduced)lookWeight=0;
  }
  if(state==='walk'){
   const step=.32*dt/length;t+=step*dir;
   if(t>.985||t<.015){t=THREE.MathUtils.clamp(t,.015,.985);dir*=-1;}
   stride+=.32*dt*24;place();
  }
  const k=1-Math.exp(-(state==='roll'?5.5:3.5)*dt);
  for(const key in pose)pose[key]+=(target[key]-pose[key])*k;
  const walking=state==='walk'?1:0,swing=Math.sin(stride)*.55*walking;
  body.position.y=pose.y+Math.abs(Math.sin(stride))*.012*walking;
  body.rotation.set(pose.pitch,0,pose.roll);
  for(const l of legs){
   const base=l.front?pose.front:pose.rear;
   l.hip.rotation.x=base+swing*l.side+wiggle*(l.front?1:-.6)*l.side;
  }
  // The head stays closer to upright than the body while rolling, like a cat watching you.
  head.rotation.set(pose.head,(head.userData.yaw||0)*lookWeight*(1-Math.abs(pose.roll)/4),-pose.roll*.45);
  tail.rotation.set(state==='nap'?1.1:.25+Math.sin(time*1.3)*.08,Math.sin(time*(state==='roll'?3:1.1))*.35,0);
  shadow.scale.set(.16+Math.abs(pose.roll)*.03,.3,1);
 }
 return {object:root,poke,update,get state(){return state;}};
}
