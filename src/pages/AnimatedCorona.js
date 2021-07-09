import * as THREE from 'three';
import { Vector3 } from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';

function SphereToQuads(g) {
  let p = g.parameters;
  let segmentsX = p.widthSegments;
  let segmentsY = p.heightSegments-2;
  let mainShift = segmentsX + 1;
  let indices = [];
  for (let i = 0; i < segmentsY + 1; i++) {
    let index11 = 0;
    let index12 = 0;
    for (let j = 0; j < segmentsX; j++) {
      index11 = (segmentsX + 1) * i + j;
      index12 = index11 + 1;
      let index21 = index11;
      let index22 = index11 + (segmentsX + 1);
      indices.push(index11 + mainShift, index12 + mainShift);
      if (index22 < ((segmentsX + 1) * (segmentsY + 1) - 1)) {
        indices.push(index21 + mainShift, index22 + mainShift);
      }
    }
    if ((index12 + segmentsX + 1) <= ((segmentsX + 1) * (segmentsY + 1) - 1)) {
      indices.push(index12 + mainShift, index12 + segmentsX + 1 + mainShift);
    }
  }

  let lastIdx = indices[indices.length - 1] + 2;

  // poles
  for(let i = 0; i < segmentsX; i++){
  	//top
    indices.push(i, i + mainShift, i, i + mainShift + 1);

    // bottom
    let idx = lastIdx + i;
    let backShift = mainShift + 1;
    indices.push(idx, idx - backShift, idx, idx - backShift + 1);
  }

  g.setIndex(indices);
}

const createAnimatedCorona = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const positions = [
        new THREE.Vector3(0, 0, 0),
        // new THREE.Vector3(0.5, 1, 0),
        // new THREE.Vector3(-0.5, 0.2, 0),
        // new THREE.Vector3(-0.5, 0.7, 0),
        // new THREE.Vector3(-0.5, -0.9, 0),
        // new THREE.Vector3(-0.5, -0.9, 0),
      ]

      const pointCloudGeometries = [];
      for(const position of positions) {
        const dotGeometry = new THREE.SphereBufferGeometry(1, 64, 64);
        dotGeometry.translate(position.x, position.y, position.z);
        pointCloudGeometries.push(dotGeometry);
      }

      this.bodyGeometry = BufferGeometryUtils.mergeBufferGeometries(pointCloudGeometries);
      const bodyMaterial = new THREE.PointsMaterial({ color: '#d4d4d4', size: 0.025 });
      const bodyMesh = new THREE.Points(this.bodyGeometry, bodyMaterial);
      this.rotatingGroup.add(bodyMesh);


      this.group.add(this.rotatingGroup);
    },
    update: function(time) {
      // this.rotatingGroup.rotation.y = time * 0.001;
      const elapsedTime = this.clock.getElapsedTime();
      for(let i = 0; i < this.bodyGeometry.attributes.position.array.length; i++) {
        let i3 = i * 3;
        let x = i3;
        let y = i3 + 1;
        let z = i3 + 2;
        const xValue = this.bodyGeometry.attributes.position.array[x];
        const yValue = this.bodyGeometry.attributes.position.array[y];
        const zValue = this.bodyGeometry.attributes.position.array[z];
        this.bodyGeometry.attributes.position.array[y] = Math.sin(elapsedTime + xValue);
      }
      this.bodyGeometry.attributes.position.needsUpdate = true;
    }
  }
}

export { createAnimatedCorona };
