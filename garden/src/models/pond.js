import * as THREE from 'three';
import {createMixedBorder} from './mixed-border.js';

export function createPond(){
 const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const group=new THREE.Group();group.name='refined-pond';
 let seed=7341;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};const between=(a,b)=>a+(b-a)*random();
 const materials=new Map();function material(color){if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.92,flatShading:true}));return materials.get(color);}
 function mesh(geometry,color,parent=group){const m=new THREE.Mesh(geometry,typeof color==='string'?material(color):color);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function box(parent,x,y,z,w,h,d,color){const m=mesh(new THREE.BoxGeometry(w,h,d),color,parent);m.position.set(x,y,z);return m;}
 function rod(parent,a,b,r,color){const v=new THREE.Vector3(...a),delta=new THREE.Vector3(...b).sub(v);const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),6),color,parent);m.position.copy(v.addScaledVector(delta,.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
 function curve(parent,points,r,color){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),48,r,5,false),color,parent);}
 const radius=a=>1+.15*Math.sin(3*a+.6)+.085*Math.cos(5*a-.4)+.06*Math.sin(2*a);
 function outline(scale=1){const shape=new THREE.Shape();for(let i=0;i<=96;i++){const a=i/96*Math.PI*2,r=radius(a)*scale,x=Math.cos(a)*2.6*r,z=-Math.sin(a)*2.1*r;i?shape.lineTo(x,z):shape.moveTo(x,z);}return shape;}
 // Thin earthen margin gives the water an inset shoreline rather than a stone necklace.
 for(const [scale,y,color]of [[1.055,-.025,'#8b9070'],[1,.006,'#719287']]){const m=mesh(new THREE.ShapeGeometry(outline(scale)),color);m.rotation.x=-Math.PI/2;m.position.y=y;m.castShadow=false;}
 // Grouped partially buried stones, with intentional open grassy banks.
 const clusters=[{a:.15,n:5},{a:1.15,n:4},{a:2.3,n:5},{a:3.65,n:4},{a:4.75,n:4},{a:5.7,n:3}];
 for(const cluster of clusters)for(let j=0;j<cluster.n;j++){
  const a=cluster.a+(j-(cluster.n-1)/2)*.13+between(-.03,.03),r=radius(a),size=between(.17,.4);
  const rock=mesh(new THREE.IcosahedronGeometry(1,0),['#9b9d8a','#b1ae98','#8d9585'][j%3]);
  rock.position.set(Math.cos(a)*2.65*r,between(-.03,.055),Math.sin(a)*2.14*r);rock.scale.set(size*between(1,1.6),size*between(.55,.95),size);rock.rotation.set(between(-.2,.2),between(0,6.28),between(-.15,.15));
  if(j%3===0){const pebble=mesh(new THREE.IcosahedronGeometry(.1,0),'#b1ae98');pebble.position.copy(rock.position).add(new THREE.Vector3(.22,.02,.13));pebble.scale.y=.5;}
 }
 // Notched lily pads in two loose groups, leaving the center of the water open.
 const rippleMaterial=new THREE.MeshBasicMaterial({color:'#a9bdb0',transparent:true,opacity:.22,depthWrite:false,side:THREE.DoubleSide});
 const ripples=[];
 for(let i=0;i<9;i++){
  const x=(i<5?-1.3:1.25)+between(-.42,.42),z=(i<5?-.55:.75)+between(-.35,.35),r=between(.12,.2);
  const pad=mesh(new THREE.CircleGeometry(r,10,.18,Math.PI*2-.4),i%2?'#8c9c6c':'#7f9464');pad.rotation.x=-Math.PI/2;pad.rotation.z=between(0,6);pad.position.set(x,.024,z);pad.castShadow=false;
  if(i===1||i===7){const bloom=createMixedBorder({seed:80+i,plants:[{x:0,z:0,type:'daisy',height:.08}]});bloom.scale.setScalar(.7);bloom.position.set(x,.025,z);group.add(bloom);}
  if(i%3===0){const ring=mesh(new THREE.RingGeometry(r*1.4,r*1.4+.012,40),rippleMaterial);ring.rotation.x=-Math.PI/2;ring.position.set(x,.018,z);ring.castShadow=false;ripples.push(ring);}
 }
 const plants=[];for(const a of [.5,.65,2.1,2.25,3.9,4.1,5.3]){const r=radius(a);plants.push({x:Math.cos(a)*2.7*r,z:Math.sin(a)*2.2*r,type:'grass',height:between(.28,.48)});}
 plants.push({x:-2.15,z:-.3,type:'groundcover',height:.18},{x:1.3,z:1.8,type:'daisy',height:.3});group.add(createMixedBorder({seed:532,plants}));
 const bridge=new THREE.Group();bridge.name='refined-arched-bridge';bridge.rotation.y=-.65;bridge.scale.set(.8,.8,.72);group.add(bridge);
 const height=z=>.12+Math.sin((z+2.5)/5*Math.PI)*.72;
 const plankColors=['#9d7954','#a5815c','#99724e','#a17b56'];
 for(let i=0;i<26;i++){
  const z=-2.5+i*5/25,y=height(z),tilt=-Math.atan(Math.cos((z+2.5)/5*Math.PI)*.72*Math.PI/5);
  const plank=box(bridge,0,y,z,1.18,.095,.18,plankColors[i%4]);plank.rotation.x=tilt;
  // Subtle metal fasteners, one at either edge.
  for(const x of [-.46,.46]){const nail=mesh(new THREE.CylinderGeometry(.014,.014,.006,5),'#665e48',bridge);nail.position.set(x,y+.05,z);}
 }
 for(const x of [-.62,.62]){
  const upper=[],lower=[],support=[];
  for(let i=0;i<=8;i++){
   const z=-2.5+i*5/8,y=height(z);upper.push([x,y+.86,z]);lower.push([x,y+.42,z]);support.push([x,y-.09,z]);
   box(bridge,x,y+.4,z,.065,.88,.065,'#806342');box(bridge,x,y+.86,z,.105,.055,.105,'#a5815c');
  }
  curve(bridge,upper,.038,'#97734e');curve(bridge,lower,.023,'#97734e');curve(bridge,support,.065,'#745a3e');
 }
 // Broad, low landing stones bridge the height difference into the stepping paths.
 for(const sign of [-1,1])for(let j=0;j<2;j++){
  const stone=box(bridge,j%2?.04:-.03,.015-j*.016,sign*(2.65+j*.22),1.15-j*.12,.08,.32,j?'#c7c3aa':'#d4ccb0');stone.rotation.y=sign*.035;
 }
 return {group,update(time){if(!reducedMotion)for(let i=0;i<ripples.length;i++){const s=1+Math.sin(time*.6+i*2)*.06;ripples[i].scale.setScalar(s);}}};
}
