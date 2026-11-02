import * as THREE from 'three';
import {createMixedBorder} from '../models/mixed-border.js';

export function createWingFlowerBeds(){
 const group=new THREE.Group();group.name='greenhouse-wing-flower-beds';
 const edging=new THREE.MeshStandardMaterial({color:'#b9b49d',roughness:1,flatShading:true});
 const soil=new THREE.MeshStandardMaterial({color:'#87745f',roughness:1});
 let seed=621;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 function box(parent,x,y,z,w,h,d,material){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);}
 for(const [x,z,width,depth]of [[-3.65,-1.82,2.2,.95],[3.4,-1.3,2.65,1]]){
  const bed=new THREE.Group();bed.position.set(x,0,z);group.add(bed);
  box(bed,0,-.008,0,width,.065,depth,soil);
  for(const dz of [-depth/2,depth/2]){
   const n=Math.ceil(width/.29);for(let i=0;i<n;i++)box(bed,-width/2+(i+.5)*width/n,.035,dz,width/n-.008,.16,.095,edging);
  }
  for(const dx of [-width/2,width/2])box(bed,dx,.035,0,.095,.16,depth,edging);
  const plants=[];
  // Broad flower groups remain inside the bed, with taller stems near the glass.
  for(let i=0;i<45;i++){
   const px=(random()-.5)*(width-.5),pz=(random()-.5)*(depth-.43),back=pz<-.08;
   const type=back?(i%3?'cosmos':'salvia'):(i%4?'daisy':'foliage');
   plants.push({x:px,z:pz,y:.025,type,height:type==='foliage'?.26:back?.43+random()*.19:.2+random()*.17});
  }
  for(let i=0;i<12;i++)plants.push({x:(random()-.5)*(width-.5),z:(random()-.5)*(depth-.44),y:.025,type:'foliage',height:.22+random()*.08});
  bed.add(createMixedBorder({seed:seed+83,plants}));
 }
 return group;
}
