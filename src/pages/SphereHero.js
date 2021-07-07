import * as THREE from 'three';
import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const LAYERS = {
  ENTIRE_SCENE: 0,
  BLOOM_SCENE: 1,
}

const materials = {};

function getCenter(vectors) {
  let totalX = 0.0;
  let totalY = 0.0;
  let totalZ = 0.0;
  for(const vector of vectors) {
    totalX += vector.x;
    totalY += vector.y;
    totalZ += vector.z;
  }
  return new THREE.Vector3(
    totalX / vectors.length,
    totalY / vectors.length,
    totalZ / vectors.length,
  );
}

function normalizePoints(vectors) {
  const center = getCenter(vectors);
  const newVectors = [];
  for(const vector of vectors) {
    let newX = center.x < vector.x ? Math.abs(center.x - vector.x) : vector.x - center.x;
    let newY = center.y < vector.y ? Math.abs(center.y - vector.y) : vector.y - center.y;
    let newZ = center.z < vector.z ? Math.abs(center.z - vector.z) : vector.z - center.z;
    newVectors.push(new THREE.Vector3(newX, newY, newZ));
  }
  return newVectors;
}


const createSpherePoint = ({ renderTriangles=false }) => {
  return {
    group: new THREE.Group(),
    rotatingGroup: new THREE.Group(),
    target: new THREE.Vector3(-500, 0, 0),
    pointsGeometry: new THREE.SphereBufferGeometry(250, 12, 8),
    lineGeometry: new THREE.SphereBufferGeometry(250, 12, 8),
    diffuseGeometry: new THREE.SphereBufferGeometry(250, 12, 8),
    innerSphereGeometry: new THREE.SphereBufferGeometry(100, 24, 16),
    hasTriangles: renderTriangles,
    transferTarget: undefined,
    clearedForTranfer: 0,
    interval: 5,
    getTransferTarget: function() {
      return this.transferTarget || this;
    },
    transferTriangles: function(target) {
      this.transferTarget = target;
      this.clearedForTranfer = 0;
    },
    init: function(camera) {
      setInterval(() => {
        this.clearedForTranfer += 1;
      }, this.interval);

      const innerPointsMaterial = new THREE.PointsMaterial({
        size: 3,
        sizeAttenuation: true,
        color: 0xffffff,
        blending: THREE.AdditiveBlending
      })
      this.innerSphere = new THREE.Points(this.innerSphereGeometry, innerPointsMaterial);
      this.group.add(this.innerSphere);

      this.rotatingGroup.layers.enable(LAYERS.ENTIRE_SCENE);

      const lightGeometry = new THREE.SphereBufferGeometry(50, 24, 16);
      const lightMaterial = new THREE.MeshBasicMaterial({
        color: '#24536d',
      });
      const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
      this.group.add(lightMesh);
      lightMesh.layers.enable(LAYERS.BLOOM_SCENE);

      this.group.add(this.rotatingGroup);
      // this.group.rotation.z = -Math.PI * 0.15;

      const getValueFromIndex = index => {
        const adjustedIndex = index * 3;
        return new THREE.Vector3(
          this.pointsGeometry.attributes.position.array[adjustedIndex],
          this.pointsGeometry.attributes.position.array[adjustedIndex + 1],
          this.pointsGeometry.attributes.position.array[adjustedIndex + 2]
        );
      }

      this.movingTriangles = [];
      this.trianglePositions = [];
      const indices = this.pointsGeometry.getIndex().array;
      for(let i = 0; i < indices.length; i += 3) {
        let pointIndex1 = indices[i];
        let pointIndex2 = indices[i + 1];
        let pointIndex3 = indices[i + 2];

        const points = [
          getValueFromIndex(pointIndex1),
          getValueFromIndex(pointIndex2),
          getValueFromIndex(pointIndex3),
        ];
        
        const trianglePositionHolder = new THREE.Object3D();
        const trianglePosition = getCenter(points);
        trianglePositionHolder.position.x = trianglePosition.x;
        trianglePositionHolder.position.y = trianglePosition.y;
        trianglePositionHolder.position.z = trianglePosition.z;
        this.trianglePositions.push(trianglePositionHolder);
        this.rotatingGroup.add(trianglePositionHolder);
        // trianglePositionHolder.add(new THREE.AxesHelper(10));

        if(!renderTriangles)
          continue;

        const triangleGroup = new THREE.Group();

        const triGeometry = new THREE.BufferGeometry().setFromPoints(normalizePoints(points));
        const triMaterial = new THREE.MeshBasicMaterial({ color: 0x747474, wireframe: true });
        const mesh = new THREE.LineSegments(triGeometry, triMaterial);
        triangleGroup.add(mesh);

        const pointsMat = new THREE.PointsMaterial({
          size: 5,
          sizeAttenuation: true,
          color: 0xffffff,
          blending: THREE.AdditiveBlending
        });
        const meshPoints = new THREE.Points(triGeometry, pointsMat);
        triangleGroup.add(meshPoints);
        triangleGroup.position.set(trianglePosition.x, trianglePosition.y, trianglePosition.z);
        this.group.add(triangleGroup);
        this.movingTriangles.push(triangleGroup);
      }
      this.create = false;
    },
    update: function(time, camera) {
      this.rotatingGroup.rotation.y = time * 0.0001;
      this.innerSphere.rotation.y = -time * 0.001;

      // const transferTarget = this.getTransferTarget();
      // if(transferTarget) {
      //   for(let i = 0; i < this.movingTriangles.length; i++) {
      //     const triangle = this.movingTriangles[i];
      //     // triangle.rotation.z = time * 0.01;
      //     const positionHolder = transferTarget.trianglePositions[i];

      //     // const originVector = new Vector3();
      //     const targetVector = new Vector3();
      //     // triangle.getWorldPosition(originVector);
      //     positionHolder.getWorldPosition(targetVector);
      //     // triangle.position.lerp(targetVector, 0.15);
      //     // triangle.lookAt(transferTarget.group.position);
      //     // triangle.position.set(
      //     //   targetVector.x,
      //     //   targetVector.y,
      //     //   targetVector.z
      //     // )

      //     // if(i >= this.clearedForTranfer) {
      //     //   break;
      //     // }
      //   }
      // }

        // console.log(transferTarget.trianglePositions);
        // console.log(this.movingTriangles);
        // for(let i = 0; i < this.movingTriangles.length; i++) {
        //   const triangle = this.movingTriangles[i];
        //   const positionHolder = transferTarget.trianglePositions[i];
        //   if(i == 0) {
        //     console.log('position:', positionHolder.position);
        //   }
        //   triangle.position.lerp(positionHolder.position, 0.25);
        // }
    }
  };
}

export { createSpherePoint, LAYERS, materials }
