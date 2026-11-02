import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

// Reusable, deterministic low-poly botanical forms. Geometry is merged by material.
export function createMixedBorder({ seed = 26030, specimens = false, plants = null, avoid = null, variety = .3 } = {}) {
  const group = new THREE.Group();group.name = specimens ? 'flower-specimens' : 'central-mixed-border';
  const batches=new Map();const counts={daisy:0,cosmos:0,salvia:0,allium:0,groundcover:0,grass:0};
  const palette={stem:'#57724c',leaf:'#728957',lightleaf:'#8c9b6c',cream:'#e9e3cb',blush:'#d8a9b1',rose:'#bb899e',lavender:'#a294b9',violet:'#827ba0',gold:'#d3bb75',blue:'#789bbb',deepblue:'#5e82ab',skyblue:'#abc4d3'};
  let state=seed;const random=()=>{state=(state*16807)%2147483647;return(state-1)/2147483646;};const between=(a,b)=>a+(b-a)*random();
  let baseY=0,stemScale=.6;
  function add(geometry,color,matrix){if(matrix)geometry.applyMatrix4(matrix);if(baseY)geometry.translate(0,baseY,0);if(geometry.index)geometry=geometry.toNonIndexed();if(!geometry.attributes.normal)geometry.computeVertexNormals();geometry.deleteAttribute('uv');if(!batches.has(color))batches.set(color,[]);batches.get(color).push(geometry);}
  const up=new THREE.Vector3(0,1,0);
  function transform(position,rotation=new THREE.Quaternion(),scale=new THREE.Vector3(1,1,1)){return new THREE.Matrix4().compose(position,rotation,scale);}
  function segment(a,b,r=.009,color=palette.stem){r*=stemScale;const delta=b.clone().sub(a);add(new THREE.CylinderGeometry(r*.72,r,delta.length(),4),color,transform(a.clone().add(b).multiplyScalar(.5),new THREE.Quaternion().setFromUnitVectors(up,delta.normalize())));}
  function bud(center,r,color,flatten=.7){add(new THREE.IcosahedronGeometry(r,0),color,transform(center,new THREE.Quaternion(),new THREE.Vector3(1,flatten,1)));}
  // Folded tapered leaf, six broad faces. No photoreal leaf texture or tiny serrations.
  function leaf(origin,length,width,angle,lift=.4,color=palette.leaf){const points=[0,0,0,-width*.45,length*.22,length*.3,0,length*.36,length*.5,width*.45,length*.22,length*.3,-width*.32,length*lift,length*.69,0,length*(lift+.12),length*.72,width*.32,length*lift,length*.69,0,length*(lift+.18),length];
    const indices=[0,1,2,0,2,3,1,4,2,2,4,5,2,5,6,2,6,3,4,7,5,5,7,6];const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();geo.rotateY(angle);geo.translate(origin.x,origin.y,origin.z);add(geo,color);}
  function stem(x,z,h,bend=.1){const base=new THREE.Vector3(x,.025,z),mid=new THREE.Vector3(x+bend*.3,h*.53,z+bend*.16),top=new THREE.Vector3(x+bend,h,z+bend*.35);segment(base,mid);segment(mid,top,.007);for(let i=0;i<2;i++)leaf(new THREE.Vector3(mid.x,h*(.23+i*.22),mid.z),between(.1,Math.max(.11,Math.min(.24,h*.45))),.065,random()*Math.PI*2,.45,i?palette.lightleaf:palette.leaf);return top;}
  // Cupped petal has a visible central fold and irregular rounded/polygonal tip.
  function petal(length,width,cosmos=false){const y=cosmos?.014:.008;const positions=[0,0,0,-width*.38,y,length*.44,0,-.009,length*.53,width*.38,y,length*.44,-width*.5,y+.012,length*.85,-width*.2,y+.022,length, width*.2,y+.022,length,width*.5,y+.012,length*.85];const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex([0,1,2,0,2,3,1,4,2,2,4,5,2,5,6,2,6,7,2,7,3]);geo.computeVertexNormals();return geo;}
  function blossom(center,r,color,petals=8,cosmos=false){if(!specimens&&random()<.12){bud(center,r*.32,color,1.15);for(let j=0;j<3;j++)leaf(center.clone().add(new THREE.Vector3(0,-r*.3,0)),r*.65,r*.22,j*2.1,.7);return;}const tilt=new THREE.Quaternion().setFromEuler(new THREE.Euler(between(-.55,.55),random()*6.28,between(-.45,.45)));for(let i=0;i<petals;i++){const q=tilt.clone().multiply(new THREE.Quaternion().setFromAxisAngle(up,i*Math.PI*2/petals+between(-.045,.045)));add(petal(r*between(.9,1.1),r*(cosmos?.9:.48),cosmos),color,transform(center,q));}bud(center.clone().add(new THREE.Vector3(0,.012,0)),r*.24,palette.gold,.52);}
  function daisy(x,z,h=.5){if(avoid?.(x,z))return;counts.daisy++;const head=stem(x,z,h,between(-.08,.08));blossom(head,between(.065,.09),palette.cream,9);for(let j=0;j<2;j++){const a=random()*6.28,bx=x+Math.cos(a)*.09,bz=z+Math.sin(a)*.09;const secondary=stem(bx,bz,h*between(.58,.86),between(-.08,.08));blossom(secondary,between(.045,.07),palette.cream,8);}if(random()>.6){const side=head.clone().add(new THREE.Vector3(.12,-.13,.08));segment(head.clone().add(new THREE.Vector3(0,-.2,0)),side,.005);blossom(side,.05+random()*.025,palette.cream,8);}}
  function cosmos(x,z,h=.7){if(avoid?.(x,z))return;counts.cosmos++;const head=stem(x,z,h,between(-.13,.13));blossom(head,between(.09,.12),random()>.3?palette.blush:palette.rose,7,true);if(random()>.25){const a=random()*6.28,side=stem(x+Math.cos(a)*.12,z+Math.sin(a)*.12,h*between(.55,.8),between(-.12,.12));blossom(side,between(.06,.09),palette.blush,7,true);}if(random()>.45){const side=head.clone().add(new THREE.Vector3(.16,-.16,-.06));segment(head.clone().add(new THREE.Vector3(0,-.3,0)),side,.005);bud(side,.035,palette.rose);}}
  function salvia(x,z,h=.9){if(avoid?.(x,z))return;counts.salvia++;const top=stem(x,z,h,between(-.06,.06));for(let j=0;j<7;j++){const y=h-.36+j*.052,r=.065*(1-j*.095);for(let k=0;k<3;k++){const a=k*2.4+j*.8;bud(new THREE.Vector3(top.x+Math.cos(a)*r,y,top.z+Math.sin(a)*r),.026*(1-j*.055),j%2?palette.lavender:palette.violet,1.15);}}for(let j=0;j<3;j++)leaf(new THREE.Vector3(x,.05,z),.27,.1,j*2.1,.35);}
  function allium(x,z,h=1.15){if(avoid?.(x,z))return;
    const previousStemScale=stemScale;stemScale=1;
    counts.allium++;
    const center=stem(x,z,h,.035),radius=.115,florets=180;
    // Dense spherical umbel: each floret has six tiny pointed tepals, not a chunky bead.
    add(new THREE.SphereGeometry(.108,16,12),palette.lavender,transform(center));
    for(let j=0;j<florets;j++){
      const yy=1-2*(j+.5)/florets,a=j*2.39996,rr=Math.sqrt(1-yy*yy);
      const normal=new THREE.Vector3(Math.cos(a)*rr,yy,Math.sin(a)*rr);
      const end=center.clone().addScaledVector(normal,radius);
      segment(center.clone().addScaledVector(normal,.093),end,.001,palette.lavender);
      const orientation=new THREE.Quaternion().setFromUnitVectors(up,normal);
      const positions=[],color=j%4?palette.lavender:palette.violet;
      for(let k=0;k<6;k++){
        const angle=k*Math.PI/3+j*.11;
        // One faceted pointed petal. Floret diameter ~.027 vs previous .054 bead.
        const root=new THREE.Vector3(0,.001,0);
        const left=new THREE.Vector3(Math.cos(angle-.25)*.005,.0025,Math.sin(angle-.25)*.005);
        const tip=new THREE.Vector3(Math.cos(angle)*.0135,.006,Math.sin(angle)*.0135);
        const right=new THREE.Vector3(Math.cos(angle+.25)*.005,.0025,Math.sin(angle+.25)*.005);
        for(const v of [root,left,tip,root,tip,right])positions.push(...v.clone().applyQuaternion(orientation).add(end).toArray());
      }
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();add(geo,color);
      bud(end,.0035,palette.violet,.75);
    }
    for(let j=0;j<3;j++)leaf(new THREE.Vector3(x,.03,z),.4,.045,j*2.1,.16);
    stemScale=previousStemScale;
  }
  function groundcover(x,z){if(avoid?.(x,z))return;counts.groundcover++;for(let i=0;i<3;i++){const xx=x+between(-.1,.1),zz=z+between(-.1,.1),top=stem(xx,zz,between(.16,.27),.02);blossom(top,.035+random()*.018,i%3===0?palette.cream:palette.gold,5);leaf(new THREE.Vector3(xx,.03,zz),.16,.09,random()*6.28,.12);}}
  function grass(x,z,h=.65){if(avoid?.(x,z))return;counts.grass++;for(let j=0;j<7;j++)leaf(new THREE.Vector3(x+between(-.035,.035),.03,z+between(-.035,.035)),h*between(.7,1.2),between(.018,.033),j*2.399,.75,palette.lightleaf);}
  function foliage(x,z,h=.25){if(avoid?.(x,z))return;for(let j=0;j<7;j++){const angle=j*2.399+random()*.3;leaf(new THREE.Vector3(x+between(-.04,.04),.02,z+between(-.04,.04)),h*between(.95,1.5),h*.65,angle,between(.25,.55),j%3?palette.leaf:palette.lightleaf);}}
  const extraTypes=['echinacea','hydrangea','pampas','reedGrass','yarrow','geranium','dianthus'];
  for(const type of extraTypes)counts[type]=0;
  function startFlower(type,x,z,h){if(avoid?.(x,z))return null;counts[type]++;return stem(x,z,h,between(-.07,.07));}
  function bell(center,size,color,lean=0){const points=[[.012,0],[size*.3,-size*.18],[size*.44,-size*.65],[size*.62,-size],[size*.54,-size*.83]].map(p=>new THREE.Vector2(...p));const geo=new THREE.LatheGeometry(points,7);geo.rotateZ(lean);geo.translate(center.x,center.y,center.z);add(geo,color);}
  function echinacea(x,z,h=.65){const top=startFlower('echinacea',x,z,h);if(!top)return;for(let j=0;j<11;j++){const geo=petal(.14,.047);geo.rotateX(.6);geo.rotateY(j*Math.PI*2/11);geo.translate(top.x,top.y,top.z);add(geo,palette.gold);}add(new THREE.ConeGeometry(.045,.075,8),palette.gold,transform(top.clone().add(new THREE.Vector3(0,.025,0))));}
  function hydrangea(x,z,h=.42){const top=startFlower('hydrangea',x,z,h);if(!top)return;for(let j=0;j<19;j++){const a=j*2.399,r=Math.sqrt(j/19)*.15,c=top.clone().add(new THREE.Vector3(Math.cos(a)*r,.07*(1-r/.16),Math.sin(a)*r));blossom(c,.035,j%3?palette.blue:palette.skyblue,4,true);}for(let j=0;j<3;j++)leaf(new THREE.Vector3(x,h*.32,z),.25,.19,j*2.1,.3);}
  function yarrow(x,z,h=.45){const top=startFlower('yarrow',x,z,h);if(!top)return;for(let j=0;j<3;j++){const a=j*2.399,c=top.clone().add(new THREE.Vector3(Math.cos(a)*.1,-j*.035,Math.sin(a)*.1));segment(top.clone().add(new THREE.Vector3(0,-.14,0)),c,.004);for(let k=0;k<8;k++){const b=k*2.399,r=Math.sqrt(k/8)*.07;blossom(c.clone().add(new THREE.Vector3(Math.cos(b)*r,0,Math.sin(b)*r)),.025,palette.cream,5);}}}
  function geranium(x,z,h=.3){const top=startFlower('geranium',x,z,h);if(!top)return;for(let j=0;j<4;j++){const a=j*2.4,c=top.clone().add(new THREE.Vector3(Math.cos(a)*.08,between(-.06,.04),Math.sin(a)*.08));segment(new THREE.Vector3(x,h*.5,z),c,.004);blossom(c,.065,palette.skyblue,5,true);leaf(new THREE.Vector3(x,.04,z),.17,.17,a,.25);}}
  function dianthus(x,z,h=.32){const top=startFlower('dianthus',x,z,h);if(!top)return;for(let j=0;j<5;j++){const r=.095,w=.07,positions=[0,0,0,-w*.5,0,r*.6,-w*.5,.015,r,-w*.18,.012,r*.83,0,.02,r,w*.18,.012,r*.83,w*.5,.015,r,w*.5,0,r*.6];const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.setIndex([0,1,2,0,2,3,0,3,4,0,4,5,0,5,6,0,6,7]);geo.rotateY(j*Math.PI*2/5);geo.translate(top.x,top.y,top.z);geo.computeVertexNormals();add(geo,j%2?palette.gold:palette.cream);}bud(top,.018,palette.cream,.6);for(let j=0;j<4;j++)leaf(new THREE.Vector3(x,.03,z),.19,.025,j*1.7,.22);}
  function curvedBlade(x,z,h,angle,width){const points=[],indices=[];for(let j=0;j<=7;j++){const t=j/7,bend=h*.33*t*t,w=width*(1-t)*.5,cx=x+Math.cos(angle)*bend,cz=z+Math.sin(angle)*bend,y=.025+h*(t-.16*t*t);points.push(cx-Math.sin(angle)*w,y,cz+Math.cos(angle)*w,cx+Math.sin(angle)*w,y,cz-Math.cos(angle)*w);if(j<7){const n=j*2;indices.push(n,n+1,n+2,n+1,n+3,n+2);}}const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(points,3));geo.setIndex(indices);geo.computeVertexNormals();add(geo,palette.lightleaf);}
  function pampas(x,z,h=1.1){if(avoid?.(x,z))return;counts.pampas++;for(let j=0;j<10;j++)curvedBlade(x,z,h*between(.48,.77),j*2.399,.037);
   for(let k=0;k<4;k++){const a=k*2.399,top=new THREE.Vector3(x+Math.cos(a)*.12,h*between(.9,1.12),z+Math.sin(a)*.12),root=new THREE.Vector3(x,.03,z);segment(root,top,.0045);const length=h*.26;
    for(let j=0;j<14;j++){const t=j/13,r=Math.sin(t*Math.PI)*.045;for(let side=0;side<3;side++){const b=j*2.399+side*2.094,c=new THREE.Vector3(top.x+Math.cos(b)*r,top.y-length/2+t*length,top.z+Math.sin(b)*r);segment(new THREE.Vector3(top.x,c.y-.025,top.z),c,.0015,palette.cream);bud(c,.012+Math.sin(t*Math.PI)*.007,j%3?palette.cream:palette.gold,1.65);}}
   }
  }
  function reedGrass(x,z,h=1){if(avoid?.(x,z))return;counts.reedGrass++;for(let j=0;j<11;j++)curvedBlade(x,z,h*between(.5,.9),j*2.399,.026);
   for(let k=0;k<5;k++){const a=k*2.399,top=new THREE.Vector3(x+Math.cos(a)*.13,h*between(.88,1.12),z+Math.sin(a)*.13);segment(new THREE.Vector3(x,.025,z),top,.004);
    for(let j=0;j<7;j++){const t=j/6,y=top.y-h*.23+t*h*.23,r=(1-t)*.055,b=a+j*2.399,end=new THREE.Vector3(top.x+Math.cos(b)*r,y+.03,top.z+Math.sin(b)*r);segment(new THREE.Vector3(top.x,y,top.z),end,.0015,palette.gold);bud(end,.009,palette.gold,1.7);}
   }
  }
  if(plants){const types={daisy,cosmos,salvia,allium,groundcover,grass,foliage,echinacea,hydrangea,yarrow,geranium,dianthus,pampas,reedGrass};let plantIndex=0,tallGrassCount=0;for(const plant of plants){const i=plantIndex++;let type=plant.type;if(['daisy','cosmos','salvia','groundcover'].includes(type)&&((i*37+seed)%100)<variety*100)type=extraTypes[(Math.floor(i/3)+seed)%extraTypes.length];if(plant.type==='groundcover'&&extraTypes.includes(type))type=['geranium','dianthus','yarrow'][i%3];if(['pampas','reedGrass'].includes(type)&&type!==plant.type){if((plant.y||0)>.1||plant.type!=='salvia'||(plant.height||.5)<.5||tallGrassCount>=2)type='yarrow';else tallGrassCount++;}baseY=plant.y||0;let height=(plant.height||.5)*between(.88,1.12);if(['pampas','reedGrass'].includes(type))height=Math.max(.95,Math.min(1.2,height*1.4));(types[type]||daisy)(plant.x,plant.z,height);if(plant.type!=='grass'&&plant.type!=='allium'&&plant.type!=='foliage'&&!avoid?.(plant.x,plant.z)&&random()<.35){for(let j=0;j<3;j++)leaf(new THREE.Vector3(plant.x,.025,plant.z),between(.1,.19),.075,j*2.4+random(),.16);}}baseY=0;}
  else if(specimens){daisy(-2.4,0,.55);cosmos(-1.2,0,.7);salvia(0,0,.9);allium(1.2,0,1.1);groundcover(2.4,0);grass(3.5,0,.65);}
  else {
    // Overlapping, irregular drifts: taller back (negative Z), lower front; breaks between groups.
    const drifts=[{x:-.78,z:.22,n:15,r:.5,type:daisy},{x:.22,z:-.12,n:13,r:.53,type:cosmos},{x:.76,z:.24,n:12,r:.42,type:daisy},{x:-.35,z:-.6,n:9,r:.36,type:salvia},{x:.9,z:-.4,n:6,r:.25,type:salvia},{x:-1.05,z:.65,n:7,r:.3,type:groundcover},{x:.45,z:.7,n:8,r:.38,type:groundcover}];
    for(const d of drifts)for(let i=0;i<d.n;i++){const a=random()*6.28,r=Math.sqrt(random())*d.r;d.type(d.x+Math.cos(a)*r,d.z+Math.sin(a)*r,between(.38,.77));}
    allium(-.45,-.36,1.13);allium(.55,-.45,1.28);grass(-1,-.44,.58);grass(.1,-.77,.7);
    // Low foliage connects some drifts but never fills every patch of visible ground.
    for(let i=0;i<23;i++){const a=random()*6.28,r=Math.sqrt(random())*1.2;const x=Math.cos(a)*r,z=Math.sin(a)*r*.65;for(let j=0;j<3;j++)leaf(new THREE.Vector3(x,.025,z),between(.16,.28),.09,a+j*2.1,.3,i%3?palette.leaf:palette.lightleaf);}
  }
  let triangles=0;
  for(const [color,geometries]of batches){const geometry=mergeGeometries(geometries);for(const g of geometries)g.dispose();const material=new THREE.MeshStandardMaterial({color,roughness:1,flatShading:true,side:THREE.DoubleSide});const mesh=new THREE.Mesh(geometry,material);mesh.name='botanical-'+color.slice(1);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);triangles+=geometry.attributes.position.count/3;}
  group.userData={counts,triangles,drawCalls:batches.size};return group;
}
