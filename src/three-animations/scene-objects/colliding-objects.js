import * as THREE from 'three';
import * as CANNON from 'cannon';

const createBox = ({ position }) => {
  const geometry = new THREE.BoxBufferGeometry(2, 2, 2);
  const material = new THREE.MeshNormalMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  const shape = new CANNON.Box(new CANNON.Vec3(1, 1, 1));
  const rigidBody = new CANNON.Body({ mass: 1 });
  rigidBody.addShape(shape);
  mesh.position.set(position?.x || 0, position?.y || 0, position?.z || 0)
  rigidBody.position.x = mesh.position.x;
  rigidBody.position.y = mesh.position.y;
  rigidBody.position.z = mesh.position.z;
  mesh.quaternion.x = rigidBody.quaternion.x;
  mesh.quaternion.y = rigidBody.quaternion.y;
  mesh.quaternion.z = rigidBody.quaternion.z;
  mesh.quaternion.w = rigidBody.quaternion.w;
  return {
    mesh,
    rigidBody,
    update: function() {
      this.mesh.position.x = this.rigidBody.position.x;
      this.mesh.position.y = this.rigidBody.position.y;
      this.mesh.position.z = this.rigidBody.position.z;

      this.mesh.quaternion.x = this.rigidBody.quaternion.x;
      this.mesh.quaternion.y = this.rigidBody.quaternion.y;
      this.mesh.quaternion.z = this.rigidBody.quaternion.z;
      this.mesh.quaternion.w = this.rigidBody.quaternion.w;
    }
  };
}

const createSphere = ({ position }) => {
  const geometry = new THREE.SphereBufferGeometry(1, 32, 32);
  const material = new THREE.MeshNormalMaterial();
  const mesh = new THREE.Mesh(geometry, material);
  const shape = new CANNON.Sphere(1);
  const rigidBody = new CANNON.Body({ mass: 1 });
  rigidBody.addShape(shape);
  mesh.position.set(position?.x || 0, position?.y || 0, position?.z || 0)
  rigidBody.position.x = mesh.position.x;
  rigidBody.position.y = mesh.position.y;
  rigidBody.position.z = mesh.position.z;
  mesh.quaternion.x = rigidBody.quaternion.x;
  mesh.quaternion.y = rigidBody.quaternion.y;
  mesh.quaternion.z = rigidBody.quaternion.z;
  mesh.quaternion.w = rigidBody.quaternion.w;
  return {
    mesh,
    rigidBody,
    update: function() {
      this.mesh.position.x = this.rigidBody.position.x;
      this.mesh.position.y = this.rigidBody.position.y;
      this.mesh.position.z = this.rigidBody.position.z;

      this.mesh.quaternion.x = this.rigidBody.quaternion.x;
      this.mesh.quaternion.y = this.rigidBody.quaternion.y;
      this.mesh.quaternion.z = this.rigidBody.quaternion.z;
      this.mesh.quaternion.w = this.rigidBody.quaternion.w;
    }
  };
}

const createCollidingObjects = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    parameters: {

    },
    init: function() {
      this.world = new CANNON.World();
      this.world.gravity.set(0, -9.82, 0);

      this.objects = [
        createBox({}),
        createBox({ position: { x: -1, y: 3, z: -0.5 } }),
        createBox({ position: { x: 0.8, y: 5.5, z: 0.75 } }),
        createSphere({ position: { x: 0, y: 9, z: -0.2}})
      ];
      for(const object of this.objects) {
        this.world.addBody(object.rigidBody);
        this.group.add(object.mesh);
      }

      const groundGeometry = new THREE.PlaneBufferGeometry(25, 25, 32, 32);
      groundGeometry.rotateX(-Math.PI * 0.5);
      const groundMaterial = new THREE.MeshStandardMaterial({ wireframe: true, color: '#e7e7e7' });
      this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
      const groundShape = new CANNON.Plane();
      this.groundRigidBody = new CANNON.Body({ mass: 0 });
      this.groundRigidBody.addShape(groundShape);
      this.groundRigidBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI * 0.5);
      this.ground.position.y = -8;
      this.groundRigidBody.position.y = this.ground.position.y;
      this.world.addBody(this.groundRigidBody);
      this.group.add(this.ground);

    },
    update: function(time) {
      const delta = this.clock.getDelta();
      this.world.step(delta);

      for(const object of this.objects) {
        object.update();
      }
    }
  }
}

export { createCollidingObjects };
