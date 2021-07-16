import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

function setAsymmetricInterval(callback, durations) {
  const _callback = callback;
  const _durations = [...durations];
  let index = -1;
  let counter = 0;

  const getNextDuration = () => {
    if(index < _durations.length - 1) {
      index++;
    }
    else {
      index = 0;
    }
    return _durations[index];
  }

  const timedCallback = () => {
    const result = _callback(++counter);
    let duration;
    switch(typeof(result)) {
      case 'number':
        duration = result;
        break;
      default:
        duration = getNextDuration();
        break;
    }
    setTimeout(() => timedCallback(), duration);
  }
  timedCallback();
}

function randomOnSphereEven(radius, PhiNum, thetaNum) {
  let points = [];
  const phiSpan = Math.PI / (PhiNum+1);
  const thetaSpan = Math.PI * 2 / thetaNum;
  const spherical = new THREE.Spherical(radius);
  // create random spherical coordinate
  for (let i = 1; i < PhiNum+1; i++) {
    let phi = phiSpan * i;
    for (let j = 0; j < thetaNum; j++) {
      let theta = thetaSpan * j;
      spherical.set(radius, phi, theta);
      let point = new THREE.Vector3();
      point.setFromSpherical(spherical)
      points.push(point);
    }
  }
  return points;
}

const getSphericalCoordinates = ({ count=1, radius }) => {
  const vectors = [];
  // for(let i = 0; i < count; i++) {
  //   let phi = (Math.PI * 2) * Math.random();
  //   let theta = 2.0 * Math.asin(Math.sqrt(Math.random()));
  //   let x = radius * Math.sin(theta);
  //   let y = x * Math.sin(phi);
  //   x *= x * Math.cos(phi);
  //   let z = radius * Math.cos(theta);
  //   vectors.push(new THREE.Vector3(x, y, z));
  // }
  const phi = Math.PI * (3.0 - Math.sqrt(5.0)); // golden angle in radians
  for(let i = 0; i < count; i++) {
    let y = 1 - (i / (count - 1)) * 2; // normalize
    let radius = Math.sqrt(1 - y * y);
    let theta = phi * i;
    let x = Math.cos(theta) * radius;
    let z = Math.sin(theta) * radius;
    vectors.push(new THREE.Vector3(x, y, z));
  }
  return vectors;
}

function translateCoordinatesToVector(lat, lon, radius) {
  let latRad = lat * (Math.PI / 180);
  let lonRad = -lon * (Math.PI / 180);
  return new THREE.Vector3(
    Math.cos(latRad) * Math.cos(lonRad) * radius,
    Math.sin(latRad) * radius,
    Math.cos(latRad) * Math.sin(lonRad) * radius
  );
}

const createAdvancedAnimatedImportedCellSpread = (scene, camera) => {
  return {
    scene,
    camera,
    parameters: {
      count: 300,
      maxCount: 1000,
      groupsAtATime: 1,
      distance: {
        max: 300,
        min: 100
      }
    },
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function () {
      this.rotatingGroup = new THREE.Group();

      const loader = new GLTFLoader();
      this.instancedMeshes = [];
      this.dummy = new THREE.Object3D();
      loader.load('/models/cell2.glb', object => {
        const children = [];
        try {
          object.scene.traverse(child => {
            if (child.isMesh) {
              children.push(child);
            }
          });
        }
        catch (error) {
          return;
        }

        for(const child of children) {
          const geometry = child.geometry;
          const material = child.material;
          material.transparent = true;
          material.opacity = 0.99;
          material.blending = THREE.AdditiveBlending;
          const instancedMesh = new THREE.InstancedMesh(geometry, material, this.parameters.maxCount);
          instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
          this.group.add(instancedMesh);
          this.instancedMeshes.push(instancedMesh);
        }

        let i = 0;
        const positions = randomOnSphereEven(30, 32, 31);
        console.log(positions.length);
        for(let x = 0; x < this.parameters.maxCount; x++) {
          // this.dummy.position.set(
          //   200 * (0.5 - Math.random()),
          //   200 * (0.5 - Math.random()),
          //   100 * (0.5 - Math.random())
          // );
          if(!positions[i]) {
            continue;
          }
          this.dummy.position.set(
            positions[i].x,
            positions[i].y,
            positions[i].z
          )
          this.dummy.updateMatrix();
          for(const instancedMesh of this.instancedMeshes) {
            instancedMesh.setMatrixAt(i++, this.dummy.matrix);
          }
        }
      });

      this.position = new THREE.Vector3();
    },
    update: function (time) {
      const elapsedTime = this.clock.getElapsedTime();

      if(this.instancedMeshes && this.dummy) {
        for(let i = 0; i < this.parameters.maxCount; i++) {
          for(const instancedMesh of this.instancedMeshes) {

            // movement
            // instancedMesh.getMatrixAt(i, this.dummy.matrix);
            // this.position.setFromMatrixPosition(this.dummy.matrix);
            // this.position.x += 0.2;
            // this.dummy.matrix.setPosition(this.position);

            // instancedMesh.setMatrixAt(i, this.dummy.matrix);
            // instancedMesh.instanceMatrix.needsUpdate = true;
          }
        }
      }
    }
  }
}

export { createAdvancedAnimatedImportedCellSpread };
