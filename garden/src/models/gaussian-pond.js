import * as THREE from 'three';
import { SplatMesh } from '@sparkjsdev/spark';

/** Shares the existing SparkRenderer; keeps the source PLY intact. */
export function loadGaussianPond() {
  const container = new THREE.Group();
  container.name = 'gaussian-pond-bridge';
  const splats = new SplatMesh({url:'/models/pond-gaussian-original.ply',raycastable:false});
  container.add(splats);
  const ready = splats.initialized.then(() => {
    splats.rotation.x = Math.PI;
    const bounds = splats.getBoundingBox(true).applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI));
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const footprint = Math.max(size.x,size.z);
    if(!Number.isFinite(footprint)||footprint<=0)throw new Error('Invalid pond bounds');
    const scale = 5.6 / footprint;
    splats.scale.setScalar(scale);
    splats.position.set(-center.x,-bounds.min.y,-center.z).multiplyScalar(scale);
    const info = {format:'Gaussian Splat PLY',splats:splats.numSplats,rotationX:Math.PI,width:size.x*scale,height:size.y*scale,depth:size.z*scale,originalAsset:true};
    container.userData.modelInfo = info;
    return info;
  });
  return {container,ready};
}
