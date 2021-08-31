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
    update: function() {
    }
  }
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

const createInstancedSpheres = ({ count=200 }) => {
  const radius = 2;
  const geometry = new THREE.SphereBufferGeometry(radius, 32, 32);
  const material = new THREE.MeshNormalMaterial();
  const instancedMesh = new THREE.InstancedMesh(geometry, material, count);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const dummy = new THREE.Object3D();
  const metadata = [];
  for(let i = 0; i < count; i++) {
    const x = 20 * (Math.random() - 0.5);
    const y = (2 * (Math.random() - 0.5)) + 2;
    const z = 20 * (Math.random() - 0.5);
    dummy.position.set(x, y, z);
    const shape = new CANNON.Sphere(radius);
    const rigidBody = new CANNON.Body({ mass: 1 });
    rigidBody.addShape(shape);
    rigidBody.position.x = x;
    rigidBody.position.y = y;
    rigidBody.position.z = z;
    dummy.quaternion.set(
      rigidBody.quaternion.x,
      rigidBody.quaternion.y,
      rigidBody.quaternion.z,
      rigidBody.quaternion.w,
    )
    dummy.updateMatrix();
    instancedMesh.setMatrixAt(i, dummy.matrix);
    metadata.push({
      shape,
      rigidBody
    });
  }
  return {
    instancedMesh,
    metadata,
    count,
    dummy,
    addRigidBodies: function(world) {
      console.log('adding to world');
      for(let i = 0; i < this.count; i++) {
        world.addBody(this.metadata[i].rigidBody);
      }
    },
    update: function() {
      for(let i = 0; i < this.count; i++) {
        this.dummy.position.set(
          this.metadata[i].rigidBody.position.x,
          this.metadata[i].rigidBody.position.y,
          this.metadata[i].rigidBody.position.z
        );
        this.dummy.quaternion.set(
          this.metadata[i].rigidBody.quaternion.x,
          this.metadata[i].rigidBody.quaternion.y,
          this.metadata[i].rigidBody.quaternion.z,
          this.metadata[i].rigidBody.quaternion.w
        );
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i, this.dummy.matrix);
        this.instancedMesh.instanceMatrix.needsUpdate = true;
      }
    }
  }
}

export const createInstancedCollidingObjects = ({ world }) => {
  return {
    world,
    group: new THREE.Group(),
    init: function() {
      this.instancedSpheres = createInstancedSpheres({ count: 2 });
      this.instancedSpheres.addRigidBodies(this.world);
      this.group.add(this.instancedSpheres.instancedMesh);
      this.objects = [
        createBox({}),
        createBox({ position: { x: -1, y: 3, z: -0.5 } }),
        createBox({ position: { x: 0.8, y: 5.5, z: 0.75 } }),
        createSphere({ position: { x: 0, y: 9, z: -0.2}}),
        createGround()
      ];
      for(const object of this.objects) {
        this.world.addBody(object.rigidBody);
        this.group.add(object.mesh);
      }
    },
    update: function(time) {
      this.instancedSpheres.update();
      for(const object of this.objects) {
        object.update();
      }
    }
  }
}
