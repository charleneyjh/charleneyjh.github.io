import * as THREE from 'three';

export function createGardenLights(scene,positions){
 const group=new THREE.Group();group.name='garden-path-lanterns';scene.add(group);
 const metal=new THREE.MeshStandardMaterial({color:'#586251',roughness:.73,metalness:.28});
 const brass=new THREE.MeshStandardMaterial({color:'#aaa183',roughness:.65,metalness:.25});
 const glass=new THREE.MeshPhysicalMaterial({color:'#d9dfc8',transparent:true,opacity:.2,roughness:.18,side:THREE.DoubleSide,depthWrite:false});
 const bulbMaterial=new THREE.MeshStandardMaterial({color:'#f0dfb7',emissive:'#ffe0a5',emissiveIntensity:1.8,roughness:.45});
 const lights=[];
 function mesh(parent,geo,material,x=0,y=0,z=0){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function rod(g,a,b,r,material=metal){const start=new THREE.Vector3(...a),delta=new THREE.Vector3(...b).sub(start);const m=mesh(g,new THREE.CylinderGeometry(r,r,delta.length(),7),material);m.position.copy(start.addScaledVector(delta,.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());}
 for(const [x,z]of positions){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=.3;group.add(g);
  mesh(g,new THREE.CylinderGeometry(.11,.16,.13,8),metal,0,.015);
  mesh(g,new THREE.CylinderGeometry(.035,.06,1.75,8),metal,0,.92);
  mesh(g,new THREE.CylinderGeometry(.07,.07,.045,8),brass,0,.25);
  // Option A: an octagonal lantern centered directly on a slender straight pole.
  mesh(g,new THREE.CylinderGeometry(.07,.045,.09,8),brass,0,1.82);
  mesh(g,new THREE.CylinderGeometry(.18,.09,.09,8),metal,0,1.9);
  mesh(g,new THREE.CylinderGeometry(.195,.195,.045,8),metal,0,1.96);
  mesh(g,new THREE.CylinderGeometry(.17,.17,.42,8,1,true),glass,0,2.19);
  for(let i=0;i<8;i++){
   const a=i*Math.PI/4,x=Math.cos(a)*.17,z=Math.sin(a)*.17;
   rod(g,[x,1.98,z],[x,2.4,z],.011);
  }
  mesh(g,new THREE.CylinderGeometry(.195,.195,.04,8),metal,0,2.42);
  mesh(g,new THREE.CylinderGeometry(.045,.24,.18,8),metal,0,2.52);
  mesh(g,new THREE.CylinderGeometry(.035,.06,.05,8),brass,0,2.635);
  mesh(g,new THREE.IcosahedronGeometry(.048,0),metal,0,2.69);
  const bulb=mesh(g,new THREE.CylinderGeometry(.065,.065,.23,8),bulbMaterial,0,2.18);bulb.castShadow=false;
  const light=new THREE.PointLight('#ffe0a8',1.8,5,2);light.position.set(0,2.16,0);g.add(light);lights.push(light);

 }
 function setLit(lit){bulbMaterial.emissiveIntensity=lit?1.8:0;bulbMaterial.color.set(lit?'#f0dfb7':'#b8bca7');for(const light of lights)light.visible=lit;}
 setLit(true);return {group,setLit};
}
