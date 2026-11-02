import * as THREE from 'three';

export const GARDEN_HOME={position:[0,17,42],target:[0,.4,2]};
// Footprints follow actual destinations rather than empty corners of a giant box.
const frames=[
 [0,-3,5.1,3,5],[-15,-9,.9,.9,2.8],[15,-8,1.1,1.1,3.1],[-10,.8,2.4,3.1,4.1],[10,-1,2.4,2.6,4],[-8,-9.5,2.1,2,5],
 [-8,11.2,4,4.1,1.3],[7,11.3,3.2,3.2,1.6],[-13,1,2.1,2,3.8],[10,-6,2.7,2.5,4.6],
 [-14,5,1.1,1.1,4.1],[12,10,1.15,1.15,4.5],[1,16,.9,.9,3.8],[11,15,1.1,1.1,2.8]
];
export const GARDEN_FRAME_POINTS=[];
for(const [x,z,rx,rz,h]of frames)for(const dx of [-rx,rx])for(const dz of [-rz,rz])for(const y of [0,h])GARDEN_FRAME_POINTS.push(new THREE.Vector3(x+dx,y,z+dz));


/** Match the approved frontal, low-angle reference while fitting the complete garden. */
export function fitGardenView(camera,width,height){
 camera.updateMatrixWorld(true);
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
 for(const corner of GARDEN_FRAME_POINTS){const p=corner.clone().applyMatrix4(camera.matrixWorldInverse);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
 const aspect=width/height,viewHeight=Math.max((maxY-minY)/.76,(maxX-minX)/(aspect*.86))*1.12;
 const cx=(minX+maxX)/2+.6,cy=(minY+maxY)/2+viewHeight*.065;
 camera.left=cx-viewHeight*aspect/2;camera.right=cx+viewHeight*aspect/2;camera.top=cy+viewHeight/2;camera.bottom=cy-viewHeight/2;camera.updateProjectionMatrix();
 return {viewHeight};
}
export function resetGardenView(camera,controls,width,height){
 camera.position.fromArray(GARDEN_HOME.position);controls.target.fromArray(GARDEN_HOME.target);camera.zoom=1;controls.update();fitGardenView(camera,width,height);
}
