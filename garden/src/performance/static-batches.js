import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** Merge render-only copies; source objects remain available for site raycasting. */
export function batchStaticScene(scene,{exclude=[]}={}){
 scene.updateMatrixWorld(true);
 const excluded=new Set(exclude),batches=new Map();let sourceMeshes=0;
 // Animated groups opt out as a whole; merging would freeze them in place.
 scene.traverse(object=>{if(object.userData.dynamic)object.traverse(child=>excluded.add(child));});
 scene.traverse(object=>{
  if(!object.isMesh||object.isInstancedMesh||!object.visible||excluded.has(object))return;
  const material=object.material;
  if(!material||Array.isArray(material)||!material.visible||material.transparent||material.isShaderMaterial||material.colorWrite===false||(Object.hasOwn(material,'onBeforeCompile')&&!object.name.startsWith('botanical-')))return;
  if(!object.geometry?.attributes.position)return;
  const materialKey=object.name.startsWith('botanical-')?'botanical:'+material.color.getHexString()+':'+Object.hasOwn(material,'onBeforeCompile'):material.uuid;
  const key=materialKey+':'+object.castShadow+':'+object.receiveShadow;
  if(!batches.has(key))batches.set(key,{material,cast:object.castShadow,receive:object.receiveShadow,objects:[]});
  batches.get(key).objects.push(object);
 });
 const root=new THREE.Group();root.name='static-render-batches';let mergedDraws=0;
 for(const batch of batches.values()){
  if(batch.objects.length<2)continue;
  const geometries=batch.objects.map(object=>{
   let geo=object.geometry.clone();if(geo.index){const indexed=geo;geo=geo.toNonIndexed();indexed.dispose();}
   if(!geo.attributes.normal)geo.computeVertexNormals();
   for(const name of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(name))geo.deleteAttribute(name);
   if(!geo.attributes.uv)geo.setAttribute('uv',new THREE.Float32BufferAttribute(new Float32Array(geo.attributes.position.count*2),2));
   geo.clearGroups();geo.applyMatrix4(object.matrixWorld);return geo;
  });
  const combined=mergeGeometries(geometries,false);geometries.forEach(geometry=>geometry.dispose());
  if(!combined)continue;
  combined.computeBoundingSphere();const mesh=new THREE.Mesh(combined,batch.material);mesh.castShadow=batch.cast;mesh.receiveShadow=batch.receive;root.add(mesh);
  for(const object of batch.objects)object.visible=false;
  sourceMeshes+=batch.objects.length;mergedDraws++;
 }
 scene.add(root);return {sourceMeshes,batches:mergedDraws,drawCallsSaved:sourceMeshes-mergedDraws};
}
