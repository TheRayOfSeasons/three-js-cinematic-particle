import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { materials } from './SphereHero';

function makeInstances(geometry, material) {
  const instanceCount = material.userData.instanceCount;
  const instanceID = new THREE.InstancedBufferAttribute(
    new Float32Array(new Array(instanceCount).fill(0).map((_, index) => index)),
    1
  );
  geometry = new THREE.InstancedBufferGeometry().copy(geometry);
  geometry.addAttribute('instanceID', instanceID);
  geometry.maxInstancedCount = instanceCount;
  return geometry;
}

const createAnimatedImportedCellSpread = (scene, camera) => {
  return {
    scene,
    camera,
    parameters: {
      count: 200,
      maxCount: 1000,
      groupsAtATime: 1,
      distance: {
        max: 300,
        min: 100
      }
    },
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function () {
      this.rotatingGroup = new THREE.Group();

      const loader = new GLTFLoader();

      this.instancedMeshes = [];
      this.dummy = new THREE.Object3D();
      loader.load('/models/cell2.glb', object => {
        const children = [];
        try {
          object.scene.traverse(child => {
            if (child.isMesh) {
              children.push(child);
            }
          });
        }
        catch (error) {
          return;
        }

        for(const child of children) {
          const geometry = child.geometry;
          const material = child.material;
          material.transparent = true;
          material.opacity = 0.99;
          material.blending = THREE.AdditiveBlending;
          const instancedMesh = new THREE.InstancedMesh(geometry, material, this.parameters.maxCount);
          instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          this.group.add(instancedMesh);
          this.instancedMeshes.push(instancedMesh);
        }

        let i = 0;
        for(let x = 0; x < this.parameters.count; x++) {
          for(let y = 0; y < this.parameters.count; y++) {
            for(let z = 0; z < this.parameters.count; z++) {
              this.dummy.position.set(
                100 * (0.5 - Math.random()),
                100 * (0.5 - Math.random()),
                100 * (0.5 - Math.random())
              );
              this.dummy.updateMatrix();
              for(const instancedMesh of this.instancedMeshes) {
                instancedMesh.setMatrixAt(i++, this.dummy.matrix);
              }
            }
          }
        }
      });

    },
    update: function (time) {
      const elapsedTime = this.clock.getElapsedTime();

      if(!this.activeMeshes)
        return;

      this.group.rotation.y = (elapsedTime * 0.1);

      if(this.instancedMeshes && this.dummy) {
        for(const instancedMesh of this.instancedMeshes) {
          instancedMesh.setMatrixAt(0, this.dummy.matrix);
        }
      }
    }
  }
}

export { createAnimatedImportedCellSpread };
