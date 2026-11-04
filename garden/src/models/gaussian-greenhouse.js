import { loadModelBytes } from './compressed-model.js';
import { addSplatShadow } from './splat-shadows.js';
import * as THREE from 'three';
import { SparkRenderer, SplatMesh } from '@sparkjsdev/spark';

export function loadGaussianGreenhouse(renderer, scene, onProgress) {
  const spark = new SparkRenderer({ renderer, maxPixelRadius: 128, minSortIntervalMs: 40, enableLod: true, lodSplatCount: 350000, lodRenderScale: 0.015 });
  spark.name = 'garden-splat-renderer';
  scene.add(spark);
  const container = new THREE.Group();
  container.name = 'gaussian-greenhouse';
  return { container, spark, ready: (async () => {
    const fileBytes=await loadModelBytes('greenhouse-gaussian',onProgress);
    const splats=new SplatMesh({fileBytes,raycastable:false});
    container.add(splats);
    await splats.initialized;
    await splats.createLodSplats();
    // Lux3D's long building axis is Z in this export; orient it across the garden.
    splats.rotation.set(Math.PI, Math.PI / 2, 0);
    const bounds = splats.getBoundingBox(true).applyMatrix4(new THREE.Matrix4().makeRotationFromEuler(splats.rotation));
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 9.65 / size.x;
    splats.position.set(-center.x, -bounds.min.y, -center.z).multiplyScalar(scale);
    splats.scale.setScalar(scale);
    addSplatShadow(container,size.x*scale,size.y*scale,size.z*scale,'greenhouse');
    // Use one cheap invisible hit volume rather than raycasting 800k splats on pointermove.
    const hit = new THREE.Mesh(new THREE.BoxGeometry(size.x * scale, size.y * scale, size.z * scale),new THREE.MeshBasicMaterial({visible:false}));
    hit.position.copy(center).multiplyScalar(scale).add(splats.position);
    hit.name = 'greenhouse-click-target';container.add(hit);
    return {format:'Gaussian Splat PLY',asymmetric:false,originalAsset:false,entrancePillarsRemoved:true,splats:splats.numSplats,scale,bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
  })() };
}
