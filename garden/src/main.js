import {GARDEN_HOME,fitGardenView,resetGardenView} from './details/garden-view.js';
import {createBuildingGround} from './details/building-ground.js';
import {createForestStudio} from './details/forest-studio.js';
import {createCandleAtelier} from './details/candle-atelier.js';
import {batchStaticScene} from './performance/static-batches.js';
import {createLawnRill} from './details/lawn-rill.js';
import {createGardenLights} from './details/garden-lights.js';
import {createStoneLantern} from './details/stone-lantern.js';
import {createFullBorders} from './details/full-borders.js';
import {createSakura} from './models/sakura.js';
import {createFountain} from './details/fountain.js';
import {createGardenLife} from './details/life.js';
import {createPond} from './models/pond.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { loadGaussianGreenhouse } from './models/gaussian-greenhouse.js';
import { createMixedBorder } from './models/mixed-border.js';
import { loadGaussianArch } from './models/gaussian-arch.js';

const host=document.querySelector('#garden');
if(parent!==window)document.documentElement.classList.add('embedded-garden');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});}catch(error){document.querySelector('#loading p').textContent='This garden needs WebGL';document.querySelector('#loading-note').textContent='Try opening this page in a browser with hardware acceleration enabled.';throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,parent!==window?1:1.5));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.setClearColor('#b9c2a6');renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;host.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#b9c2a6');scene.fog=new THREE.Fog('#b9c2a6',50,130);
const camera=new THREE.OrthographicCamera(-24,24,24,-24,.1,180);camera.position.fromArray(GARDEN_HOME.position);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.fromArray(GARDEN_HOME.target);controls.enableDamping=true;controls.dampingFactor=.07;controls.enablePan=true;controls.enableZoom=false;controls.minZoom=.65;controls.maxZoom=2.5;controls.minPolarAngle=.28;controls.maxPolarAngle=1.15;controls.maxAzimuthAngle=.85;controls.minAzimuthAngle=-.85;controls.mouseButtons={LEFT:THREE.MOUSE.ROTATE,MIDDLE:THREE.MOUSE.DOLLY,RIGHT:THREE.MOUSE.PAN};controls.update();
scene.add(new THREE.HemisphereLight('#fff8df','#65734e',2.3));const sun=new THREE.DirectionalLight('#fff4d5',3.1);sun.position.set(-18,30,14);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:.5,far:100});sun.shadow.normalBias=.035;sun.shadow.bias=-.00015;sun.shadow.radius=2;scene.add(sun);
const colors={grass:'#82916b',pine:'#365a42',leaf:'#78965c',wood:'#a4784e',darkwood:'#6b4e35',stone:'#d4ccb0',metal:'#3d5449',ivory:'#e0ddca',water:'#6f9990',pink:'#e9b8b3'};
const scatteredPlants=[];
const mats=new Map();function mat(color,extra={}){const key=color+JSON.stringify(extra);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.9,flatShading:true,...extra}));return mats.get(key);}
const geometries={box:new THREE.BoxGeometry(1,1,1),ico:new THREE.IcosahedronGeometry(1,0),sphere:new THREE.SphereGeometry(1,8,5),cone:new THREE.ConeGeometry(1,1,6),cyl:new THREE.CylinderGeometry(1,1,1,8)};
function mesh(geo,color,parent=scene){const m=new THREE.Mesh(geo,typeof color==='string'?mat(color):color);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,x,y,z,w,h,d,color){const m=mesh(geometries.box,color,parent);m.position.set(x,y,z);m.scale.set(w,h,d);return m;}
function ball(parent,x,y,z,r,color,scale=[1,1,1]){const m=mesh(geometries.ico,color,parent);m.position.set(x,y,z);m.scale.set(r*scale[0],r*scale[1],r*scale[2]);return m;}
function cylinder(parent,x,y,z,r,h,color){const m=mesh(geometries.cyl,color,parent);m.position.set(x,y,z);m.scale.set(r,h,r);return m;}
function beam(parent,a,b,r,color){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),5),color,parent);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
function line(parent,pts,r,color){const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)));return mesh(new THREE.TubeGeometry(curve,Math.max(16,pts.length*3),r,4,false),color,parent);}
let seed=159;function rand(){seed=(seed*16807)%2147483647;return(seed-1)/2147483646;}function range(a,b){return a+(b-a)*rand();}
const ground=box(scene,0,-.35,0,200,.6,200,colors.grass);ground.castShadow=false;
for(let i=0;i<9;i++){const hill=ball(scene,-75+i*18,-1,-45-range(0,18),range(12,25),i%2?'#a2af90':'#94a582',[1,.22,1]);hill.castShadow=false;}
// Overlapping rounded low-poly hills, with bases buried below the ground.
for(const [depth,height,color,phase] of [[-51,8,'#b0bbb0',1.8],[-38,5.5,'#a4b39c',.8],[-28,2.8,'#99aa88',2.6]]){
 for(let i=0;i<11;i++){
  const x=-90+i*18,rise=height*(.8+.25*Math.sin(i*1.7+phase));
  const geometry=new THREE.SphereGeometry(1,10,6);
  const hill=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true}));
  hill.position.set(x,-1.6,depth+Math.sin(i*1.3+phase)*3);hill.scale.set(17,rise,10);hill.name='distant-landscape';hill.castShadow=false;scene.add(hill);
 }
}
for(let i=0;i<15;i++){
 const x=-30+i*4.3,z=-21-Math.sin(i*2.1)*2.4,h=.45+(Math.sin(i*4.7)+1)*.3;
 const pine=new THREE.Mesh(new THREE.ConeGeometry(h*.24,h,5),mat('#728b70'));pine.position.set(x,h*.5+.12,z);pine.castShadow=false;scene.add(pine);
}
const sites={greenhouse:{x:0,z:-3,title:'Code greenhouse',short:'CODE GREENHOUSE',number:'01 / EXPERIMENTS',subtitle:'Small ideas, made tangible.',body:'这里将展示我的 vibe coding projects、交互实验与小工具。当前是空间原型，作品尚未加入。',height:5},cabin:{x:-10,z:.8,title:'Living cabin',short:'LIVING CABIN',number:'02 / SPACES',subtitle:'A home is always becoming.',body:'这间木屋是空间设计与 home remodeling 的入口。之后会放入材质探索、空间方案与改造记录。',height:3.8},florist:{x:10,z:-1,title:'Candle atelier',short:'CANDLE ATELIER',number:'03 / OBJECTS & SCENT',subtitle:'Making room for a slower ritual.',body:'这间花店是蜡烛、器皿、香气与材料实验的创作空间。之后会加入真实作品、过程照片和设计故事。',height:3.6},pergola:{x:-8,z:-9.5,title:'The pergola',short:'THE PERGOLA',number:'04 / PAUSE',subtitle:'Nothing to finish. A moment to stay.',body:'一个可以停留的角落。第一阶段先确认开放式圆穹顶、路径和周围留白。',height:4.5}};
const targets=[];const labels=[];let gardenSplatRenderer=null;
function siteGroup(key){const data=sites[key],g=new THREE.Group();g.position.set(data.x,0,data.z);if(key!=='pergola')g.userData.place=key;scene.add(g);if(key!=='pergola')targets.push(g);if(key==='pergola')return g;const el=document.createElement('div');el.className='map-label';el.textContent=data.short;document.querySelector('#labels').append(el);labels.push({el,key,pos:new THREE.Vector3(data.x,data.height,data.z)});return g;}
const glass=mat('#c1d5c4',{transparent:true,opacity:.16,roughness:.2,side:THREE.DoubleSide,depthWrite:false});
function greenhouse(){
 const g=siteGroup('greenhouse');
 const model=loadGaussianGreenhouse(renderer,scene,event=>{if(event.total)document.querySelector('#loading-note').textContent='Loading greenhouse '+Math.round(event.loaded/event.total*100)+'%';});
 gardenSplatRenderer=model.spark;g.add(model.container);
 return model.ready.then(info=>{window.greenhouseModelInfo=info;}).catch(error=>{document.querySelector('#loading').classList.remove('done');document.querySelector('#loading p').textContent='The greenhouse could not load';document.querySelector('#loading-note').textContent='Please refresh to try again.';console.error(error);throw error;});
}

