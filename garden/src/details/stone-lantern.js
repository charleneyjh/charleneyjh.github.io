import * as THREE from 'three';

export function createStoneLantern(){
 const group=new THREE.Group();group.name='japanese-stone-lantern';
 const stone=new THREE.MeshStandardMaterial({color:'#a9aa96',roughness:1,flatShading:true});
 const edge=new THREE.MeshStandardMaterial({color:'#b7b7a1',roughness:1,flatShading:true});
 const interior=new THREE.MeshStandardMaterial({color:'#c3baa0',emissive:'#d1bc87',emissiveIntensity:.2,roughness:1});
 function add(geometry,material,y){const m=new THREE.Mesh(geometry,material);m.position.y=y;m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 const footing=add(new THREE.CylinderGeometry(.32,.38,.12,6),stone,.01);footing.rotation.y=.2;
 add(new THREE.CylinderGeometry(.15,.21,.5,6),stone,.31);
 add(new THREE.CylinderGeometry(.3,.21,.13,4),edge,.61).rotation.y=Math.PI/4;
 add(new THREE.BoxGeometry(.46,.08,.46),stone,.72);
 for(const x of [-.185,.185])for(const z of [-.185,.185]){const post=add(new THREE.BoxGeometry(.085,.36,.085),edge,.94);post.position.x=x;post.position.z=z;}
 add(new THREE.BoxGeometry(.25,.27,.25),interior,.93);
 // Dark window openings on all four sides, crossed by slender stone mullions.
 for(let i=0;i<4;i++){
  const face=new THREE.Group();face.rotation.y=i*Math.PI/2;group.add(face);
  const opening=new THREE.Mesh(new THREE.PlaneGeometry(.22,.21),new THREE.MeshStandardMaterial({color:'#6e7563',roughness:1,side:THREE.DoubleSide}));opening.position.set(0,.95,.131);face.add(opening);
  const mullion=new THREE.Mesh(new THREE.BoxGeometry(.025,.22,.025),edge);mullion.position.set(0,.95,.15);face.add(mullion);
 }
 add(new THREE.BoxGeometry(.48,.07,.48),edge,1.15);
 add(new THREE.CylinderGeometry(.14,.63,.2,4),stone,1.3).rotation.y=Math.PI/4;
 add(new THREE.CylinderGeometry(.63,.59,.045,4),edge,1.195).rotation.y=Math.PI/4;
 add(new THREE.CylinderGeometry(.065,.12,.12,6),edge,1.45);
 add(new THREE.IcosahedronGeometry(.09,1),stone,1.55);
 return group;
}
