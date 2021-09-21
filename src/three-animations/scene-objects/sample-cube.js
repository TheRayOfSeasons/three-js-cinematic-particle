import * as THREE from 'three';

export const SampleCubePiece = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      // const sphereGeometry = new THREE.SphereBufferGeometry(1, 16, 16);
    },
    update: function(time) {

    }
  }
}
