import * as THREE from 'three';
import {createMixedBorder} from '../models/mixed-border.js';

export function createForestStudio(){
 const group=new THREE.Group();group.name='forest-studio-cabin';
 const cache=new Map();const mat=color=>{if(!cache.has(color))cache.set(color,new THREE.MeshStandardMaterial({color,roughness:.9,flatShading:true}));return cache.get(color);};
 const wood='#786047',trim='#604e3b',frame='#51584b',roof='#62655b',stone='#c8c1aa';
 const glass=new THREE.MeshPhysicalMaterial({color:'#cbd4b9',transparent:true,opacity:.12,roughness:.18,side:THREE.DoubleSide,depthWrite:false});
 function add(geometry,color,x,y,z){const m=new THREE.Mesh(geometry,typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 function box(x,y,z,w,h,d,color){return add(new THREE.BoxGeometry(w,h,d),color,x,y,z);}
 function rod(a,b,r,color){const v=new THREE.Vector3(...a),delta=new THREE.Vector3(...b).sub(v);const m=add(new THREE.CylinderGeometry(r,r,delta.length(),6),color,0,0,0);m.position.copy(v.addScaledVector(delta,.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
 box(0,.15,0,3.8,.3,3.1,stone);box(0,.34,0,3.5,.08,2.8,'#a28a69');
 box(0,1.47,-1.42,3.5,2.25,.14,wood);
 box(-1.73,1.47,0,.14,2.25,2.8,wood);
 // Right wall has a recessed vertical opening.
 for(const z of [-1.02,1.02])box(1.73,1.47,z,.14,2.25,.78,wood);
 box(1.73,.55,0,.14,.5,1.3,wood);box(1.73,2.43,0,.14,.33,1.3,wood);
 box(1.76,1.57,0,.025,1.5,.85,glass);
 for(const z of [-.47,.47])box(1.8,1.57,z,.065,1.65,.07,frame);
 for(const y of [.76,2.38])box(1.8,y,0,.065,.07,1,frame);
 box(1.83,.7,0,.2,.08,1.08,stone);
 // Front door offset left and large workroom picture window at right.
 for(const [x,w]of [[-1.65,.2],[-.45,.4],[1.65,.2]])box(x,1.45,1.42,w,2.25,.15,wood);
 box(.66,.58,1.42,1.8,.45,.15,wood);box(.66,2.5,1.42,1.8,.27,.15,wood);
 box(.66,1.61,1.46,1.77,1.57,.025,glass);
 for(const x of [-.27,1.59])box(x,1.59,1.49,.07,1.76,.075,frame);
 for(const y of [.73,2.45])box(.66,y,1.5,1.94,.07,.075,frame);
 box(.66,2.13,1.51,1.8,.045,.05,frame);box(.66,.67,1.54,2,.09,.23,stone);
 box(-1.04,1.35,1.44,.79,1.95,.1,'#9a7952');
 for(const x of [-1.46,-.62])box(x,1.35,1.5,.07,2.06,.11,trim);
 box(-1.04,2.38,1.5,.92,.08,.11,trim);
 box(-1.04,1.78,1.505,.48,.63,.015,glass);
 for(const x of [-1.29,-1.04,-.79])box(x,1.78,1.53,.025,.68,.025,frame);
 box(-1.04,1.78,1.53,.51,.025,.025,frame);
 add(new THREE.SphereGeometry(.035,7,5),frame,-.77,1.23,1.55);
 // Horizontal cladding joints on sidewalls and door panels.
 for(let i=0;i<11;i++){const y=.43+i*.195;box(-1.81,y,0,.012,.014,2.78,trim);for(const z of [-1.02,1.02])box(1.81,y,z,.012,.014,.74,trim);}
 for(const x of [-1.28,-1.04,-.8])box(x,.91,1.5,.013,.85,.015,trim);
 // Clerestory band and shallow shed roof, no chimney or gable symmetry.
 box(0,2.72,1.42,3.5,.14,.15,wood);box(0,3.14,1.44,3.28,.54,.025,glass);
 for(let i=0;i<=5;i++)box(-1.66+i*.664,3.14,1.49,.045,.6,.07,frame);
 for(const y of [2.84,3.44])box(0,y,1.48,3.4,.05,.07,frame);
 const roofY=z=>3.15+z*.235;
 for(const x of [-1.75,1.75]){
  const shape=new THREE.Shape();shape.moveTo(-1.5,2.6);shape.lineTo(-1.5,roofY(-1.5));shape.lineTo(1.5,roofY(1.5));shape.lineTo(1.5,2.6);shape.closePath();const m=add(new THREE.ShapeGeometry(shape),mat(wood),x,0,0);m.rotation.y=-Math.PI/2;m.material.side=THREE.DoubleSide;
 }
 const mainRoof=box(0,3.15,0,4.03,.085,3.45,roof);mainRoof.rotation.x=-Math.atan(.235);
 for(let i=0;i<12;i++)rod([-1.92+i*.35,roofY(-1.7)+.05,-1.7],[-1.92+i*.35,roofY(1.7)+.05,1.7],.012,'#74756a');
 for(const z of [-1.73,1.73])box(0,roofY(z),z,4.12,.1,.07,frame);
 // Light porch deck and independent sloping canopy.
 box(0,.34,1.98,3.8,.13,1.16,'#a18460');
 for(let i=0;i<13;i++)box(-1.76+i*.29,.409,1.98,.009,.008,1.1,trim);
 for(const x of [-1.67,1.67]){box(x,1.43,2.46,.1,2.15,.1,wood);const brace=box(x,2.28,2.24,.075,.52,.075,trim);brace.rotation.x=.65;}
 const canopy=box(0,2.58,2,4.05,.075,1.5,roof);canopy.rotation.x=.18;
 for(let i=0;i<10;i++)rod([-1.95+i*.43,2.75,1.3],[-1.95+i*.43,2.48,2.75],.011,'#74756a');
 box(0,2.45,2.74,4.1,.09,.065,frame);
 for(const x of [-1.67,1.67]){box(x,.89,2.1,.065,.82,.065,wood);box(x,1.17,2.12,.075,.06,.7,wood);}
 box(0,.2,2.72,2.25,.16,.36,stone);box(0,.08,3,2.5,.12,.3,stone);
 // Worktable and shelves read through the large window.
 box(.55,.99,.25,1.4,.09,.72,'#a78b65');for(const x of [-.02,1.12])for(const z of [-.02,.52])box(x,.65,z,.07,.62,.07,wood);
 for(const y of [.9,1.45,2])box(.64,y,-1.15,1.7,.07,.35,'#9b7d57');
 for(let i=0;i<9;i++){const x=-.05+i*.17;box(x,1.62,-1.13,.09,.25+(i%3)*.04,.18,['#a8ae91','#bcab8d','#988a71'][i%3]);}
 add(new THREE.CylinderGeometry(.08,.07,.16,8),'#b8aa8d',.53,1.12,.25);for(let j=0;j<5;j++)rod([.53,1.17,.25],[.5+j*.018,1.43+(j%2)*.08,.25],.006,'#6d7657');
 // A small always-lit wall lantern beside the door.
 box(-.45,1.96,1.55,.18,.28,.17,frame);box(-.45,1.96,1.65,.125,.21,.012,new THREE.MeshStandardMaterial({color:'#eed8a5',emissive:'#e9bc78',emissiveIntensity:.7,roughness:.5}));
 const flowers=[];
 for(const p of [{x:-1.95,z:2.36,r:.25,h:.4,type:'cosmos'},{x:1.78,z:2.55,r:.25,h:.36,type:'daisy'},{x:1.18,z:2.78,r:.18,h:.27,type:'salvia'}]){
  add(new THREE.CylinderGeometry(p.r,p.r*.72,p.h,10),p.type==='daisy'?'#c2b9a2':'#a98669',p.x,.05+p.h/2,p.z);
  add(new THREE.TorusGeometry(p.r*.96,.023,4,12),'#b89c7c',p.x,.05+p.h,p.z).rotation.x=Math.PI/2;
  add(new THREE.CylinderGeometry(p.r*.88,p.r*.88,.012,10),'#756550',p.x,.04+p.h,p.z);
  for(let j=0;j<9;j++)flowers.push({x:p.x+Math.cos(j*2.399)*p.r*.65,z:p.z+Math.sin(j*2.399)*p.r*.65,y:.05+p.h,type:p.type,height:.35+(j%4)*.075});
  flowers.push({x:p.x,z:p.z,y:.05+p.h,type:'foliage',height:.3});
 }
 group.add(createMixedBorder({seed:734,plants:flowers}));return group;
}
