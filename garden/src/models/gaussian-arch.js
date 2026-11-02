import { addSplatShadow } from './splat-shadows.js';
import * as THREE from 'three';
import { SplatMesh } from '@sparkjsdev/spark';

/** Uses the garden's existing SparkRenderer. Original PLY remains byte-for-byte intact. */
export function loadGaussianArch() {
  const container = new THREE.Group();
  container.name = 'gaussian-floral-arch';
  const splats = new SplatMesh({url:import.meta.env.BASE_URL + 'models/floral-arch-gaussian-sage.ply',raycastable:false});
  splats.name = 'imported-floral-arch';
  container.add(splats);
  const ready = splats.initialized.then(async () => {
    await splats.createLodSplats();
    // Source uses Y down. A rigid 180-degree X rotation makes the feet point down.
    splats.rotation.x = Math.PI;
    const bounds = splats.getBoundingBox(true).applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI));
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    if(!Number.isFinite(size.y)||size.y<=0)throw new Error('Invalid arch bounds');
    const scale = 2.75 / size.y;
    splats.scale.setScalar(scale);
    addSplatShadow(container,size.x*scale,size.y*scale,size.z*scale,'arch');
    splats.position.set(-center.x,-bounds.min.y,-center.z).multiplyScalar(scale);
    const info={format:'Gaussian Splat PLY',splats:splats.numSplats,rotationX:Math.PI,height:2.75,width:size.x*scale,depth:size.z*scale,originalAsset:false,greenRecolored:true,geometryUnchanged:true};
    container.userData.modelInfo=info;
    return info;
  });
  return {container,ready};
}
