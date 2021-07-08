import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';

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
    pointsGeometry: new THREE.SphereBufferGeometry(250, 16, 12),
    lineGeometry: new THREE.SphereBufferGeometry(250, 16, 12),
    diffuseGeometry: new THREE.SphereBufferGeometry(250, 16, 12),
    innerSphereGeometry: new THREE.SphereBufferGeometry(150, 24, 16),
    hasTriangles: renderTriangles,
    transferTarget: undefined,
    clearedForTranfer: 0,
    interval: 5,
    matrix: new THREE.Matrix4(),
    matrixPosition: new THREE.Vector3(),
    getTransferTarget: function() {
      return this.transferTarget || this;
    },
    transferTriangles: function(target) {
      this.transferTarget = target;
      this.clearedForTranfer = 0;
    },
    init: function(camera) {
      const textureLoader = new THREE.TextureLoader();
      const pointTexture = textureLoader.load('/b10-gradient.png');

      // this.pointsGeometry.clearGroups();
      // this.pointsGeometry.addGroup(0, Infinity, 0);
      // this.pointsGeometry.addGroup(0, Infinity, 1);
      // const pointsMaterial = new THREE.PointsMaterial({
      //   alphaMap: pointTexture,
      //   transparent: true,
      //   size: 12,
      //   sizeAttenuation: true,
      //   color: '#24536d',
      //   blending: THREE.AdditiveBlending
      // })
      // const pointCloud = new THREE.Points(this.pointsGeometry, [pointsMaterial]);
      // // this.rotatingGroup.add(pointCloud);
      // pointCloud.layers.disable(LAYERS.BLOOM_SCENE);

      // const pointLight = new THREE.PointLight('#96fc8c', 3);
      // pointLight.position.y = 10;
      // this.rotatingGroup.add(pointLight);

      // const pointLight2 = new THREE.PointLight('#25d1db', 3);
      // pointLight2.position.y = -10;
      // this.rotatingGroup.add(pointLight2);

      this.lineGeometry.clearGroups();
      this.lineGeometry.addGroup(0, Infinity, 0);
      this.lineGeometry.addGroup(0, Infinity, 1);
      const lineMaterial = new THREE.MeshBasicMaterial({
        color: 0x747474,
        wireframe: true,
        transparent: true,
        opacity: 0.1,
      });
      const lineMesh = new THREE.LineSegments(this.lineGeometry, [lineMaterial]);
      this.rotatingGroup.add(lineMesh);

      const innerPointsMaterial = new THREE.PointsMaterial({
        alphaMap: pointTexture,
        transparent: true,
        size: 3,
        sizeAttenuation: true,
        color: '#5190d1',
        blending: THREE.AdditiveBlending
      })
      this.innerSphere = new THREE.Points(this.innerSphereGeometry, innerPointsMaterial);
      console.log(this.innerSphere);
      this.group.add(this.innerSphere);

      this.rotatingGroup.layers.enable(LAYERS.ENTIRE_SCENE);


      const lightGeometry = new THREE.SphereBufferGeometry(100, 24, 16);
      const lightMaterial = new THREE.MeshLambertMaterial({ color: '#158186' });
      const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
      this.group.add(lightMesh);
      lightMesh.layers.enable(LAYERS.BLOOM_SCENE);

      
      // dotGeometry.computeVertexNormals();
      // const dotMaterial = new THREE.MeshPhongMaterial({ color: '#5190d1' });
      // this.dotInstancedMesh = new THREE.InstancedMesh(dotGeometry, dotMaterial);
      // this.dotInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      // this.rotatingGroup.add(this.dotInstancedMesh);

      // const dotDummy = new THREE.Object3D();
      const pointCloudGeometries = [];
      for(let i = 0, i3 = 0; i3 < this.pointsGeometry.attributes.position.array.length; i3 += 3) {
        const x = i3;
        const y = i3 + 1;
        const z = i3 + 2;

        const xValue = this.pointsGeometry.attributes.position.array[x];
        const yValue = this.pointsGeometry.attributes.position.array[y];
        const zValue = this.pointsGeometry.attributes.position.array[z];

        const dotGeometry = new THREE.SphereBufferGeometry(5, 8, 8);
        dotGeometry.translate(xValue, yValue, zValue);
        pointCloudGeometries.push(dotGeometry);
        // dotDummy.position.set(xValue, yValue, zValue);
        // dotDummy.updateMatrix();
        // this.dotInstancedMesh.setMatrixAt(i++, dotDummy.matrix)
        // this.dotInstancedMesh.setPositionAt(i++, instancePosition);
        // dotGeometry.translate()
      }

      const pointCloudGeometry = BufferGeometryUtils.mergeBufferGeometries(pointCloudGeometries);
      const pointCloudMaterial = new THREE.MeshLambertMaterial({ color: '#1c1546' });
      const pointCloudHighRes = new THREE.Mesh(pointCloudGeometry, pointCloudMaterial);
      pointCloudHighRes.layers.enable(LAYERS.BLOOM_SCENE);
      this.rotatingGroup.add(pointCloudHighRes);

      // const getValueFromIndex = index => {
      //   const adjustedIndex = index * 3;
      //   return new THREE.Vector3(
      //     this.pointsGeometry.attributes.position.array[adjustedIndex],
      //     this.pointsGeometry.attributes.position.array[adjustedIndex + 1],
      //     this.pointsGeometry.attributes.position.array[adjustedIndex + 2]
      //   );
      // }

      this.group.add(this.rotatingGroup);
      this.group.rotation.z = -Math.PI * 0.15;

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

      // if(this.dotInstancedMesh) {
      //   this.dotInstancedMesh.getMatrixAt(0, this.matrix);
      //   this.matrixPosition.setFromMatrixPosition(this.matrix); // extract position form transformationmatrix
      //   this.matrix.setPosition(this.matrixPosition); // write new positon back
      //   this.dotInstancedMesh.setMatrixAt(0, this.matrix);
      //   this.dotInstancedMesh.instanceMatrix.needsUpdate = true;
      // }
    }
  };
}

export { createSpherePoint, LAYERS, materials }