function pot(parent,x,y,z,s=.35){cylinder(parent,x,y+s*.5,z,s*.65,s,'#aa7757');beam(parent,[x,y+s,z],[x,y+s*3,z],.035,'#466746');for(let i=0;i<4;i++){const a=i*Math.PI/2;ball(parent,x+Math.cos(a)*s*.5,y+s*(1.5+i*.25),z+Math.sin(a)*s*.5,s*.6,colors.leaf,[1,.4,.6]);}}
function roof(g,w,d,y,color){const shape=new THREE.Shape();shape.moveTo(-w/2,0);shape.lineTo(0,w*.4);shape.lineTo(w/2,0);shape.closePath();const geom=new THREE.ExtrudeGeometry(shape,{depth:d,bevelEnabled:false});const m=mesh(geom,color,g);m.position.set(0,y,-d/2);for(let i=0;i<7;i++){const z=-d/2+i*d/6;beam(g,[-w/2,y+.02,z],[0,y+w*.4+.02,z],.025,'#896346');beam(g,[0,y+w*.4+.02,z],[w/2,y+.02,z],.025,'#896346');}}
function cabin(){const g=siteGroup('cabin');g.add(createForestStudio());}
function florist(){const g=siteGroup('florist');g.add(createCandleAtelier());}
function pergola(){
 const g=siteGroup('pergola');cylinder(g,0,.14,0,1.65,.28,colors.stone);
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3,x=1.45*Math.cos(a),z=1.45*Math.sin(a);
  cylinder(g,x,1.65,z,.065,3,colors.ivory);cylinder(g,x,.35,z,.13,.4,colors.ivory);
  const points=[];for(let j=0;j<=15;j++){const t=j/15*Math.PI/2;points.push([Math.cos(a)*1.55*Math.cos(t),3.1+1.4*Math.sin(t),Math.sin(a)*1.55*Math.cos(t)]);}line(g,points,.027,colors.ivory);
 }
 for(const [r,y] of [[1.6,3.08],[1.6,2.88],[.32,4.48]]){const ring=mesh(new THREE.TorusGeometry(r,.025,4,40),colors.ivory,g);ring.rotation.x=Math.PI/2;ring.position.y=y;}
 ball(g,0,4.68,0,.12,colors.ivory);
 // Botanical drifts inside the rear perimeter; front-facing entrance stays open.
 const plants=[];let state=774;const random=()=>{state=state*16807%2147483647;return(state-1)/2147483646;};
 // Fine flowering vines wind around the rear columns, with varied bloom heights.
 for(const a of [Math.PI,Math.PI*4/3,Math.PI*5/3]){
  const points=[];for(let j=0;j<=24;j++){const t=j/24,y=.35+t*2.65,twist=t*Math.PI*5,x=1.45*Math.cos(a)+.1*Math.cos(twist),z=1.45*Math.sin(a)+.1*Math.sin(twist);points.push([x,y,z]);if(j%3===0)plants.push({x,z,y,height:.08+random()*.08,type:j%2?'cosmos':'daisy'});}
  line(g,points,.012,'#73855b');
 }
 const flowers=createMixedBorder({seed:772,plants});flowers.name='pergola-detailed-flowers';g.add(flowers);
 const bulbMats=['#f7dfaa','#efd0b6','#ead8bd'].map(color=>new THREE.MeshStandardMaterial({color,emissive:color,emissiveIntensity:1.2,roughness:.55}));
 // Six gently sagging festoon spans, plus three fine strings beneath the dome.
 for(let i=0;i<6;i++){
  const a=i*Math.PI/3,b=(i+1)*Math.PI/3,start=new THREE.Vector3(1.46*Math.cos(a),2.98,1.46*Math.sin(a)),end=new THREE.Vector3(1.46*Math.cos(b),2.98,1.46*Math.sin(b));
  const pts=[];for(let j=0;j<=16;j++){const t=j/16,p=start.clone().lerp(end,t);p.y-=Math.sin(t*Math.PI)*.24;pts.push(p.toArray());}
  line(g,pts,.009,'#877e62');
  for(let j=1;j<=5;j++){const t=j/6,p=start.clone().lerp(end,t);p.y-=Math.sin(t*Math.PI)*.24;beam(g,p.toArray(),[p.x,p.y-.08,p.z],.012,'#877e62');const bulb=mesh(new THREE.SphereGeometry(.037,7,5),bulbMats[(i+j)%3],g);bulb.position.set(p.x,p.y-.1,p.z);bulb.castShadow=false;}
 }
 for(let i=0;i<3;i++){
  const a=i*Math.PI*2/3,pts=[];for(let j=0;j<=18;j++){const t=j/18;pts.push([Math.cos(a)*1.4*t,4.34-1.48*t-.17*Math.sin(t*Math.PI),Math.sin(a)*1.4*t]);}line(g,pts,.007,'#978e72');
  for(let j=1;j<7;j++){const t=j/7;const bulb=mesh(new THREE.SphereGeometry(.026,6,4),bulbMats[j%3],g);bulb.position.set(Math.cos(a)*1.4*t,4.31-1.48*t-.17*Math.sin(t*Math.PI),Math.sin(a)*1.4*t);bulb.castShadow=false;}
 }
 const glow=new THREE.PointLight('#ffe0ac',.65,4,2);glow.position.set(0,2.5,0);g.add(glow);
}
// Keep decorative stepping stones clear of the rotated lawn's brick perimeter.
function overlapsLawnBricks(x,z,radius){
 const dx=x+8,dz=z-11.2,localX=Math.cos(.35)*dx+Math.sin(.35)*dz,localZ=-Math.sin(.35)*dx+Math.cos(.35)*dz;
 const xEdge=2.46,zEdge=3.56,padding=radius+.16;
 return (Math.abs(Math.abs(localX)-xEdge)<padding&&Math.abs(localZ)<zEdge+padding)||(Math.abs(Math.abs(localZ)-zEdge)<padding&&Math.abs(localX)<xEdge+padding);
}
function stone(parent,x,z,s=.4){const points=[];for(let i=0;i<6;i++){const a=i*Math.PI/3,r=s*range(.7,1.15);points.push(new THREE.Vector2(Math.cos(a)*r,Math.sin(a)*r));}const sh=new THREE.Shape(points);const m=mesh(new THREE.ExtrudeGeometry(sh,{depth:.06+.012*Math.sin(x*9+z*3),bevelEnabled:true,bevelSize:.015,bevelThickness:.01,bevelSegments:1,steps:1}),['#d7cfb6','#c7c3aa','#ded6be'][Math.floor(rand()*3)],parent);m.rotation.x=-Math.PI/2;m.rotation.z=range(0,6);m.position.set(x,-.045,z);m.castShadow=true;m.visible=clearOfRoad(x,z,s*1.15)&&!overlapsLawnBricks(x,z,s*1.15);return m;}
const brickPalette=['#c7c0a9','#d4ccb5','#bcb8a1','#ddd5bf','#ccc5ad'];
function flatBrick(parent,x,z,w,d,color){const tile=mesh(new THREE.PlaneGeometry(w,d),color,parent);tile.rotation.x=-Math.PI/2;tile.position.set(x,-.041,z);tile.castShadow=false;return tile;}
function roadBed(curve,width){
 const points=curve.getSpacedPoints(Math.ceil(curve.getLength()/.1)),vertices=[];
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],ta=curve.getTangentAt(i/(points.length-1)),tb=curve.getTangentAt((i+1)/(points.length-1));
  const al=[a.x+ta.z*width/2,-.043,a.z-ta.x*width/2],ar=[a.x-ta.z*width/2,-.043,a.z+ta.x*width/2],bl=[b.x+tb.z*width/2,-.043,b.z-tb.x*width/2],br=[b.x-tb.z*width/2,-.043,b.z+tb.x*width/2];
  for(const v of [al,bl,ar,ar,bl,br])vertices.push(...v);
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.computeVertexNormals();const bed=mesh(geometry,mat('#ccc5ad',{side:THREE.DoubleSide}));bed.castShadow=false;
}
const brickRoads=[];
const paths={};function path(name,pts,width=.85,stepping=false){const curve=new THREE.CatmullRomCurve3(pts.map(([x,z])=>new THREE.Vector3(x,.035,z)));paths[name]=curve;curve.userData={width,stepping};if(!stepping){brickRoads.push({curve,width,samples:curve.getSpacedPoints(110)});roadBed(curve,width);}const n=Math.ceil(curve.getLength()/(stepping?(name==='pergola'?1.08:1):.32));for(let i=0;i<=n;i++){const t=i/n,p=curve.getPointAt(t),tangent=curve.getTangentAt(t),angle=Math.atan2(tangent.x,tangent.z);if(stepping){stone(scene,p.x+range(-.09,.09),p.z+range(-.09,.09),range(.19,.3));}else{for(let row=0;row<3;row++){const off=(row-1)*width/3;const variation=Math.sin(i*17.3+row*4.8);const tone=Math.floor(rand()*brickPalette.length);const b=flatBrick(scene,p.x+Math.cos(angle)*off+variation*.003,p.z-Math.sin(angle)*off+Math.cos(i*8.1+row)*.003,width/3+.004,.34+variation*.003,brickPalette[tone]);b.rotation.z=angle+variation*.006;}}}return curve;}
// Every route has an explicit destination; no paths terminating in empty lawn.
path('entry',[[0,0],[0,1.6],[-1,3],[-2.9,5.3],[-4.1,7.4],[-5.26,8.37]],1.05);
path('flower-loop',[[-1,3],[1.5,3.8],[3.6,6.9],[.8,9],[-2.2,8.9],[-4.1,7.4]],.7);
path('fountain',[[1.5,3.8],[4.5,3.8],[6.9,4.8],[7.2,6.4],[5.4,8.3],[.8,9]],.64);
path('shop',[[6.9,4.8],[8.8,3.1],[10,sites.florist.z+2]],.6);
path('floral-arch',[[10,sites.florist.z+2],[11.4,sites.florist.z+3.3],[12.8,sites.florist.z+3.3],[12.8,sites.florist.z+1.8]],.5,true);
path('cabin',[[-4.1,7.4],[-6.4,6.2],[-8.8,4.3],[-10,sites.cabin.z+2.5]],.5,true);
path('pergola',[[-10,sites.cabin.z-1.6],[-9.8,-3.2],[-8.8,-5.9],[-8,-7.9]],.44,true);
path('pond',[[.8,9],[3.4,9.2],[6.1,8.9],[8.25,9.65]],.44,true);
const greenhouseReady=greenhouse();cabin();florist();pergola();
function bench(x,z,rotation=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;scene.add(g);box(g,0,.55,0,1.7,.12,.55,colors.wood);box(g,0,.95,-.24,1.7,.65,.09,colors.wood);for(const xx of [-.65,.65]){box(g,xx,.27,0,.07,.55,.45,colors.metal);box(g,xx,.9,-.26,.06,1,.06,colors.metal);}return g;}
// Reference lawn: a long garden rectangle, brick edging, four timber corner posts.
const lawnGroup=new THREE.Group();scene.add(lawnGroup);
const lawn={x:-8,z:11.2,width:4.6,depth:6.8};
box(lawnGroup,lawn.x,-.073,lawn.z,lawn.width,.05,lawn.depth,'#8fa575');
const lawnLeft=lawn.x-lawn.width/2-.16,lawnRight=lawn.x+lawn.width/2+.16;
const lawnBack=lawn.z-lawn.depth/2-.16,lawnFront=lawn.z+lawn.depth/2+.16;
for(const z of [lawnBack,lawnFront]){const n=17;for(let i=0;i<n;i++)flatBrick(lawnGroup,lawnLeft+(lawnRight-lawnLeft)*i/(n-1),z,.285,.32,brickPalette[i%brickPalette.length]);}
for(const x of [lawnLeft,lawnRight]){const n=24;for(let i=0;i<n;i++)flatBrick(lawnGroup,x,lawnBack+(lawnFront-lawnBack)*i/(n-1),.32,.285,brickPalette[(i+2)%brickPalette.length]);}
for(const x of [lawnLeft,lawnRight])for(const z of [lawnBack,lawnFront]){box(lawnGroup,x,.34,z,.15,.62,.15,colors.wood);box(lawnGroup,x,.66,z,.21,.08,.21,'#b18a61');}
lawnGroup.add(bench(lawnLeft-.55,9.5,Math.PI/2));lawnGroup.add(bench(lawnRight+.55,12.25,-Math.PI/2));
const lawnFlowers=createMixedBorder({seed:731,plants:[{x:lawnLeft-.4,z:8.1,type:'groundcover'},{x:lawnLeft-.35,z:13.9,type:'daisy',height:.28},{x:lawnRight+.38,z:8.2,type:'groundcover'},{x:lawnRight+.35,z:14.3,type:'groundcover'}]});lawnGroup.add(lawnFlowers);
for(const child of lawnGroup.children){child.position.x-=lawn.x;child.position.z-=lawn.z;}lawnGroup.position.set(lawn.x,0,lawn.z);lawnGroup.rotation.y=-.35;
const lawnRill=createLawnRill(lawn.width,lawn.depth);lawnGroup.add(lawnRill.group);
const lawnPathLight=createGardenLights(scene,[[-3.7,.05]]);lawnGroup.add(lawnPathLight.group);
function clearOfRoad(x,z,margin=.22){return !brickRoads.some(({samples,width})=>samples.some(p=>(p.x-x)**2+(p.z-z)**2<(width/2+margin)**2));}
function clearOfAllPaths(x,z,margin){return clearOfRoad(x,z,margin)&&!Object.values(paths).some(curve=>curve.getSpacedPoints(90).some(p=>(p.x-x)**2+(p.z-z)**2<(margin+.32)**2));}
scene.add(createBuildingGround(clearOfAllPaths,[{x:sites.cabin.x,z:sites.cabin.z,kind:'cabin'},{x:sites.florist.x,z:sites.florist.z,kind:'shop'}]));
const stoneLantern=createStoneLantern();stoneLantern.position.set(-2.8,0,2.5);stoneLantern.rotation.y=.18;scene.add(stoneLantern);
const fountainGroup=createFountain(clearOfRoad);fountainGroup.position.set(5.4,0,5.8);scene.add(fountainGroup);
// Refined pond uses an independent seed so the rest of the planting stays fixed.
const refinedPond=createPond();refinedPond.group.position.set(7,0,11.3);scene.add(refinedPond.group);
for(let i=0;i<52;i++)rand();
path('bridge-return',[[5.75,12.95],[5.2,14.2],[4.5,14.9],[1,13],[-2.8,11.2],[-5.03,11.225]],.5,true);
function flower(parent,x,y,z,s,color){
 const position=new THREE.Vector3(x,0,z);parent.updateWorldMatrix(true,false);parent.localToWorld(position);
 const index=scatteredPlants.length;
 const type=color==='#e3d6b6'?'groundcover':['daisy','daisy','cosmos','cosmos','salvia','daisy','groundcover','cosmos','groundcover','daisy','salvia','allium','daisy','groundcover','cosmos','daisy'][index%16];
 scatteredPlants.push({x:position.x,z:position.z,y:y>1?y:0,height:Math.max(.2,Math.min(.95,y+s*2.5)),type});
}
function flowerPatch(x,z,r,count){
 const plants=[];let localSeed=Math.abs(Math.round(x*773+z*199))+53;const random=()=>{localSeed=localSeed*16807%2147483647;return(localSeed-1)/2147483646;};
 const drifts=[{x:-.45,z:.14,r:.36,type:'daisy'},{x:.2,z:-.27,r:.4,type:'cosmos'},{x:.48,z:.15,r:.28,type:'groundcover'},{x:-.12,z:-.45,r:.25,type:'salvia'}];
 for(let i=0;i<count;i++){
  const d=drifts[Math.floor(i/4)%drifts.length],a=random()*6.28,rr=Math.sqrt(random())*d.r;
  const xx=x+(d.x+Math.cos(a)*rr)*r,zz=z+(d.z+Math.sin(a)*rr*.7)*r;
  if(clearOfRoad(xx,zz,.33))plants.push({x:xx,z:zz,type:d.type,height:(d.type==='groundcover'?.19:d.type==='salvia'?.62:.4)+random()*.19});
 }
 const g=createMixedBorder({seed:localSeed,plants});g.name='natural-flower-drift';scene.add(g);return g;
}
// An irregular soil footprint beneath the central mixed border, clipped away from paths.
const centralSoilShape=new THREE.Shape();
for(let i=0;i<=72;i++){
 const a=i/72*Math.PI*2,irregular=1+.055*Math.sin(a*3+.5)+.035*Math.cos(a*5);let r=1;
 while(r>.2&&!clearOfRoad(-.5+Math.cos(a)*2.35*irregular*r,6.4+Math.sin(a)*1.48*irregular*r,.06))r-=.025;
 const x=-.5+Math.cos(a)*2.35*irregular*r,z=6.4+Math.sin(a)*1.48*irregular*r;
 i?centralSoilShape.lineTo(x,-z):centralSoilShape.moveTo(x,-z);
}
const centralSoil=mesh(new THREE.ShapeGeometry(centralSoilShape),mat('#8f7c63',{side:THREE.DoubleSide}));centralSoil.name='central-flower-border-soil';centralSoil.rotation.x=-Math.PI/2;centralSoil.position.y=-.039;centralSoil.castShadow=false;
const fullBorders=createFullBorders(clearOfRoad);const centralBorder=fullBorders.central;scene.add(centralBorder,fullBorders.greenhouse);
// Sparse, partly buried stones and short tufts connect the greenhouse beds to the lawn.
const greenhouseTufts=[];
for(const [x,z,size]of [[-4.65,-.94,.25],[-5.04,-.66,.12],[-2.3,-.55,.17],[2.05,-.22,.13],[4.8,-.14,.28],[5.17,.12,.14]]){
 if(!clearOfRoad(x,z,.35))continue;
 const rock=ball(scene,x,-.018,z,size,'#a4a58f',[1.35,.58,.9]);rock.rotation.y=x*1.7;
 for(let j=0;j<2;j++){const xx=x+Math.cos(j*2.3+.7)*.25,zz=z+Math.sin(j*2.3+.7)*.22;if(clearOfRoad(xx,zz,.35))greenhouseTufts.push({x:xx,z:zz,type:'grass',height:.12+j*.05});}
}
scene.add(createMixedBorder({seed:438,plants:greenhouseTufts}));
flowerPatch(12,-5,1.25,12);
// Imported floral arch: rigid orientation correction, no geometry deformation.
const floralArch=loadGaussianArch();floralArch.container.position.set(12.8,0,1.8+sites.florist.z);scene.add(floralArch.container);
const archReady=floralArch.ready.then(info=>{window.archModelInfo=info;}).catch(error=>{document.querySelector('#loading').classList.remove('done');document.querySelector('#loading p').textContent='The floral arch could not load';document.querySelector('#loading-note').textContent='Please refresh to try again.';console.error(error);throw error;});

