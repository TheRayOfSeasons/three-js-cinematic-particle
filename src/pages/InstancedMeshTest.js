import * as THREE from 'three';
import { Mesh } from 'three';
import { materials } from './SphereHero';

const createInstancedTest = (scene, camera) => {
  return {
    scene,
    camera,
    parameters: {
      count: 200,
    },
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      this.matrix = new THREE.Matrix4();
      this.position = new THREE.Vector3();

      const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
      geometry.computeVertexNormals();
      const material = new THREE.MeshNormalMaterial();
      this.instancedMesh = new THREE.InstancedMesh(geometry, material, 8000);
      this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.scene.add(this.instancedMesh);

      this.dummy = new THREE.Object3D();
      let i = 0;
      const offset = (this.parameters.countamount - 1) / 2;
      for ( let x = 0; x < this.parameters.count; x ++ ) {
        for ( let y = 0; y < this.parameters.count; y ++ ) {
          for ( let z = 0; z < this.parameters.count; z ++ ) {
            this.dummy.position.set( offset - x, offset - y, offset - z );
            this.dummy.updateMatrix();
            this.instancedMesh.setMatrixAt( i ++, this.dummy.matrix );
          }
        }
      }


      this.group.add(this.rotatingGroup);
      this.group.rotation.z = Math.PI * 0.15;
    },
    update: function(time) {
      if(this.instancedMesh) {
        // this.instancedMesh.getMatrixAt(0, this.matrix);
        // this.position.x += 0.01;
        // this.matrix.setPosition(this.position);
        this.instancedMesh.setMatrixAt(0, this.matrix);
        this.instancedMesh.instanceMatrix.needsUpdate = true;
      }
    }
  }
}

export { createInstancedTest };
