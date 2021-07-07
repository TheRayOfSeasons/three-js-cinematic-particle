import * as THREE from 'three';

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
    pointsGeometry: new THREE.SphereBufferGeometry(250, 24, 16),
    lineGeometry: new THREE.SphereBufferGeometry(250, 24, 16),
    diffuseGeometry: new THREE.SphereBufferGeometry(250, 24, 16),
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
      this.pointsGeometry.clearGroups();
      this.pointsGeometry.addGroup(0, Infinity, 0);
      this.pointsGeometry.addGroup(0, Infinity, 1);
      const pointsMaterial = new THREE.PointsMaterial({
        size: 5,
        sizeAttenuation: true,
        color: 0xffffff,
        blending: THREE.AdditiveBlending
      })
      const pointCloud = new THREE.Points(this.pointsGeometry, [pointsMaterial]);
      this.rotatingGroup.add(pointCloud);
      pointCloud.layers.disable(LAYERS.BLOOM_SCENE);

      // SphereToQuads(this.lineGeometry);
      this.lineGeometry.clearGroups();
      this.lineGeometry.addGroup(0, Infinity, 0);
      this.lineGeometry.addGroup(0, Infinity, 1);
      const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x747474, wireframe: true });
      const lineMesh = new THREE.LineSegments(this.lineGeometry, [lineMaterial]);
      this.rotatingGroup.add(lineMesh);

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
      this.group.rotation.z = -Math.PI * 0.15;

      // const getValueFromIndex = index => {
      //   const adjustedIndex = index * 3;
      //   return new THREE.Vector3(
      //     this.pointsGeometry.attributes.position.array[adjustedIndex],
      //     this.pointsGeometry.attributes.position.array[adjustedIndex + 1],
      //     this.pointsGeometry.attributes.position.array[adjustedIndex + 2]
      //   );
      // }

      // this.movingTriangles = [];
      // this.trianglePositions = [];
      // const indices = this.pointsGeometry.getIndex().array;
      // for(let i = 0; i < indices.length; i += 3) {
      //   let pointIndex1 = indices[i];
      //   let pointIndex2 = indices[i + 1];
      //   let pointIndex3 = indices[i + 2];

      //   const points = [
      //     getValueFromIndex(pointIndex1),
      //     getValueFromIndex(pointIndex2),
      //     getValueFromIndex(pointIndex3),
      //   ];
        
      //   const trianglePositionHolder = new THREE.Object3D();
      //   const trianglePosition = getCenter(points);
      //   trianglePositionHolder.position.x = trianglePosition.x;
      //   trianglePositionHolder.position.y = trianglePosition.y;
      //   trianglePositionHolder.position.z = trianglePosition.z;
      //   this.trianglePositions.push(trianglePositionHolder);
      //   this.rotatingGroup.add(trianglePositionHolder);
      //   // trianglePositionHolder.add(new THREE.AxesHelper(10));

      //   if(!renderTriangles)
      //     continue;

      //   const triangleGroup = new THREE.Group();

      //   const triGeometry = new THREE.BufferGeometry().setFromPoints(normalizePoints(points));
      //   const triMaterial = new THREE.MeshBasicMaterial({ color: 0x747474, wireframe: true });
      //   const mesh = new THREE.LineSegments(triGeometry, triMaterial);
      //   triangleGroup.add(mesh);

      //   const pointsMat = new THREE.PointsMaterial({
      //     size: 5,
      //     sizeAttenuation: true,
      //     color: 0xffffff,
      //     blending: THREE.AdditiveBlending
      //   });
      //   const meshPoints = new THREE.Points(triGeometry, pointsMat);
      //   triangleGroup.add(meshPoints);
      //   triangleGroup.position.set(trianglePosition.x, trianglePosition.y, trianglePosition.z);
      //   this.group.add(triangleGroup);
      //   this.movingTriangles.push(triangleGroup);
      // }
      // this.create = false;
    },
    update: function(time, camera) {
      this.rotatingGroup.rotation.y = time * 0.0001;
      this.innerSphere.rotation.y = -time * 0.001;
    }
  };
}

export { createSpherePoint, LAYERS, materials }
