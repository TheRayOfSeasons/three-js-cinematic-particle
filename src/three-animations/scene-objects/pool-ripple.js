import * as THREE from 'three';

const clamp = (value, min, max) => {
  if(value < min)
    return min;
  else if(value > max)
    return max;
  return value;
}

const createPoolRipple = ({ camera }) => {
  return {
    camera,
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    parameters: {
      debug: false,
    },
    init: function() {
      this.geometry = new THREE.PlaneBufferGeometry(18, 18, 256, 256);
      this.material = new THREE.MeshPhongMaterial({
        color: '#ff0055',
        emissive: '#919191',
        shininess: 100,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(this.geometry, this.material);
      this.group.add(mesh);

      this.mousePosition = new THREE.Vector2();
      this.raycaster = new THREE.Raycaster();
      this.raycastPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      this.intersectPoint = new THREE.Vector3();
      window.addEventListener('mousemove', event => {
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
      });

      if(this.parameters.debug) {
        this.box = new THREE.Mesh(
          new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
          new THREE.MeshNormalMaterial()
        );
        this.group.add(this.box);
        this.group.add(new THREE.PlaneHelper(this.raycastPlane, 0xffff00));
      }

      this.otherPoints = [
        new THREE.Vector3(-2, 0, 0),
        new THREE.Vector3(2, 3, 0),
      ];

      this.position = new THREE.Vector3();
    },
    getElevation: function(elapsedTime, distance) {
      const amplitude = 5.0;
      const cycleLength = 0.1;
      const decay = clamp(amplitude - distance, 0, amplitude);
      // const offset = 1.0 / distance;
      // return (-amplitude) * Math.exp(decay * -(elapsedTime + distance)) * Math.cos(cycleLength * (elapsedTime + distance));
      return Math.cos((-elapsedTime + distance) * amplitude) * cycleLength;
    },
    update: function(time) {
      const elapsedTime = this.clock.getElapsedTime();
      this.raycaster.ray.intersectPlane(this.raycastPlane, this.intersectPoint);

      for(let i = 0; i < this.geometry.attributes.position.array.length; i++) {
        const i3 = i * 3;
        const xIndex = i3;
        const yIndex = i3 + 1;
        const zIndex = i3 + 2;

        const x = this.geometry.attributes.position.array[xIndex];
        const y = this.geometry.attributes.position.array[yIndex];
        const z = this.geometry.attributes.position.array[zIndex];

        this.position.set(x, y, z);
        const distance = this.position.distanceTo(this.intersectPoint);
        const elevation = this.getElevation(elapsedTime, distance);

        const otherRipples = this.otherPoints
          .reduce((accumulator, vector) => {
            const distance = this.position.distanceTo(vector);
            const elevation = this.getElevation(elapsedTime, distance);
            return accumulator + elevation;
          }, 0);

        this.geometry.attributes.position.array[zIndex] = elevation + otherRipples;
      }
      this.geometry.attributes.position.needsUpdate = true;

      if(this.parameters.debug) {
        this.box.position.set(this.intersectPoint.x, this.intersectPoint.y, this.intersectPoint.z);
      }
    }
  }
}

export { createPoolRipple };
