import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const createAnimatedVirus = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const loader = new GLTFLoader();

      this.instancedMeshes = [];
      this.dummy = new THREE.Object3D();

      const transforms = [
        {
          position: new THREE.Vector3(0, 0, 0),
          rotation: new THREE.Vector3(0, 0, 0),
        },
        {
          position: new THREE.Vector3(10, 2, -5),
          rotation: new THREE.Vector3(0, 0, Math.PI * 0.95),
        },
        {
          position: new THREE.Vector3(-13, -1, -7),
          rotation: new THREE.Vector3(Math.PI * 0.15, 0, 0),
        },
        {
          position: new THREE.Vector3(5, 1.5, 13),
          rotation: new THREE.Vector3(Math.PI * 0.15, Math.PI * 0.75, 0),
        },
      ];

      loader.load('/models/virus.glb', object => {
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
          const material = new THREE.MeshLambertMaterial({
            color: '#979797',
            emissive: '#585858'
          });
          const instancedMesh = new THREE.InstancedMesh(geometry, material, transforms.length);
          instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          this.rotatingGroup.add(instancedMesh);
          this.instancedMeshes.push(instancedMesh);
        }

        let i = 0;
        for(let x = 0; x < transforms.length; x++) {
          const { position, rotation } = transforms[i];
          this.dummy.position.set(
            position.x,
            position.y,
            position.z
          );
          this.dummy.rotation.set(
            rotation.x,
            rotation.y,
            rotation.z
          );
          this.dummy.updateMatrix();
          for(const instancedMesh of this.instancedMeshes) {
            instancedMesh.setMatrixAt(i++, this.dummy.matrix);
          }
        }
      });

      this.group.add(this.rotatingGroup);
      this.group.rotation.z = Math.PI * 0.15;
    },
    update: function(time) {
    }
  }
}

export { createAnimatedVirus };
