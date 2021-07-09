import * as THREE from 'three';

const createAnimatedSpline = () => {
  return {
    parameters: {
      speed: 0.70
    },
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      const pathGroup = new THREE.Group();
      const movingGroup = new THREE.Group();

      // const rawPoints = [
      //   new THREE.Vector3(-4, 0, 0),
      //   new THREE.Vector3(-3, 2, 0),
      //   new THREE.Vector3(0, 5, 0),
      //   new THREE.Vector3(3, -2, 0),
      // ];

      const rawPoints = [
        new THREE.Vector3(-4, 0, 0),
        new THREE.Vector3(-3, 2, 0),
        new THREE.Vector3(0, 5, 0),
        new THREE.Vector3(3, -2, 5),
      ];

      this.spline1 = new THREE.CatmullRomCurve3(rawPoints);

      const points = this.spline1.getPoints(50);

      // debug
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color : 0xff0000 });
      const splineObject = new THREE.Line(geometry, material);
      pathGroup.add(splineObject);

      const sphereGeometry = new THREE.SphereBufferGeometry(1, 16, 16);
      const sphereMaterial = new THREE.MeshPhongMaterial({ color: 0x00fff0 });
      this.sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
      this.sphereLocalGroup = new THREE.Group();
      this.sphereLocalGroup.add(this.sphereMesh);
      movingGroup.add(this.sphereLocalGroup);

      this.posIndex = 0;

      this.group.add(pathGroup);
      this.group.add(movingGroup);
    },
    update: function(time) {
      this.posIndex += this.parameters.speed;
      if(this.posIndex > 100) {
        this.posIndex = 0;
      }
      const newPos = this.spline1.getPoint(this.posIndex / 100);
      const newRot = this.spline1.getTangent(this.posIndex / 100);

      this.sphereLocalGroup.position.x = newPos.x;
      this.sphereLocalGroup.position.y = newPos.y;
      this.sphereLocalGroup.position.z = newPos.z;

      this.sphereLocalGroup.rotation.x = newRot.x;
      this.sphereLocalGroup.rotation.y = newRot.y;
      this.sphereLocalGroup.rotation.z = newRot.z;

      this.sphereMesh.position.y = Math.sin(this.clock.getElapsedTime()) * 2;
    }
  }
}

export { createAnimatedSpline }
