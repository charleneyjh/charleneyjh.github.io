import * as THREE from 'three';
import {createMixedBorder} from '../models/mixed-border.js';

/** Cottage shop refined from the approved concept, built for static batching. */
export function createCandleAtelier(){
 const group=new THREE.Group();group.name='concept-candle-atelier';
 const palette={plaster:'#d8d3bd',wood:'#a17e56',trim:'#8a6b48',stone:'#c9c3ac',sage:'#aeb99a',cream:'#e3dfc6'};
 const materials=new Map();const mat=color=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.9,flatShading:true}));return materials.get(color);};
 const glass=new THREE.MeshPhysicalMaterial({color:'#d1dfcd',transparent:true,opacity:.1,roughness:.15,side:THREE.DoubleSide,depthWrite:false});
 function add(geo,color,x,y,z){const m=new THREE.Mesh(geo,typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 function box(x,y,z,w,h,d,color){return add(new THREE.BoxGeometry(w,h,d),color,x,y,z);}
 function rod(a,b,r,color){const av=new THREE.Vector3(...a),delta=new THREE.Vector3(...b).sub(av);const m=add(new THREE.CylinderGeometry(r,r,delta.length(),6),color,0,0,0);m.position.copy(av.addScaledVector(delta,.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
 box(0,.12,0,3.7,.24,2.9,palette.stone);
 box(0,1.45,-1.33,3.5,2.5,.14,palette.plaster);
 box(-1.72,1.45,0,.14,2.5,2.7,palette.plaster);
 // Right side window is a true opening between wall piers.
 for(const z of [-1.07,1.07])box(1.72,1.45,z,.14,2.5,.55,palette.plaster);
 box(1.72,.54,0,.14,.6,1.6,palette.plaster);box(1.72,2.52,0,.14,.36,1.6,palette.plaster);
 box(1.74,1.58,0,.025,1.42,1.45,glass);
 for(const z of [-.73,0,.73])box(1.77,1.58,z,.06,1.5,.045,palette.trim);
 for(const y of [.85,1.58,2.31])box(1.77,y,0,.06,.045,1.5,palette.trim);
 box(1.8,.8,0,.22,.09,1.65,palette.stone);
 // Front window / door / window, with slim reveals and sills.
 for(const x of [-1.09,1.09]){
  box(x,.48,1.33,1.13,.45,.16,palette.plaster);box(x,1.57,1.35,1.12,1.7,.025,glass);
  for(const xx of [x-.58,x+.58])box(xx,1.52,1.38,.085,2,.1,palette.wood);
  box(x,.68,1.41,1.2,.09,.21,palette.wood);box(x,1.58,1.39,1.1,.035,.04,palette.wood);
 }
 box(0,1.31,1.38,.78,2.05,.07,palette.wood);box(0,1.35,1.425,.6,1.77,.018,glass);
 for(const y of [.48,1.13,1.77,2.21])box(0,y,1.45,.66,.04,.03,palette.trim);
 for(const x of [-.35,.35])box(x,1.32,1.45,.045,1.93,.035,palette.trim);
 add(new THREE.SphereGeometry(.035,8,5),'#b2a27a',.23,1.25,1.49);
 box(0,2.56,1.35,3.55,.16,.14,palette.wood);
 // Gables at the sides; roof ridge runs across the storefront as in the concept.
 const shape=new THREE.Shape();shape.moveTo(-1.45,0);shape.lineTo(0,1.03);shape.lineTo(1.45,0);shape.closePath();
 for(const x of [-1.73,1.73]){const m=add(new THREE.ShapeGeometry(shape),mat(palette.plaster),x,2.68,0);m.rotation.y=Math.PI/2;m.material.side=THREE.DoubleSide;}
 for(const side of [-1,1]){
  const slope=Math.atan2(1.03,1.65),base=box(0,3.17,side*.82,3.95,.06,1.96,palette.trim);base.rotation.x=side*slope;
  for(let row=0;row<6;row++)for(let col=0;col<11;col++){
   const z=side*(.14+row*.275),y=3.72-Math.abs(z)*1.03/1.65;
   const tile=box(-1.77+col*.355+(row%2)*.04,y+.035,z,.348,.035,.34,['#a78156','#af8b60','#a9845a'][(row+col*3)%3]);tile.rotation.x=side*slope;
  }
 }
 box(0,3.76,0,4,.065,.12,palette.wood);
 // Curved fabric canopy, stitched stripe panels with a small scalloped valance.
 for(let stripe=0;stripe<10;stripe++){
  const left=-1.78+stripe*.356,right=left+.356,vertices=[],indices=[];
  for(let j=0;j<=8;j++){const t=j/8,z=1.43+t*.93,y=2.55-.34*t-.13*Math.sin(t*Math.PI);vertices.push(left,y,z,right,y,z);if(j<8){const n=j*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();const material=mat(stripe%2?palette.cream:palette.sage);material.side=THREE.DoubleSide;add(geo,material,0,0,0);
  const valance=new THREE.Shape();valance.moveTo(left,2.21);valance.lineTo(right,2.21);valance.lineTo(right,2.11);valance.quadraticCurveTo((left+right)/2,2.055,left,2.11);valance.closePath();add(new THREE.ShapeGeometry(valance),material,0,0,2.36);
 }
 for(const x of [-1.8,1.8])rod([x,1.85,1.4],[x,2.2,2.35],.018,palette.trim);
 rod([-1.82,2.21,2.36],[1.82,2.21,2.36],.022,palette.wood);
 box(0,.2,1.75,1.4,.17,.48,palette.stone);box(0,.09,2.09,1.65,.13,.35,palette.stone);
 // Display shelves and mixed candle vessels are visible through the glazing.
 for(const x of [-1.08,1.08])for(const y of [.9,1.5])box(x,y,.89,.98,.075,.47,palette.wood);
 box(0,.82,-.7,2.6,.1,.6,palette.wood);box(0,.43,-.7,2.45,.7,.53,'#b5a184');
 function candle(x,y,z,r,h,color){add(new THREE.CylinderGeometry(r,r,h,9),color,x,y+h/2,z);add(new THREE.CylinderGeometry(r*.88,r*.88,.008,9),'#e9dfc7',x,y+h+.005,z);rod([x,y+h,z],[x,y+h+.025,z],.004,'#655b44');}
 for(const x of [-1.42,-1.07,-.75,.72,1.07,1.42])for(const [j,y]of [[0,.94],[1,1.54]])candle(x,y,.9,.075,.16+((Math.round(x*10)+j+30)%3)*.045,['#d7c9ac','#b7bda0','#c7aaa6'][Math.abs(Math.round(x*10))%3]);
 // A flower pictogram sign hung from a straight bracket, no new text.
 rod([1.76,2.35,.95],[2.18,2.35,.95],.025,'#5c6555');box(2.1,1.99,.95,.055,.55,.43,palette.wood);
 const sign=new THREE.Group();sign.position.set(2.136,2.02,.95);sign.rotation.y=Math.PI/2;group.add(sign);
 for(let i=0;i<5;i++){const a=i*6.283/5;const petal=new THREE.Mesh(new THREE.CircleGeometry(.046,6),mat('#e3dfc7'));petal.position.set(Math.cos(a)*.052,Math.sin(a)*.052,0);sign.add(petal);}
 const plants=[];
 for(const [i,p]of [{x:-1.78,z:1.9,r:.24,h:.39,type:'cosmos'},{x:-1.2,z:2.04,r:.22,h:.31,type:'daisy'},{x:-.91,z:2.22,r:.14,h:.23,type:'salvia'},{x:1.23,z:1.87,r:.24,h:.4,type:'cosmos'},{x:1.74,z:2.07,r:.23,h:.35,type:'salvia'},{x:.92,z:2.24,r:.15,h:.22,type:'daisy'}].entries()){
  add(new THREE.CylinderGeometry(p.r,p.r*.7,p.h,9),i%2?'#ad8b6e':'#b69c7d',p.x,.2+p.h/2,p.z);
  add(new THREE.TorusGeometry(p.r*.96,.023,4,12),'#b99c7c',p.x,.2+p.h,p.z).rotation.x=Math.PI/2;
  add(new THREE.CylinderGeometry(p.r*.87,p.r*.87,.012,10),'#71634f',p.x,.2+p.h-.02,p.z);
  for(let j=0;j<7;j++){const a=j*2.399;plants.push({x:p.x+Math.cos(a)*p.r*.6,z:p.z+Math.sin(a)*p.r*.6,y:.2+p.h,height:(p.type==='salvia'?.43:.32)+(j%3)*.09,type:p.type});}
  plants.push({x:p.x,z:p.z,y:.2+p.h,type:'foliage',height:.27});
 }
 group.add(createMixedBorder({seed:823,plants}));return group;
}
