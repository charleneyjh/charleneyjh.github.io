import * as THREE from 'three';
import {createMixedBorder} from '../models/mixed-border.js';

export function refineBuildings(cabin,shop){
 const cache=new Map();const mat=color=>{if(!cache.has(color))cache.set(color,new THREE.MeshStandardMaterial({color,roughness:.85,flatShading:true}));return cache.get(color);};
 function box(g,x,y,z,w,h,d,color){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;}
 function frame(g,x,y,z,w,h){box(g,x,y,z,w+.14,h+.14,.08,'#735a40');box(g,x,y,z+.045,w,h,.025,'#a8b9ae');for(const xx of [x-w/2,x,x+w/2])box(g,xx,y,z+.08,.035,h,.045,'#c0b398');for(const yy of [y-h/2,y,y+h/2])box(g,x,yy,z+.08,w,.035,.045,'#c0b398');box(g,x,y-h/2-.07,z+.12,w+.2,.08,.23,'#8a6c4c');}
 // Fine horizontal boards and staggered joints, shallow reveals around windows.
 for(let i=0;i<11;i++){const y=.3+i*.205;box(cabin,1.756,y,0,.018,.014,2.75,'#896647');box(cabin,-1.756,y,0,.018,.014,2.75,'#896647');}
 for(const [y,z]of [[.75,-.4],[1.36,.6],[1.98,-.6]])box(cabin,1.77,y,z,.015,.18,.018,'#75583e');
 frame(cabin,-.9,1.55,1.47,.78,.78);
 box(cabin,.45,1.15,1.48,.77,1.8,.07,'#765a40');box(cabin,.45,1.13,1.53,.61,1.62,.025,'#9c7852');
 frame(cabin,.45,1.51,1.56,.38,.48);box(cabin,.65,1.05,1.59,.04,.04,.05,'#b8a477');
 // Side window facing the main garden.
 const side=new THREE.Group();side.position.set(1.77,0,0);side.rotation.y=Math.PI/2;cabin.add(side);frame(side,0,1.52,0,1,.82);
 for(let i=0;i<12;i++)box(cabin,-1.65+i*.3,.432,2, .012,.015,1.22,'#7b5e42');
 for(const x of [-1.65,1.65]){const brace=box(cabin,x,2,2.39,.07,.52,.07,'#8c6a47');brace.rotation.z=x>0?-.6:.6;}
 box(cabin,0,.16,2.78,2.25,.14,.32,'#b5ae95');box(cabin,0,.08,3.04,2.45,.12,.28,'#c9c1a6');
 if(!shop)return;
 // The shop's glazed wall remains open enough to read the interior silhouettes.
 const glass=new THREE.MeshPhysicalMaterial({color:'#d3dfd4',transparent:true,opacity:.09,roughness:.12,metalness:0,side:THREE.DoubleSide,depthWrite:false});
 for(const child of shop.children)if(child.isMesh&&child.material.transparent)child.material=glass;
 box(shop,0,.83,-.25,2.6,.12,.65,'#9c7b57');box(shop,0,.43,-.25,2.45,.7,.56,'#baa58a');
 box(shop,0,1.85,-1.1,2.85,.075,.33,'#927351');box(shop,0,1.25,-1.1,2.85,.075,.33,'#927351');
 function candle(x,y,z,r,h,color){const wax=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,10),mat(color));wax.position.set(x,y+h/2,z);wax.castShadow=true;shop.add(wax);box(shop,x,y+h+.018,z,.012,.035,.012,'#6c6251');}
 for(let i=0;i<7;i++){const x=-1.1+i*.36;candle(x,1.29,-1.07,.085,.17+(i%3)*.045,['#e3d9c4','#bfa6a3','#b4bd9b'][i%3]);if(i%2===0)candle(x,1.89,-1.07,.09,.22,'#ded3bb');}
 for(const [x,z,h]of [[-.7,-.25,.23],[.1,-.15,.31],[.7,-.3,.19]])candle(x,.9,z,.12,h,'#e2d7bc');
 const pots=[{x:-1.5,z:1.7,r:.18,h:.3},{x:1.5,z:1.72,r:.24,h:.38},{x:1.8,z:.9,r:.16,h:.25},{x:-1.8,z:.8,r:.2,h:.32}];
 const flowers=[];for(let i=0;i<pots.length;i++){const p=pots[i];const pot=new THREE.Mesh(new THREE.CylinderGeometry(p.r,p.r*.72,p.h,9),mat(i%2?'#a7866c':'#b7ac91'));pot.position.set(p.x,.26+p.h/2,p.z);pot.castShadow=true;shop.add(pot);for(let j=0;j<4;j++)flowers.push({x:p.x+Math.cos(j*2.4)*p.r*.65,z:p.z+Math.sin(j*2.4)*p.r*.65,y:.26+p.h,height:.2+j*.07,type:i%2?'cosmos':'daisy'});}
 shop.add(createMixedBorder({seed:228,plants:flowers}));
}
