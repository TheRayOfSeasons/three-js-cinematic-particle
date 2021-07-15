import * as THREE from 'three';

const clamp = (value, min, max) => {
  if(value < min)
    return min;
  else if(value > max)
    return max;
  return value;
}

const createCameraPanner = ({ camera, panLimit, easing }) => {
  return {
    camera,
    parameters: {
      panLimit,
      easing
    },
    group: new THREE.Group(),
    init: function() {
      this.mousePosition = new THREE.Vector2();
      this.raycaster = new THREE.Raycaster();
      this.raycastPlane = new THREE.Plane(new THREE.Vector3(0, 1, 1.5), 0);
      this.intersectPoint = new THREE.Vector3();
      this.easingPosition = new THREE.Object3D();
      this.group.add(this.easingPosition);
      window.addEventListener('mousemove', event => {
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
      });
    },
    update: function(time) {
      this.raycaster.ray.intersectPlane(this.raycastPlane, this.intersectPoint);
      const newPosition = new THREE.Vector3(
        clamp(this.intersectPoint.x, -this.parameters.panLimit, this.parameters.panLimit),
        clamp(this.intersectPoint.y, -this.parameters.panLimit, this.parameters.panLimit),
        this.intersectPoint.z
      );
      this.easingPosition.position.lerp(newPosition, this.parameters.easing);
      this.camera.position.x = this.easingPosition.position.x;
      this.camera.position.y = this.easingPosition.position.y;
    }
  }
}

export { createCameraPanner };
