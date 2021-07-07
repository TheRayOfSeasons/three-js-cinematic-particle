import * as THREE from 'three';

const createTrianglePath = (origin, target) => {
  return {
    origin,
    target,
    distance: origin.distanceTo(target),
    group: new THREE.Group(),
    init: function() {
      const interval = 0.1;
      const size = 50;
      this.triangles = [];
      for(let i = interval; i < 1.0; i += interval) {
        const localOrigin = new THREE.Vector3();
        localOrigin.copy(this.origin)
        const position = localOrigin.lerp(this.target, i);
        const points = [
          new THREE.Vector3(-size, -size, 0),
          new THREE.Vector3(0, size, 0),
          new THREE.Vector3(size, -size, 0),
        ];
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.MeshBasicMaterial({ color: 0x747474, wireframe: true });
        const mesh = new THREE.LineSegments(geometry, material);

        const pointsMat = new THREE.PointsMaterial({
          size: 5,
          sizeAttenuation: true,
          color: 0xffffff,
          blending: THREE.AdditiveBlending
        });
        const meshPoints = new THREE.Points(geometry, pointsMat);

        const meshGroup = new THREE.Group();
        meshGroup.add(mesh);
        meshGroup.add(meshPoints);
        this.triangles.push(meshGroup);
        meshGroup.position.set(position.x, position.y, position.z);

        meshGroup.offset = i * 2;

        this.group.add(meshGroup);
      }
    },
    update: function(time) {
      for(const triangle of this.triangles) {
        triangle.rotation.y = (time * 0.001) + triangle.offset;
        triangle.rotation.z = (time * 0.001) + triangle.offset;

        const distanceFromOrigin = triangle.position.distanceTo(this.origin);
        const distanceFromTarget = triangle.position.distanceTo(this.target);
        const scaleAdherence = distanceFromOrigin < distanceFromTarget ? distanceFromTarget : distanceFromOrigin;
        const scale = 1 / (scaleAdherence / (this.distance / 2));
        triangle.scale.set(scale, scale, scale);

        triangle.position.lerp(this.target, Math.atan2(5, distanceFromTarget));
        const newDistanceFromTarget = triangle.position.distanceTo(this.target);
        if(newDistanceFromTarget < 150.0) {
          triangle.position.set(this.origin.x, this.origin.y, this.origin.z);
        }
      }
    }
  }
}

export { createTrianglePath };