function tree(x,z,s=1,type='round'){
 const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=Math.sin(x*17+z*31)*Math.PI;scene.add(g);
 // Local randomness avoids moving other plants when tree silhouettes change.
 let state=Math.abs(Math.round(x*7381+z*1933))+71;const random=()=>{state=state*16807%2147483647;return(state-1)/2147483646;};
 if(type==='bush'){
  for(let j=0;j<4;j++){const a=j*2.399,r=(.32+random()*.12)*s;const crown=ball(g,Math.cos(a)*.29*s,(.24+random()*.13)*s,Math.sin(a)*.27*s,r,j%2?'#829367':'#71885c',[1.15,.8,1]);crown.rotation.y=a;}
  return g;
 }
 const lean=(random()-.5)*.22*s;
 beam(g,[0,0,0],[lean,1.9*s,.08*s],.105*s,'#795b43');
 const greens=type==='pine'?['#3e6049','#4a6b4f','#365740']:type==='column'?['#426847','#50754d','#3e6244']:['#78925c','#879e66','#6d8954'];
 if(type==='pine'){
  // Unequal whorls with offset, irregular polygon edges, rather than one cone.
  for(let j=0;j<4;j++){
   const h=(.9+j*.7)*s,r=(.95-j*.205)*s,geo=new THREE.ConeGeometry(r,1.25*s,7,1);
   const positions=geo.attributes.position;
   for(let i=0;i<positions.count;i++){const xx=positions.getX(i),zz=positions.getZ(i),a=Math.atan2(zz,xx),f=1+.1*Math.sin(a*3+j*1.7);positions.setXYZ(i,xx*f,positions.getY(i)+.06*s*Math.sin(a*2+j),zz*f);}
   geo.computeVertexNormals();const crown=mesh(geo,greens[j%3],g);crown.position.set(lean+(random()-.5)*.15*s,h,(random()-.5)*.15*s);crown.rotation.y=j*.77;crown.rotation.z=(random()-.5)*.09;
  }
 }else if(type==='column'){
  for(let j=0;j<5;j++){
   const a=j*2.4,r=(.5-Math.abs(j-2)*.045)*s;
   ball(g,lean+Math.cos(a)*.16*s,(1.15+j*.46)*s,Math.sin(a)*.15*s,r,greens[j%3],[.8,1.45,.85]);
  }
 }else{
  for(let j=0;j<4;j++){
   const a=j*2.399+(random()-.5)*.4,reach=(.35+random()*.4)*s;
   const end=[lean+Math.cos(a)*reach,(1.7+random()*.7)*s,Math.sin(a)*reach];
   beam(g,[lean*.5,1.15*s,0],end,.045*s,'#795b43');
   const crown=ball(g,end[0],end[1]+.24*s,end[2],(.55+random()*.24)*s,greens[j%3],[1.05,.73+random()*.2,.9]);crown.rotation.y=a;crown.rotation.z=(random()-.5)*.24;
  }
 }
 return g;
}
for(const [x,z,s,t] of [[-5,-7,1,'pine'],[5,-5,1.2,'pine'],[6,-7,1,'pine'],[-6.8,-11.3,1,'round'],[-5.4,-10.5,1.1,'pine'],[-14,5,1.2,'pine'],[-3.1,11.5,1.05,'pine'],[12,10,1.3,'pine'],[1,16,1,'pine'],[11,15,.9,'round'],[-15,-9,.9,'round'],[-14,-16,1,'pine'],[11,-12,1,'pine'],[15,-8,1,'round'],[3,-10,.7,'round'],[-13,10,.8,'round'],[14,4,.8,'pine']])tree(x,z,s,t);
for(let i=0;i<32;i++){const x=range(-45,45),z=range(-52,-23);const size=range(.35,.85);if(x>-20&&x<16)continue;tree(x,z,size,i%3?'pine':'round');}
function sakura(x,z,s=1){const g=createSakura({seed:Math.abs(Math.round(x*751+z*179))+11,scale:s});g.position.set(x,0,z);scene.add(g);return g;}
const sakuraTrees=[sakura(-13,1,1),sakura(10,-6,1.3)];
for(let i=0;i<45;i++){const x=range(-19,19),z=range(-20,19);if(Math.abs(x)<12&&z>-10&&z<14)continue;ball(scene,x,.14,z,range(.15,.35),'#9b9e88',[1,.6,1]);}
const life=createGardenLife(scene,camera,paths['fountain'],sakuraTrees,fountainGroup,reduced);
let sakuraTurn=0;for(const b of document.querySelectorAll('[data-moment]'))b.onclick=()=>life.interact(sakuraTrees[sakuraTurn++%sakuraTrees.length]);
const pathLights=createGardenLights(scene,[[3.7,5],[8,3+sites.florist.z],[-7.6,3.3+sites.cabin.z]]);

