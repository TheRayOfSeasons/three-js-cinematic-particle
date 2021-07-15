import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const createAnimatedImportedCellSpread = (scene, camera) => {
  return {
    scene,
    camera,
    parameters: {
      count: 300,
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
          this.dummy.position.set(
            200 * (0.5 - Math.random()),
            200 * (0.5 - Math.random()),
            100 * (0.5 - Math.random())
          );
          this.dummy.updateMatrix();
          for(const instancedMesh of this.instancedMeshes) {
            instancedMesh.setMatrixAt(i++, this.dummy.matrix);
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
