import * as THREE from 'three';

export function createGardenLife(scene,camera,route,sakuras,fountain,reduced){
 const petalGeo=new THREE.PlaneGeometry(.07,.045);petalGeo.rotateX(Math.PI/2);
 const petalMesh=new THREE.InstancedMesh(petalGeo,new THREE.MeshStandardMaterial({color:'#dab7bb',side:THREE.DoubleSide,roughness:1}),160);petalMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);petalMesh.frustumCulled=false;scene.add(petalMesh);
 const dummy=new THREE.Object3D(),petals=[];let petalIndex=0,lastEmission=0;
 for(let i=0;i<160;i++){dummy.position.set(0,-100,0);dummy.updateMatrix();petalMesh.setMatrixAt(i,dummy.matrix);}
 for(const tree of sakuras){tree.userData.interaction='sakura';const canopyHit=new THREE.Mesh(new THREE.SphereGeometry(1.9,8,6),new THREE.MeshBasicMaterial({visible:false}));canopyHit.position.y=2.35;tree.add(canopyHit);}
 let hovered=null,flowStrength=0,lastTime=0,burstTree=null,burstUntil=0;
 function hover(object){hovered=object;}
 // Taps have no lasting hover, so they trigger one short, self-ending response.
 function interact(object){if(object?.userData.interaction==='sakura'){burstTree=object;burstUntil=lastTime+1.4;}}
 function emit(tree,time){for(let j=0;j<3;j++){const i=petalIndex++%160,a=i*2.399;petals[i]={x:tree.position.x+Math.cos(a)*(1+(i%5)*.18),y:2.1+(i%9)*.15,z:tree.position.z+Math.sin(a)*1.4,born:time,phase:i};}}
 function update(time){
  const dt=Math.min(.05,Math.max(0,time-lastTime));lastTime=time;flowStrength=THREE.MathUtils.damp(flowStrength,hovered===fountain?1:0,3,dt);
  const petalTree=hovered?.userData.interaction==='sakura'?hovered:time<burstUntil?burstTree:null;
  if(!reduced&&petalTree&&time-lastEmission>.12){emit(petalTree,time);lastEmission=time;}
  petalMesh.visible=time-lastEmission<6&&lastEmission>0;
  if(petalMesh.visible){for(let i=0;i<160;i++){const petal=petals[i],age=petal?time-petal.born:100;dummy.scale.setScalar(age<6?1:0);if(age<6){dummy.position.set(petal.x+age*.15+Math.sin(age*2+petal.phase)*.2,Math.max(.03,petal.y-age*.55),petal.z+Math.sin(age+petal.phase)*.3);dummy.rotation.set(age*2,age+petal.phase,Math.sin(age));}dummy.updateMatrix();petalMesh.setMatrixAt(i,dummy.matrix);}petalMesh.instanceMatrix.needsUpdate=true;}
  if(fountain.userData.flowMaterial)fountain.userData.flowMaterial.opacity=flowStrength*.62;
  if(fountain.userData.jet)fountain.userData.jet.visible=flowStrength>.015;
  if(fountain.userData.flowTexture&&!reduced)fountain.userData.flowTexture.offset.y=-time*.45;
  if(fountain.userData.ripple){fountain.userData.ripple.visible=flowStrength>.015;const scale=1+flowStrength*.3+(reduced?0:Math.sin(time*1.5)*.04);fountain.userData.ripple.scale.setScalar(scale);}

 }
 return {targets:[...sakuras,fountain],hover,interact,update};
}
