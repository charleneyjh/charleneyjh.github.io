import * as THREE from 'three';
import {createMixedBorder} from '../models/mixed-border.js';

export function createFountain(clearOfRoad){
 const group=new THREE.Group();group.name='two-tier-garden-fountain';group.userData.interaction='fountain';
 const stone=new THREE.MeshStandardMaterial({color:'#d5d0bc',roughness:.82,flatShading:true});
 const water=new THREE.MeshStandardMaterial({color:'#8caea3',roughness:.24,metalness:.08,transparent:true,opacity:.85});
 function add(geometry,material,x=0,y=0,z=0){const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
 function lathe(points,y){return add(new THREE.LatheGeometry(points.map(p=>new THREE.Vector2(...p)),24),stone,0,y,0);}
 // Approved two-tier silhouette: broad open bowls, rolled rims and sculpted waists.
 lathe([[0,0],[.38,0],[.42,.045],[.42,.08],[.36,.14],[.3,.17],[0,.17]],-.025);
 lathe([[0,0],[.28,0],[.3,.06],[.26,.11],[.19,.27],[.155,.43],[.18,.57],[.24,.65],[.32,.7],[0,.7]],.14);
 lathe([[0,0],[.25,0],[.42,.06],[.61,.15],[.76,.28],[.85,.39],[.88,.42],[.88,.455],[.84,.47],[.79,.44],[.76,.36],[.64,.26],[.45,.18],[.2,.14],[0,.14]],.81);
 add(new THREE.CylinderGeometry(.765,.765,.012,32),water,0,1.2);
 lathe([[0,0],[.2,0],[.22,.045],[.17,.11],[.115,.24],[.12,.34],[.17,.4],[.23,.45],[0,.45]],1.2);
 lathe([[0,0],[.16,0],[.28,.05],[.38,.14],[.455,.235],[.48,.26],[.48,.285],[.445,.3],[.415,.27],[.38,.21],[.27,.13],[.12,.1],[0,.1]],1.62);
 add(new THREE.CylinderGeometry(.405,.405,.012,28),water,0,1.875);
 lathe([[0,0],[.08,0],[.085,.06],[.06,.115],[.095,.17],[.08,.23],[0,.31]],1.87);
 // Thin concentric molding follows the rim without adding another basin.
 const rimMaterial=new THREE.MeshStandardMaterial({color:'#ded7c3',roughness:.9,flatShading:true});
 for(const [r,y]of [[.862,1.245],[.465,1.9]]){const ring=add(new THREE.TorusGeometry(r,.017,5,32),rimMaterial);ring.rotation.x=Math.PI/2;ring.position.y=y;}
 // One unbroken overflow sheet between the two bowls, not a particle stream.
 const flowMaterial=new THREE.MeshStandardMaterial({color:'#adc9bd',transparent:true,opacity:0,roughness:.15,metalness:.05,side:THREE.DoubleSide,depthWrite:false});
 const profile=[[.455,1.9],[.48,1.84],[.49,1.73],[.51,1.58],[.54,1.42],[.58,1.25],[.6,1.205]].map(p=>new THREE.Vector2(...p));
 const curtain=add(new THREE.LatheGeometry(profile,48),flowMaterial);curtain.castShadow=false;
 const jetCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,2.13,0),new THREE.Vector3(.025,2.22,0),new THREE.Vector3(.065,2.23,.01),new THREE.Vector3(.1,2.14,.02),new THREE.Vector3(.12,1.92,.03)]);
 const jet=add(new THREE.TubeGeometry(jetCurve,24,.018,7,false),new THREE.MeshStandardMaterial({color:'#b9d1c5',transparent:true,opacity:.7,roughness:.15}));jet.castShadow=false;
 const ripple=add(new THREE.TorusGeometry(.61,.006,4,48),new THREE.MeshBasicMaterial({color:'#c8d9cb',transparent:true,opacity:.35}));ripple.rotation.x=Math.PI/2;ripple.position.y=1.21;ripple.castShadow=false;
 const flowCanvas=document.createElement('canvas');flowCanvas.width=64;flowCanvas.height=256;const flowCtx=flowCanvas.getContext('2d');flowCtx.fillStyle='#afcbbd';flowCtx.fillRect(0,0,64,256);flowCtx.strokeStyle='#dfebe0';flowCtx.lineWidth=2;
 for(let i=0;i<9;i++){const x=i*8;flowCtx.beginPath();flowCtx.moveTo(x,0);flowCtx.bezierCurveTo(x+3,80,x-2,170,x,256);flowCtx.stroke();}
 const flowTexture=new THREE.CanvasTexture(flowCanvas);flowTexture.colorSpace=THREE.SRGBColorSpace;flowTexture.wrapS=flowTexture.wrapT=THREE.RepeatWrapping;flowTexture.repeat.set(5,1);flowMaterial.map=flowTexture;flowMaterial.needsUpdate=true;
 jet.visible=false;ripple.visible=false;group.userData.flowTexture=flowTexture;
 group.userData.flowMaterial=flowMaterial;group.userData.ripple=ripple;group.userData.jet=jet;
 const hit=new THREE.Mesh(new THREE.CylinderGeometry(1,1,2.4,12),new THREE.MeshBasicMaterial({visible:false}));hit.position.y=1.1;group.add(hit);
 // An irregular soil bed: no enclosing brick ring and no oversized boulders.
 const shape=new THREE.Shape();for(let i=0;i<=64;i++){const a=i/64*Math.PI*2,r=1.38+.07*Math.sin(3*a)+.045*Math.cos(7*a),x=Math.cos(a)*r,z=Math.sin(a)*r;i?shape.lineTo(x,z):shape.moveTo(x,z);}
 const soil=add(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({color:'#8f7c63',roughness:1,side:THREE.DoubleSide}));soil.rotation.x=-Math.PI/2;soil.position.y=-.037;soil.castShadow=false;
 let seed=377;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};const plants=[];
 for(const d of [{a:2.8,n:9,type:'cosmos',h:.58},{a:4.1,n:9,type:'daisy',h:.3},{a:.3,n:7,type:'salvia',h:.58},{a:1.5,n:6,type:'cosmos',h:.48},{a:5.4,n:9,type:'daisy',h:.27}]){
  for(let i=0;i<d.n;i++){const a=d.a+(random()-.5)*.5,r=1.05+random()*.22,x=Math.cos(a)*r,z=Math.sin(a)*r;if(clearOfRoad(x+5.4,z+5.8,.3))plants.push({x,z,type:d.type,height:d.h*(.8+random()*.35)});}
 }
 for(let i=0;i<28;i++){const a=random()*Math.PI*2,r=.95+random()*.35,x=Math.cos(a)*r,z=Math.sin(a)*r;if(clearOfRoad(x+5.4,z+5.8,.3))plants.push({x,z,type:'foliage',height:.18+random()*.14});}
 group.add(createMixedBorder({seed:191,plants}));
 return group;
}