// Botanical flowers share the central border's petal, leaf and stem geometry.
// Separate seeded scatter leaves the existing scene layout unchanged.
let grassSeed=8437;const grassRandom=()=>{grassSeed=(grassSeed*16807)%2147483647;return(grassSeed-1)/2147483646;};
const routeSamples=Object.values(paths).flatMap(curve=>curve.getSpacedPoints(90));
for(let i=0;i<340;i++){
 const x=-19+grassRandom()*38,z=-20+grassRandom()*39;
 if(Object.values(sites).some(site=>Math.abs(x-site.x)<(site===sites.greenhouse?5.5:2.5)&&Math.abs(z-site.z)<3.3))continue;
 const lawnDx=x-lawn.x,lawnDz=z-lawn.z,lawnLocalX=Math.cos(.35)*lawnDx+Math.sin(.35)*lawnDz,lawnLocalZ=-Math.sin(.35)*lawnDx+Math.cos(.35)*lawnDz;
 if(Math.abs(lawnLocalX)<lawn.width/2+.5&&Math.abs(lawnLocalZ)<lawn.depth/2+.5)continue;
 if(((x-7)/3.2)**2+((z-11.3)/2.7)**2<1)continue;
 if(Math.hypot(x-5.4,z-5.8)<1.3||Math.hypot(x+.5,z-6.4)<1.6)continue;
 if(routeSamples.some(p=>(p.x-x)**2+(p.z-z)**2<.55**2))continue;
 scatteredPlants.push({x,z,type:'grass',height:.16+grassRandom()*.23});
}
let grassIndex=0;const sparsePlants=scatteredPlants.filter(plant=>clearOfRoad(plant.x,plant.z,.33)&&(plant.type!=='grass'||(grassIndex++%5)<2));
// Loose drifts frame the arch and shop without blocking their entrances.
const shopPlants=[];let shopSeed=439;const shopRandom=()=>{shopSeed=shopSeed*16807%2147483647;return(shopSeed-1)/2147483646;};
for(const drift of [{x:11.75,z:1.35,r:.4,n:10},{x:13.8,z:1.5,r:.5,n:10},{x:13.1,z:-.15,r:.6,n:12},{x:8.8,z:2.8,r:.3,n:6},{x:11.6,z:2.2,r:.45,n:8}]){
 for(let i=0;i<drift.n;i++){const a=shopRandom()*Math.PI*2,r=Math.sqrt(shopRandom())*drift.r;shopPlants.push({x:drift.x+Math.cos(a)*r,z:drift.z+sites.florist.z+Math.sin(a)*r*.7,height:.2+shopRandom()*.48,type:['daisy','cosmos','groundcover','salvia','daisy'][i%5]});}
}
const shopBorder=createMixedBorder({seed:443,plants:shopPlants.filter(p=>clearOfRoad(p.x,p.z,.33))});shopBorder.name='florist-and-arch-flower-drifts';scene.add(shopBorder);
function chalkboard(x,z,angle,scale,title,subtitle){
 const g=new THREE.Group();g.name='florist-chalkboard';g.position.set(x,0,z);g.rotation.y=angle;g.scale.setScalar(scale);scene.add(g);
 const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;const ctx=canvas.getContext('2d');ctx.fillStyle='#303d35';ctx.fillRect(0,0,256,320);ctx.strokeStyle='#d7dcc5';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(128,260);ctx.lineTo(128,90);ctx.moveTo(128,200);ctx.quadraticCurveTo(65,190,71,148);ctx.moveTo(128,170);ctx.quadraticCurveTo(190,158,185,119);ctx.stroke();for(let i=0;i<5;i++){const a=i*Math.PI*2/5;ctx.beginPath();ctx.ellipse(128+Math.cos(a)*20,88+Math.sin(a)*20,14,7,a,0,Math.PI*2);ctx.stroke();}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const face=mesh(new THREE.PlaneGeometry(.55,.7),new THREE.MeshBasicMaterial({map:texture}),g);face.position.set(0,.65,.065);face.rotation.x=-.12;
 for(const xx of [-.31,.31]){beam(g,[xx,.04,.23],[xx,1.08,-.015],.035,colors.darkwood);beam(g,[xx,.04,-.3],[xx,1.08,-.015],.03,colors.darkwood);}
 for(const y of [.27,1.04])box(g,0,y,.025,.68,.055,.07,colors.wood);
 beam(g,[-.31,.37,-.19],[.31,.37,-.19],.018,colors.darkwood);
}
chalkboard(8.95,2.65+sites.florist.z,-.2,.8,'Atelier','candles & scent');
chalkboard(11.55,2.95+sites.florist.z,.16,1,'Slow days','small rituals');

