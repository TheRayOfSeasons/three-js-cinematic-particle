import * as THREE from 'three';
import * as CANNON from 'cannon';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function clampCall(callback, min, max) {
  let value = 0;
  let maxLoops = 100;
  let loops = 0;
  do {
    if(loops > maxLoops)
      break;
    value = callback();
    loops++;
  } while(value < min || value > max);
  return value;
}

function createUniqueVectorCalculator(threshold) {
  const maxLoop = 100;
  const vectors = [];
  const _threshold = threshold;

  return vectorProducer => {
    let iteration = 0;
    let vector = vectorProducer(iteration);
    let valid = false;
    while(!valid) {
      if(iteration > maxLoop) {
        break;
      }
      valid = vectors
        .every(otherVector => vector.distanceTo(otherVector) > _threshold || vectors.length == 0);
      if(!valid) {
        vector = vectorProducer(iteration);
      }
      iteration++;
    }
    vectors.push(vector);
    return vector;
  }
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
    update: function() {}
  }
}

const createCentralCapsules = props => {
  const extractParameters = (_props) => ({
    count: _props?.count || 1000,
    countPerPoint: _props?.countPerPoint || 1,
    radius: _props?.radius || 1,
    spreadRadius: _props?.spreadRadius || 1,
    spreadLength: _props?.spreadLength || 50
  });
  const parameters = extractParameters(props);

  const geometry = new THREE.SphereBufferGeometry(parameters.radius, 32, 32);
  const material = new THREE.MeshNormalMaterial();
  const instancedMesh = new THREE.InstancedMesh(geometry, material, parameters.count);
  instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const dummy = new THREE.Object3D();
  const metadata = [];
  for(let i = 0; i < parameters.count; i++) {
    const x = 20 * (Math.random() - 0.5);
    const y = (2 * (Math.random() - 0.5)) + 2;
    const z = 20 * (Math.random() - 0.5);
    dummy.position.set(x, y, z);
    const shape = new CANNON.Sphere(parameters.radius);
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
    extractParameters,
    instancedMesh,
    metadata,
    dummy,
    addRigidBodies: function(world, props) {
      const parameters = this.extractParameters(props);
      for(let i = 0; i < parameters.count; i++) {
        world.addBody(this.metadata[i].rigidBody);
      }
    },
    update: function(props) {
      const parameters = this.extractParameters(props);
      for(let i = 0; i < parameters.count; i++) {
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

export const createColldingCapsules = ({ camera, world }) => {
  return {
    camera,
    world,
    group: new THREE.Group(),
    parameters: {
      centralCapsule: {
        radius: 0.875,
        mass: 1,
        idleRotationSpeed: 0.01,
        count: 20,
        countPerPoint: 1,
        spreadRadius: 5,
        spreadLength: 30
      }
    },
    init: function() {
      this.capsules = createCentralCapsules(this.parameters.centralCapsule);
      this.capsules.addRigidBodies(this.world, this.parameters.centralCapsule);
      this.group.add(this.capsules.instancedMesh);

      this.physicalObjects = [
        createGround(),
      ];

      for(const object of this.physicalObjects) {
        this.world.addBody(object.rigidBody);
        this.group.add(object.mesh);
      }
    },
    update: function(time) {
      for(const object of this.physicalObjects) {
        object.update();
      }
      this.capsules.update(this.parameters.centralCapsule);
    },
  }
}
