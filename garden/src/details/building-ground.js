import * as THREE from 'three';
import {createMixedBorder} from '../models/mixed-border.js';

export function createBuildingGround(clear,buildings=[{x:-10,z:0,kind:'cabin'},{x:10,z:0,kind:'shop'}]){
 const group=new THREE.Group();group.name='natural-building-footings';
 const materials=['#aaa993','#bab49d','#969c87'].map(color=>new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));
 // Shared soft contact texture, rendered once per building rather than extra shadow lights.
 const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;const ctx=canvas.getContext('2d');
 const gradient=ctx.createRadialGradient(64,64,20,64,64,64);gradient.addColorStop(0,'rgba(47,52,34,.24)');gradient.addColorStop(.65,'rgba(47,52,34,.15)');gradient.addColorStop(1,'rgba(47,52,34,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const contactMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 const earthMaterial=new THREE.MeshStandardMaterial({color:'#969273',roughness:1,transparent:true,opacity:.42,depthWrite:false,side:THREE.DoubleSide});
 let seed=941;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};const plants=[];
 for(const building of buildings){
  const contact=new THREE.Mesh(new THREE.PlaneGeometry(4.5,4.9),contactMaterial);contact.rotation.x=-Math.PI/2;contact.position.set(building.x,-.042,building.z+.55);group.add(contact);

  const positions=building.kind==='cabin'?[[-2.12,-.9],[-2.08,.4],[-2.3,1.65],[2.12,-1.1],[2.05,.2],[2.23,1.55],[-2.3,2.8],[2.35,2.85]]:[[-2.04,-.85],[-2.12,.25],[-2.16,1.15],[2.08,-1.1],[2.12,-.25],[2.14,.72],[-2.25,2.65],[2.23,2.8]];
  for(let k=0;k<positions.length;k++){
   const [dx,dz]=positions[k],x=building.x+dx,z=building.z+dz;
   // Interrupted soil pockets stay off all routes and avoid a continuous decorative ring.
   if(k%2===0&&clear(x,z,.45)){
    const shape=new THREE.Shape();for(let j=0;j<=9;j++){const a=j/9*Math.PI*2,r=.32*(1+.14*Math.sin(j*2.3+k)),px=Math.cos(a)*r,pz=Math.sin(a)*r*.64;j?shape.lineTo(px,pz):shape.moveTo(px,pz);}
    const pocket=new THREE.Mesh(new THREE.ShapeGeometry(shape),earthMaterial);pocket.rotation.x=-Math.PI/2;pocket.position.set(x,-.041,z);pocket.receiveShadow=true;group.add(pocket);
   }
   if(k%3!==1&&clear(x,z,.25)){
    const size=.09+random()*.09,rock=new THREE.Mesh(new THREE.IcosahedronGeometry(size,0),materials[k%3]);rock.position.set(x,-.025,z);rock.scale.set(1.35,.6,.9);rock.rotation.set(random()*.25,random()*6.28,random()*.15);rock.castShadow=true;rock.receiveShadow=true;group.add(rock);
   }
   for(let j=0;j<3;j++){
    const px=x+(random()-.5)*.45,pz=z+(random()-.5)*.5;if(!clear(px,pz,.25))continue;
    plants.push({x:px,z:pz,type:j===2?'foliage':'grass',height:j===2?.16+random()*.08:.1+random()*.13});
   }
  }
 }
 group.add(createMixedBorder({seed:729,plants}));return group;
}
