import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const createAsymmetricLinedIcoDNA = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const loader = new GLTFLoader();

      loader.load('/models/poled_dna_decoupled_points_2.glb', object => {
        try {
          object.scene.traverse(child => {
            console.log(child);
            if(child.children) {
              for(const grandchild of child.children) {
                grandchild.material = new THREE.MeshLambertMaterial({
                  color: '#979797',
                  emissive: '#585858'
                });
                this.rotatingGroup.add(grandchild);
              }
            }
            if(child.isMesh) {
              if(child.name == 'Cylinder') {
                child.material = new THREE.MeshLambertMaterial({
                  color: '#979797',
                  emissive: '#585858'
                });
              }
              else {
                child.material = new THREE.MeshLambertMaterial({
                  color: '#25d1db',
                  emissive: '#585858'
                });
              }
              this.rotatingGroup.add(child);
            }
          });
        }
        catch(error) {}
      });

      this.group.add(this.rotatingGroup);
      this.group.rotation.z = Math.PI * 0.15;
    },
    update: function(time) {
      this.rotatingGroup.rotation.x = time * 0.001;
    }
  }
}

export { createAsymmetricLinedIcoDNA };