const gardenBotanicals=createMixedBorder({seed:90210,plants:sparsePlants});gardenBotanicals.name='garden-scattered-botanicals';scene.add(gardenBotanicals);
const windTime={value:0};
for(const planting of [gardenBotanicals,centralBorder,shopBorder,fullBorders.greenhouse])planting.traverse(object=>{
 if(!object.isMesh||!object.name.startsWith('botanical-'))return;
 object.material.onBeforeCompile=shader=>{
  shader.uniforms.gardenTime=windTime;
  shader.vertexShader='uniform float gardenTime;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float swayWeight=min(1.0,pow(max(0.0,position.y),2.0));
   transformed.x+=sin(gardenTime*1.15+position.x*1.7+position.z)*.025*swayWeight;
  `);
 };
});
const dialog=document.querySelector('#details');
const kitchen=document.querySelector('#kitchen');
const atelier=document.querySelector('#atelier');
const projectModals=[kitchen,atelier];
let previousFocus=null;
function positionProjectModal(modal) {
  if (parent === window) return;
  const frame = window.frameElement?.getBoundingClientRect();
  if (!frame) return;
  const top = Math.max(0, 64 - frame.top);
  const bottom = Math.min(innerHeight, parent.innerHeight - frame.top);
  modal.style.setProperty('--project-top', `${top + 12}px`);
  modal.style.setProperty('--project-height', `${Math.max(0, bottom - top - 24)}px`);
}
if (parent !== window) {
  parent.addEventListener('scroll', () => { for(const modal of projectModals) if(modal.open) positionProjectModal(modal); }, {passive:true});
  parent.addEventListener('resize', () => { for(const modal of projectModals) if(modal.open) positionProjectModal(modal); });
}
for(const modal of projectModals) modal.addEventListener('close', () => previousFocus?.focus({preventScroll:true}));
const kitchenPhotoButtons = kitchen.querySelectorAll('[data-kitchen-photo]');
const kitchenMainPhoto = kitchen.querySelector('#kitchen-after-main');
for (const button of kitchenPhotoButtons) {
  button.addEventListener('click', () => {
    const thumbnail = button.querySelector('img');
    kitchenMainPhoto.src = thumbnail.src;
    kitchenMainPhoto.alt = thumbnail.alt;
    for (const option of kitchenPhotoButtons) {
      option.setAttribute('aria-pressed', String(option === button));
    }
  });
}

function openPlace(key){if(key==='pergola')return;const d=sites[key];previousFocus=document.activeElement;
if(key==='cabin'||key==='florist'){const modal=key==='cabin'?kitchen:atelier;positionProjectModal(modal);modal.showModal();modal.scrollTop=0;return;}
document.querySelector('#detail-title').textContent=key==='greenhouse'?'Coming soon':d.title;document.querySelector('#detail-body').textContent='';dialog.showModal();}
for(const b of document.querySelectorAll('[data-place]'))b.onclick=()=>openPlace(b.dataset.place);
for(const d of document.querySelectorAll('dialog')){d.querySelector('.close').onclick=()=>d.close();d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}});}dialog.addEventListener('close',()=>previousFocus?.focus());
const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();function hit(e){const r=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);ray.setFromCamera(pointer,camera);const hits=ray.intersectObjects([...targets,...life.targets],true);if(!hits.length)return null;let obj=hits[0].object;while(obj&&!obj.userData.place&&!obj.userData.interaction)obj=obj.parent;return obj||null;}
let hoveredPlace=null;renderer.domElement.addEventListener('pointerleave',()=>{life.hover(null);hoveredPlace=null;});let down=null;renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});renderer.domElement.addEventListener('pointerup',e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5){const k=hit(e);if(k?.userData.place)openPlace(k.userData.place);else if(k)life.interact(k);}down=null;});let lastHoverHit=0;renderer.domElement.addEventListener('pointermove',e=>{const now=performance.now();if(now-lastHoverHit<40||down)return;lastHoverHit=now;const k=hit(e);life.hover(k);hoveredPlace=k?.userData.place||null;renderer.domElement.style.cursor=k?'pointer':'grab';});
function reset(){resetGardenView(camera,controls,innerWidth,innerHeight);}document.querySelector('#reset').onclick=reset;function zoom(f){camera.zoom=THREE.MathUtils.clamp(camera.zoom*f,.65,2.5);camera.updateProjectionMatrix();}document.querySelector('#zoom-in').onclick=()=>zoom(1.16);document.querySelector('#zoom-out').onclick=()=>zoom(1/1.16);
let cameraMovingUntil=0,splatUpdateUntil=0,splatUpdating=false,splatsPrepared=false;
function setSplatBudget(budget){if(gardenSplatRenderer&&gardenSplatRenderer.lodSplatCount!==budget){gardenSplatRenderer.lodSplatCount=budget;gardenSplatRenderer.lodDirty=true;}}
controls.addEventListener('start',()=>{cameraMovingUntil=performance.now()+250;});
controls.addEventListener('change',()=>{cameraMovingUntil=performance.now()+200;splatUpdateUntil=performance.now()+700;if(gardenSplatRenderer)gardenSplatRenderer.enableDriveLod=true;});

function resize(){fitGardenView(camera,innerWidth,innerHeight);renderer.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);resize();
const labelProjection=new THREE.Vector3();let lastLabelUpdate=0;
let perfStart=performance.now(),perfFrames=0;
let lastGardenFrame=0,splatCheckFrames=0,splatMinimum=Infinity;
let gardenVisible=parent===window;addEventListener('message',event=>{if(event.origin===location.origin&&event.source===parent&&event.data?.type==='garden-visibility')gardenVisible=!!event.data.visible;if(event.origin===location.origin&&event.source===parent&&event.data?.type==='garden-action'&&['zoom-in','zoom-out','reset'].includes(event.data.action))document.getElementById(event.data.action)?.click();});
if(parent!==window)parent.postMessage({type:'garden-ready'},location.origin);
function render(){const frameTime=performance.now();if(!gardenVisible||document.hidden||frameTime-lastGardenFrame<(frameTime<cameraMovingUntil?1000/60:1000/30)-1){requestAnimationFrame(render);return;}lastGardenFrame=frameTime;controls.update();
if(splatsPrepared&&!splatUpdating&&frameTime<splatUpdateUntil){splatUpdating=true;gardenSplatRenderer.update({scene,camera}).catch(console.error).finally(()=>{splatUpdating=false;});}
const time=performance.now()/1000;refinedPond.update(time);lawnRill.update(time,reduced);life.update(time);windTime.value=reduced?0:time;if(time-lastLabelUpdate>1/24){lastLabelUpdate=time;for(const l of labels){const p=labelProjection.copy(l.pos).project(camera);l.el.style.left=(p.x*.5+.5)*innerWidth+'px';l.el.style.top=(-p.y*.5+.5)*innerHeight+'px';l.el.style.opacity=p.z>1||p.x>1||p.x<-1||p.y>1||p.y<-1?'0':hoveredPlace===l.key?'.98':'.52';}}renderer.render(scene,camera);if(splatsPrepared&&splatCheckFrames<120){splatCheckFrames++;splatMinimum=Math.min(splatMinimum,gardenSplatRenderer.activeSplats);document.body.dataset.gardenInitialSplats=JSON.stringify({frames:splatCheckFrames,minimum:splatMinimum});}perfFrames++;const perfNow=performance.now();if(perfNow-perfStart>2000){document.body.dataset.gardenPerformance=JSON.stringify({fps:Math.round(perfFrames*1000/(perfNow-perfStart)),drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles});perfFrames=0;perfStart=perfNow;}requestAnimationFrame(render);}Promise.all([greenhouseReady,archReady]).then(async()=>{
 window.gardenBatchInfo=batchStaticScene(scene,{exclude:[ground]});
 renderer.shadowMap.needsUpdate=true;
 // Model decoding is not the same as a sorted, renderable splat frame.
 // Keep the loading cover up until both models have stable LoD instances.
 controls.update();cameraMovingUntil=0;setSplatBudget(camera.zoom>1.6?550000:350000);
 const spark=gardenSplatRenderer;spark.autoUpdate=false;
 let stable=0,stableSince=0,lastMapping=-1;
 try{
  for(let frame=0;frame<360&&stable<3;frame++){
   await spark.update({scene,camera});renderer.render(scene,camera);
   const mapping=spark.display.mappingVersion;
   const ready=spark.lodInstances.size>=2&&spark.display.numSplats>0&&!spark.sorting&&!spark.sortDirty&&!spark.lodDirty&&spark.lodInitQueue.length===0;
   if(!ready||mapping!==lastMapping){stableSince=performance.now();stable=0;}
   else if(performance.now()-stableSince>=350)stable++;
   lastMapping=mapping;
   await new Promise(requestAnimationFrame);
  }
 }finally{spark.autoUpdate=false;}
 if(stable<3)throw new Error('Splat first frame did not become stable');
 // Preserve the warmed-up selection until a real camera change requests a new one.
 spark.enableDriveLod=false;splatsPrepared=true;
 document.body.dataset.gardenSplatReady='stable';
 renderer.render(scene,camera);
 await new Promise(requestAnimationFrame);
 document.querySelector('#loading').classList.add('done');
 render();
}).catch(error=>{console.error('Garden initialization failed',error);document.querySelector('#loading p').textContent='The garden could not finish loading. Please refresh.';});
// Exposed read-only QA state; no external services or generated-image background.
window.gardenPrototype={stage:2,sites:Object.keys(sites),paths:Object.keys(paths),renderer:'Three.js',get drawCalls(){return renderer.info.render.calls;},get triangles(){return renderer.info.render.triangles;}};
