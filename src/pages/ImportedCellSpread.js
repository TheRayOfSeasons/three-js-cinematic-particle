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
      count: 2000,
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

      const textureLoader = new THREE.TextureLoader();
      const loader = new GLTFLoader();
      const uvMap = textureLoader.load('/models/cell_normal_map.jpeg');

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


        const geometries = [];
        for (let i = 0; i < this.parameters.count; i++) {
          const span = i % 4 == 0 ? this.parameters.distance.max : this.parameters.distance.min;
          const x = i == 0 ? 0 : span * (0.5 - Math.random());
          const y = i == 0 ? 0 : span * (0.5 - Math.random());
          const z = i == 0 ? 0 : span * (0.5 - Math.random());
          for (let j = 0; j < children.length; j++) {
            const singleGeometry = children[j].geometry.clone();
            singleGeometry.translate(x, y, z);
            if (Array.isArray(geometries[j]))
              geometries[j].push(singleGeometry);
            else
              geometries[j] = [singleGeometry];
          }
        }

        this.meshes = [];
        for (let j = 0; j < children.length; j++) {
          const geometry = BufferGeometryUtils.mergeBufferGeometries(geometries[j]);
          const material = children[j].material;
          material.transparent = true;
          material.opacity = 0.99;
          material.blending = THREE.AdditiveBlending;
          this.meshes.push({ geometry, material });
        }

        this.activeMeshes = [];
        this.newPositionZ = 0;
        for(let i = 0; i < this.parameters.groupsAtATime; i++) {
          const z = i * this.parameters.distance.max;
          this.newPositionZ = z;
          for(const { geometry, material } of this.meshes) {
            const mesh = new THREE.Mesh(geometry, material);
            this.activeMeshes.push(mesh);
            mesh.position.z = z;
            this.group.add(mesh);
          }
        }
        this.toRemove = this.activeMeshes[0];
      });

    },
    update: function (time) {
      const elapsedTime = this.clock.getElapsedTime();

      if(!this.activeMeshes)
        return;

      this.group.rotation.y = (elapsedTime * 0.1);
      if(this.activeMeshes.length > 0) {
        for(const activeMesh of this.activeMeshes) {
          // activeMesh.position.z = (elapsedTime * 10);
        }

        // const distance = this.toRemove.position.distanceTo(this.camera.position);
        // if(distance > 20) {
        //   // dispose no longer visible object
        //   this.toRemove.geometry.dispose();
        //   this.toRemove.material.dispose();
        //   this.scene.remove(this.toRemove);
        //   this.toRemove = this.activeMeshes[1];
        //   this.activeMeshes.shift();

        //   // create new potentially visible object
        //   // this.newPositionZ += this.parameters.distance.max;
        //   // if(this.mayadd) {
        //   for(const { geometry, material } of this.meshes) {
        //     const mesh = new THREE.Mesh(geometry, material);
        //     this.activeMeshes.push(mesh);
        //     mesh.position.z = 0;
        //     this.scene.add(mesh);
        //   }
        //   // }
        // }
      }
    }
  }
}

export { createAnimatedImportedCellSpread };
