import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** Standalone conservatory model. Local front is +Z; no scene or DOM dependencies. */
export function createGreenhouse() {
  const group = new THREE.Group();
  group.name = 'arched-conservatory';
  const frameMaterial = new THREE.MeshStandardMaterial({color:'#425b50',roughness:.68,metalness:.22});
  const stoneMaterial = new THREE.MeshStandardMaterial({color:'#d4ccb4',roughness:1});
  const floorMaterial = new THREE.MeshStandardMaterial({color:'#cbc7ad',roughness:1});
  const glassMaterial = new THREE.MeshPhysicalMaterial({color:'#dce8df',transparent:true,opacity:.12,roughness:.16,metalness:0,clearcoat:.45,side:THREE.DoubleSide,depthWrite:false});
  const metalParts=[],stoneParts=[],floorParts=[],glassParts=[];
  function cuboid(parts,x,y,z,w,h,d,rotation=0){const geo=new THREE.BoxGeometry(w,h,d);geo.rotateY(rotation);geo.translate(x,y,z);parts.push(geo);}
  function rod(a,b,r=.022){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);const geo=new THREE.CylinderGeometry(r,r,delta.length(),6);geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize()));geo.translate(...av.add(bv).multiplyScalar(.5).toArray());metalParts.push(geo);}
  function pane(points){const positions=[];for(let i=1;i<points.length-1;i++)positions.push(...points[0],...points[i],...points[i+1]);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geo.computeVertexNormals();glassParts.push(geo);}
  const base=.19,wall=1.48,rise=2.12,half=3.1,depth=5.2,front=depth/2;
  const roofPoint=(angle,z)=>[half*Math.cos(angle),base+wall+rise*Math.sin(angle),z];
  // Narrow perimeter sill rather than a massive podium. Center opening is a real doorway.
  cuboid(floorParts,0,.035,0,6.2,.07,depth);
  for(const x of [-half,half])cuboid(stoneParts,x,.1,0,.16,.2,depth+.16);
  cuboid(stoneParts,0,.1,-front,6.35,.2,.16);
  for(const x of [-1.98,1.98])cuboid(stoneParts,x,.1,front,2.24,.2,.16);
  cuboid(stoneParts,0,.055,front+.43,1.9,.11,.72);
  // Seven slender transverse ribs; polygonal glazing follows precisely the same profile.
  const bays=6,arcs=16;
  for(let j=0;j<=bays;j++){
    const z=-front+j*depth/bays;
    for(const x of [-half,half])rod([x,base,z],[x,base+wall,z],.027);
    for(let i=0;i<arcs;i++)rod(roofPoint(i*Math.PI/arcs,z),roofPoint((i+1)*Math.PI/arcs,z),.027);
  }
  for(let i=0;i<=arcs;i+=2)rod(roofPoint(i*Math.PI/arcs,-front),roofPoint(i*Math.PI/arcs,front),i===8?.028:.018);
  for(const x of [-half,half])for(const y of [base,base+.74,base+wall])rod([x,y,-front],[x,y,front],.021);
  for(let j=0;j<bays;j++){
    const z0=-front+j*depth/bays,z1=z0+depth/bays;
    for(let i=0;i<arcs;i++)pane([roofPoint(i*Math.PI/arcs,z0),roofPoint((i+1)*Math.PI/arcs,z0),roofPoint((i+1)*Math.PI/arcs,z1),roofPoint(i*Math.PI/arcs,z1)]);
    for(const x of [-half,half])pane([[x,base,z0],[x,base+wall,z0],[x,base+wall,z1],[x,base,z1]]);
  }
  // End-wall mullions and individually cut glass; front center is open, not a full glass sheet.
  for(const z of [-front,front]){
    for(let i=0;i<8;i++){
      const x0=-half+i*half/4,x1=x0+half/4;
      const y0=base+wall+rise*Math.sqrt(Math.max(0,1-(x0/half)**2));
      const y1=base+wall+rise*Math.sqrt(Math.max(0,1-(x1/half)**2));
      const doorBay=z===front&&i>=3&&i<=4;
      const bottom=doorBay?2.35:base;
      pane([[x0,bottom,z],[x1,bottom,z],[x1,y1,z],[x0,y0,z]]);
      if(!doorBay)rod([x0,base,z],[x0,y0,z],.022);
      else rod([x0,2.35,z],[x0,y0,z],.022);
    }
    if(z===front){rod([-half,base+wall,z],[-.775,base+wall,z],.021);rod([.775,base+wall,z],[half,base+wall,z],.021);}else rod([-half,base+wall,z],[half,base+wall,z],.021);
  }
  // Door proportions remain subordinate to the main vault.
  const door=.775;
  for(const x of [-door,door])rod([x,base,front+.015],[x,2.35,front+.015],.032);
  rod([-door,2.35,front+.015],[door,2.35,front+.015],.028);
  // Delicate double-door leaves opened outward, preserving transparent access.
  for(const side of [-1,1]){
    const hinge=new THREE.Vector3(side*door,0,front+.025),angle=side*-.25;
    const transform=(x,y)=>[hinge.x+x*Math.cos(angle),y,hinge.z-x*Math.sin(angle)];
    const width=-side*door;
    for(const [a,b] of [[[0,base],[width,base]],[[0,2.32],[width,2.32]],[[0,base],[0,2.32]],[[width,base],[width,2.32]],[[0,1.15],[width,1.15]]])rod(transform(...a),transform(...b),.018);
    pane([transform(0,base),transform(width,base),transform(width,2.32),transform(0,2.32)]);
    rod(transform(width*.82,1.1),transform(width*.82,1.32),.022);
  }
  function wing(center,width,wingDepth){
    const low=base,high=2.01,peak=2.54,zcenter=.15;
    cuboid(floorParts,center,.04,zcenter,width,.08,wingDepth);
    for(const x of [center-width/2,center+width/2])cuboid(stoneParts,x,.1,zcenter,.13,.2,wingDepth);
    for(const z of [zcenter-wingDepth/2,zcenter+wingDepth/2])cuboid(stoneParts,center,.1,z,width,.2,.13);
    for(let i=0;i<=3;i++){
      const z=zcenter-wingDepth/2+i*wingDepth/3;
      for(const x of [center-width/2,center+width/2])rod([x,low,z],[x,high,z],.023);
      rod([center-width/2,high,z],[center,peak,z],.023);rod([center,peak,z],[center+width/2,high,z],.023);
    }
    for(const [x,y] of [[center-width/2,high],[center,peak],[center+width/2,high]])rod([x,y,zcenter-wingDepth/2],[x,y,zcenter+wingDepth/2],.02);
    for(const x of [center-width/2,center+width/2]){
      pane([[x,low,zcenter-wingDepth/2],[x,high,zcenter-wingDepth/2],[x,high,zcenter+wingDepth/2],[x,low,zcenter+wingDepth/2]]);
      pane([[x,high,zcenter-wingDepth/2],[center,peak,zcenter-wingDepth/2],[center,peak,zcenter+wingDepth/2],[x,high,zcenter+wingDepth/2]]);
    }
    for(const z of [zcenter-wingDepth/2,zcenter+wingDepth/2])pane([[center-width/2,low,z],[center+width/2,low,z],[center+width/2,high,z],[center,peak,z],[center-width/2,high,z]]);
  }
  wing(-4.08,1.96,3.2);wing(3.78,1.36,3.2);
  // Inset central floor runner, no dense interior planting.
  cuboid(floorParts,0,.081,.3,1.48,.012,4.65);
  function batch(parts,material,name,shadows=true){const geometry=mergeGeometries(parts);for(const part of parts)part.dispose();const m=new THREE.Mesh(geometry,material);m.name=name;m.castShadow=shadows;m.receiveShadow=shadows;group.add(m);return m;}
  batch(metalParts,frameMaterial,'slender-frame');batch(stoneParts,stoneMaterial,'low-stone-sill');batch(floorParts,floorMaterial,'floor');const panes=batch(glassParts,glassMaterial,'clear-glazing',false);panes.renderOrder=2;
  const plantMaterial=new THREE.MeshStandardMaterial({color:'#6e8c5f',flatShading:true,roughness:1});
  const clayMaterial=new THREE.MeshStandardMaterial({color:'#ac8062',roughness:1});
  for(const [x,z] of [[-2.35,-1.65],[2.3,-1.6],[-4.08,.3]]){
    const pot=new THREE.Mesh(new THREE.CylinderGeometry(.23,.16,.38,8),clayMaterial);pot.position.set(x,.3,z);pot.castShadow=true;group.add(pot);
    for(let i=0;i<4;i++){const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(.27,0),plantMaterial);const a=i*Math.PI/2;leaf.position.set(x+Math.cos(a)*.12,.65+i*.1,z+Math.sin(a)*.12);leaf.scale.set(.6,1.3,.45);leaf.rotation.z=Math.cos(a)*.35;leaf.castShadow=true;group.add(leaf);}
  }
  const wood=new THREE.MeshStandardMaterial({color:'#a28361',roughness:1});
  const table=new THREE.Mesh(new THREE.BoxGeometry(1.35,.09,.65),wood);table.position.set(-2,1,-.2);table.castShadow=true;group.add(table);
  for(const x of [-2.52,-1.48]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.06,.82,.5),wood);leg.position.set(x,.55,-.2);leg.castShadow=true;group.add(leg);}
  const bounds=new THREE.Box3().setFromObject(group).getSize(new THREE.Vector3());
  group.userData.dimensions={width:bounds.x,depth:bounds.z,height:bounds.y,rightWingWidth:1.36,leftWingWidth:1.96};
  return group;
}
