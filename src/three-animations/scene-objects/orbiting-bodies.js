import * as THREE from 'three';
import * as CANNON from 'cannon';

const createGround = () => {
  const geometry = new THREE.PlaneBufferGeometry(25, 25, 32, 32);
  geometry.rotateX(-Math.PI * 0.5);
  const material = new THREE.MeshStandardMaterial({ wireframe: true, color: '#e7e7e7' });
  const mesh = new THREE.Mesh(geometry, material);
  const shape = new CANNON.Plane();
  const rigidBody = new CANNON.Body({ mass: 0 });
  rigidBody.addShape(shape);
  rigidBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI * 0.5);
  mesh.position.y = -8;
  rigidBody.position.y = mesh.position.y;
  return {
    mesh,
    rigidBody,
    update: function() {}
  }
}

export const createOrbitingBodies = ({ world, camera }) => {
  return {
    camera,
    world,
    clock: new THREE.Clock(),
    group: new THREE.Group(),
    parameters: {
      orbitRadius: 5,
    },
    init: function() {
      const axisGeometry = new THREE.BoxBufferGeometry(1, 1, 1);
      const axisMaterial = new THREE.MeshNormalMaterial();
      this.axisMesh = new THREE.Mesh(axisGeometry, axisMaterial);
      this.group.add(this.axisMesh);

      const geometry = new THREE.SphereBufferGeometry(1, 32, 32);
      const material = new THREE.MeshNormalMaterial();
      this.mesh = new THREE.Mesh(geometry, material);
      this.shape = new CANNON.Sphere(2);
      this.rigidbody = new CANNON.Body({ mass: 1 });
      this.rigidbody.addShape(this.shape);
      this.world.addBody(this.rigidbody);
      this.group.add(this.mesh);

      this.ground = createGround();

      this.axis = new THREE.Vector3();
      this.axisDummyVector = new THREE.Vector3();
      this.bodyDummyVector = new THREE.Vector3();
      this.rigidBodyVector = new THREE.Vector3();
      // randomize spherical in actual
      this.rootSpherical = new THREE.Spherical(this.parameters.orbitRadius);
      this.rootPosition = new THREE.Vector3();
      this.spherical = new THREE.Spherical(this.parameters.orbitRadius);
      this.position = new THREE.Vector3();
      this.targetPosition = new THREE.Vector3();

      this.mesh.position.setFromSpherical(this.spherical);
      this.rigidbody.position.x = this.mesh.position.x;
      this.rigidbody.position.y = this.mesh.position.y;
      this.rigidbody.position.z = this.mesh.position.z;

      this.offsetDummy = new THREE.Object3D();
      this.offsetGroup = new THREE.Group();
      this.offsetSubGroup = new THREE.Group();
      this.offsetGroup.add(this.offsetDummy);
      this.offsetDummy.add(this.offsetSubGroup);

      this.subGroup = new THREE.Group();
      this.debugMeshes = [
        new THREE.Mesh(axisGeometry, new THREE.MeshStandardMaterial({ color: 0xff00f0 })),
        new THREE.Mesh(axisGeometry, new THREE.MeshStandardMaterial({ color: 0x00ff00 })),
        // new THREE.Mesh(axisGeometry, new THREE.MeshStandardMaterial({ color: 0x0000ff })),
        // new THREE.Mesh(axisGeometry, new THREE.MeshStandardMaterial({ color: 0x000fff })),
        // new THREE.Mesh(axisGeometry, new THREE.MeshStandardMaterial({ color: 0xffff00 })),
      ];
      for(const mesh of this.debugMeshes) {
        this.subGroup.add(mesh);
      }
      this.group.add(this.subGroup);

      this.debugMeshes[1].position.setFromSpherical(this.spherical);
      this.currentAngle = 0;
      this.angleLap = 0;
    },
    update: function(time) {
      this.ground.update();

      // move
      const speed = 4;
      this.rigidBodyVector.x = this.rigidbody.position.x;
      this.rigidBodyVector.y = this.rigidbody.position.y;
      this.rigidBodyVector.z = this.rigidbody.position.z;

      // acquire local spherical coordinates
      this.spherical.set(this.parameters.orbitRadius, 0, 0);
      this.position.setFromSpherical(this.spherical);
      this.spherical.phi += 0.1;
      this.targetPosition.setFromSpherical(this.spherical);

      const distanceFromRoot = this.position.distanceTo(this.rootPosition);
      

      this.debugMeshes[0].position.copy(this.targetPosition);

      const direction = this.targetPosition.sub(this.rigidBodyVector).normalize();
      const velocity = direction.multiplyScalar(speed);

      this.rigidbody.velocity.x = velocity.x;
      this.rigidbody.velocity.y = velocity.y;
      this.rigidbody.velocity.z = velocity.z;

      this.mesh.position.x = this.rigidbody.position.x;
      this.mesh.position.y = this.rigidbody.position.y;
      this.mesh.position.z = this.rigidbody.position.z;
    }
  }
}
