import {createWingFlowerBeds} from './wing-flower-beds.js';
import {createMixedBorder} from '../models/mixed-border.js';

export function createFullBorders(clearOfRoad){
 let seed=823;const random=()=>{seed=seed*16807%2147483647;return(seed-1)/2147483646;};
 function build(drifts,foliage,alliums,name){
  const plants=[];const isCentral=name==='full-central-mixed-border';const density=isCentral?1.45:1;
  for(const d of drifts)for(let i=0;i<Math.ceil(d.n*density);i++){
   const a=random()*6.28,r=Math.sqrt(random()),x=d.x+Math.cos(a)*r*d.rx,z=d.z+Math.sin(a)*r*d.rz;
   if(clearOfRoad(x,z,.34))plants.push({x,z,type:d.type,height:d.h*(.8+random()*.4)});
  }
  for(const f of foliage)for(let i=0;i<Math.ceil(f.n*density);i++){
   const a=random()*6.28,r=Math.sqrt(random()),x=f.x+Math.cos(a)*r*f.rx,z=f.z+Math.sin(a)*r*f.rz;
   if(clearOfRoad(x,z,.36))plants.push({x,z,type:'foliage',height:.23+random()*.19});
  }
  for(const p of alliums)if(clearOfRoad(p.x,p.z,.34))plants.push({...p,type:'allium'});
  if(isCentral)for(const plant of plants){plant.x=-.5+(plant.x+.5)*1.3;plant.z=6.4+(plant.z-6.4)*1.65;}
  const group=createMixedBorder({seed:seed+3,plants:plants.filter(p=>clearOfRoad(p.x,p.z,.34))});group.name=name;return group;
 }
 const central=build([
  {x:-1.35,z:6.4,rx:.66,rz:.5,n:20,type:'daisy',h:.36},
  {x:-.35,z:6.25,rx:.68,rz:.48,n:25,type:'cosmos',h:.55},
  {x:.55,z:6.5,rx:.55,rz:.4,n:16,type:'daisy',h:.32},
  {x:-.75,z:5.8,rx:.5,rz:.28,n:10,type:'salvia',h:.78},
  {x:.5,z:5.95,rx:.33,rz:.25,n:7,type:'salvia',h:.68},
  {x:-1.65,z:6.95,rx:.48,rz:.26,n:10,type:'daisy',h:.2},
  {x:.12,z:7.05,rx:.6,rz:.25,n:12,type:'daisy',h:.22},
  {x:-.55,z:6.75,rx:.4,rz:.25,n:8,type:'groundcover',h:.19}
 ],[{x:-1.2,z:6.6,rx:.95,rz:.6,n:42},{x:.25,z:6.45,rx:.78,rz:.67,n:37}],
 [{x:-.85,z:5.95,height:1.12},{x:.05,z:5.85,height:1.24}], 'full-central-mixed-border');
 const greenhouse=createWingFlowerBeds();
 return {central,greenhouse};
}
