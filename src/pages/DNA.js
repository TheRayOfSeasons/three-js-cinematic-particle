import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mesh } from 'three';

const createAnimatedDNA = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const loader = new GLTFLoader();

      loader.load('/models/dna.glb', object => {
        object.scene.traverse(child => {
          if(child.isMesh) {
            child.material = new THREE.MeshPhongMaterial({ color: '#1a0e5c' });
            this.rotatingGroup.add(child);
          }
        });
      });

      this.group.add(this.rotatingGroup);
      this.group.rotation.z = Math.PI * 0.15;
    },
    update: function(time) {
      this.rotatingGroup.rotation.x = time * 0.001;
    }
  }
}

export { createAnimatedDNA  };
