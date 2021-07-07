import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const createRunningMan = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      const loader = new FBXLoader();
      loader.load('/models/RunningYBot.fbx', object => {
        this.animationMixer = new THREE.AnimationMixer(object);

        const action = this.animationMixer.clipAction(object.animations[0]);
        action.play();

        object.traverse(child => {
          if(child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            console.log(child);
          }
          if(child.material) {
            child.material = new THREE.MeshPhongMaterial({ color: 0x00b7cf });
          }
        });
        this.group.add(object);
      });
    },
    update: function(time) {
      const delta = this.clock.getDelta();
      if (this.animationMixer) {
        this.animationMixer.update(delta);
      }
    }
  }
}

export { createRunningMan };
