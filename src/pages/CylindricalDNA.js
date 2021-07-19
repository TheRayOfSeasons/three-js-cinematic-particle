import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const createCylindricalDNA = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const loader = new GLTFLoader();

      loader.load('/models/cylindrical_dna_3.glb', object => {
        object.scene.traverse(child => {
          if(child.isMesh) {
            child.material = new THREE.MeshLambertMaterial({
              color: '#979797',
              emissive: '#585858'
            });
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

export { createCylindricalDNA };
