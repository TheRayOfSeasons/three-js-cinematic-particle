import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const createAnimatedNeuron = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const loader = new GLTFLoader();

      this.meshes = [];
      loader.load('/models/neuron-modded-highpoly.glb', object => {
        object.scene.traverse(child => {
          if(child.isMesh) {
            this.meshes.push(child);
            this.rotatingGroup.add(child);
          }
        });
      });
      
      this.group.add(this.rotatingGroup);
    },
    update: function(time) {
    }
  }
}

export { createAnimatedNeuron };
