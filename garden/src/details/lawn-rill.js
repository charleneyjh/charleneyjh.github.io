import * as THREE from 'three';
import {createMixedBorder} from '../models/mixed-border.js';

export function createLawnRill(width,depth){
 const group=new THREE.Group();group.name='straight-hairline-lawn-rill';
 const stone=new THREE.MeshStandardMaterial({color:'#c6c0aa',roughness:.92,flatShading:true});
 const pale=new THREE.MeshStandardMaterial({color:'#d3cbb7',roughness:.9,flatShading:true,side:THREE.DoubleSide});
 const dark=new THREE.MeshStandardMaterial({color:'#596b60',roughness:.7});
 function mesh(geo,material,x,y,z){const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);return m;}
 function box(x,y,z,w,h,d,material=stone){return mesh(new THREE.BoxGeometry(w,h,d),material,x,y,z);}
 const back=-depth/2,front=depth/2+.17,start=back+.2,length=front-start;
 // Water occupies only 1.2% of the lawn width. Thin stone edges sit flush with turf.
 const channel=.055;
 box(0,-.045,start+length/2,channel+.05,.008,length,dark);
 for(const x of [-(channel/2+.0125),channel/2+.0125])box(x,-.037,start+length/2,.025,.008,length,pale);
 const canvas=document.createElement('canvas');canvas.width=32;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#819d90';ctx.fillRect(0,0,32,256);ctx.strokeStyle='rgba(207,225,211,.5)';ctx.lineWidth=1.5;
 for(let i=0;i<12;i++){const y=i*23;ctx.beginPath();ctx.moveTo(5+(i%3)*7,y);ctx.lineTo(7+(i%3)*7,y+9);ctx.stroke();}
 const flowTexture=new THREE.CanvasTexture(canvas);flowTexture.colorSpace=THREE.SRGBColorSpace;flowTexture.wrapT=THREE.RepeatWrapping;flowTexture.repeat.set(1,5);
 const waterMaterial=new THREE.MeshStandardMaterial({map:flowTexture,color:'#c2d3c4',roughness:.25,metalness:.06});
 const water=mesh(new THREE.PlaneGeometry(channel,length),waterMaterial,0,-.034,start+length/2);water.rotation.x=-Math.PI/2;water.castShadow=false;
 // Small sculpted folded leaf and a low square plinth, centered on the far short edge.
 const sculptureZ=back-.13;
 box(0,.2,sculptureZ,.55,.49,.5);
 box(0,.47,sculptureZ,.6,.07,.55,pale);
 const vertices=[],indices=[];
 for(let i=0;i<=9;i++){
  const t=i/9,w=Math.pow(Math.sin(Math.PI*t),.7)*.23,centerX=Math.sin(t*Math.PI)*.045,y=.51+t*.64,z=sculptureZ+.08+Math.sin(t*Math.PI)*.17;
  vertices.push(centerX-w,y,z,centerX,y+.025,z+.09*Math.sin(t*Math.PI),centerX+w,y,z);
  if(i<9){const n=i*3;indices.push(n,n+3,n+1,n+1,n+3,n+4,n+1,n+4,n+2,n+2,n+4,n+5);}
 }
 const leaf=new THREE.BufferGeometry();leaf.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));leaf.setIndex(indices);leaf.computeVertexNormals();mesh(leaf,pale,0,0,0);
 const spoutZ=sculptureZ+.21;
 const spout=mesh(new THREE.CylinderGeometry(.023,.023,.09,8),dark,0,.59,spoutZ);spout.rotation.x=Math.PI/2;
 const flowCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.59,spoutZ+.045),new THREE.Vector3(0,.48,spoutZ+.09),new THREE.Vector3(0,.23,start+.03),new THREE.Vector3(0,-.026,start+.13)]);
 const stream=mesh(new THREE.TubeGeometry(flowCurve,24,.009,6,false),new THREE.MeshStandardMaterial({color:'#b4cdbd',transparent:true,opacity:.75,roughness:.12}),0,0,0);stream.castShadow=false;
 // Discreet matching-width drain at the opposite short edge.
 box(0,-.033,front-.025,.075,.012,.14,dark);for(let i=0;i<4;i++)box(0,-.025,front-.08+i*.03,.076,.008,.009,stone);
 const plants=[];for(const x of [-width/2-.25,width/2+.25])for(const z of [-depth/2+.15,depth/2-.1])for(let j=0;j<5;j++)plants.push({x:x+Math.cos(j*2.4)*.13,z:z+Math.sin(j*2.4)*.18,type:j%3?'daisy':'cosmos',height:.19+j*.025});
 group.add(createMixedBorder({seed:927,plants}));
 return {group,update(time,reduced){flowTexture.offset.y=reduced?0:-(time*.11)%1;}};
}
