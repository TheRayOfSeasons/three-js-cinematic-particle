import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';

const getSkinnedPoints = skinnedMesh => {
	skinnedMesh.skeleton.update();

  const points = new THREE.Points(skinnedMesh.geometry, new THREE.MeshLambertMaterial({
    skinning:true,
    color: 0x000000,
  }));

  // points.matrixWorld.copy(skinnedMesh.matrixWorld);
  
  points.skeleton = skinnedMesh.skeleton;
  points.bindMatrix = skinnedMesh.bindMatrix;
  points.bindMatrixInverse = skinnedMesh.bindMatrixInverse;
  points.bindMode = skinnedMesh.bindMode;
  points.drawMode = skinnedMesh.drawMode;
  points.name = skinnedMesh.name;
  points.parent = skinnedMesh.parent;
  points.uuid = skinnedMesh.uuid;
  points.type = skinnedMesh.type;

  points.isSkinnedMesh = true;
  points.bind = skinnedMesh.bind;
  points.clone = skinnedMesh.clone;
  points.initBones = skinnedMesh.initBones;
  points.normalizeSkinWeights = skinnedMesh.normalizeSkinWeights;
  points.pose = skinnedMesh.pose;

  return points; 
}

function fillWithPoints(geometry, count) {
    
  var ray = new THREE.Ray()
  
  var size = new THREE.Vector3();
  geometry.computeBoundingBox();
  let bbox = geometry.boundingBox;
  
  let points = [];
  
  var dir = new THREE.Vector3(1, 1, 1).normalize();
  for (let i = 0; i < count; i++) {
    let p = setRandomVector(bbox.min, bbox.max);
    points.push(p);
  }
  
  function setRandomVector(min, max){
    let v = new THREE.Vector3(
      THREE.Math.randFloat(min.x, max.x),
      THREE.Math.randFloat(min.y, max.y),
      THREE.Math.randFloat(min.z, max.z)
    );
    if (!isInside(v)){return setRandomVector(min, max);}
    return v;
  }
  
  function isInside(v){
    
    ray.set(v, dir);
    let counter = 0;
    
    let pos = geometry.attributes.position;
    let faces = pos.count / 3;
    let vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();

    for(let i = 0; i < faces; i++){
      vA.fromBufferAttribute(pos, i * 3 + 0);
      vB.fromBufferAttribute(pos, i * 3 + 1);
      vC.fromBufferAttribute(pos, i * 3 + 2);
      if (ray.intersectTriangle(vA, vB, vC)) counter++;
    }
    
    return counter % 2 == 1;
  }
  
  return new THREE.BufferGeometry().setFromPoints(points);
}

const createRunningMan = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      const loader = new FBXLoader();

      // const geometry = new THREE.BoxBufferGeometry(20, 20, 20).toNonIndexed();
      // const pointGeometry = fillWithPoints(geometry, 10000);
      // const pointMaterial = new THREE.PointsMaterial({
      //   color: 0xff0f0f,
      //   size: 2,
      //   sizeAttenuation: true
      // });
      // const points = new THREE.Points(pointGeometry, pointMaterial);
      // this.group.add(points);
      // points.position.x = 2;

      loader.load('/models/RunningYBot.fbx', object => {
        this.animationMixer = new THREE.AnimationMixer(object);

        const action = this.animationMixer.clipAction(object.animations[0]);
        action.play();

        let modifiedChildren = object.children.map(child => {
          if(child.isMesh) {
            return getSkinnedPoints(child);
          }
          return child;
        });

        object.children = modifiedChildren;

        // object.traverse(child => {
        //   if(child.isMesh) {
        //     child.castShadow = true;
        //     child.receiveShadow = true;
        //     console.log(child);
        //   }
        //   if(child.material) {
        //     child.material = new THREE.MeshLambertMaterial({ color: 0x00b7cf });
        //     // child.material = new THREE.PointsMaterial({
        //     //   color: 0xff0f0f,
        //     //   size: 2,
        //     //   sizeAttenuation: true
        //     // });
        //   }
        //   if(child.geometry) {
        //     // const oldGeometry = new THREE.BufferGeometry()
        //     // oldGeometry.setAttribute('position', new THREE.Float32BufferAttribute(child.geometry.attributes.position.array, 3));
        //     // oldGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(child.geometry.attributes.normal.array, 3));
        //     // oldGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(child.geometry.attributes.uv.array, 3));
        //     // oldGeometry.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(child.geometry.attributes.skinIndex.array, 3));
        //     // oldGeometry.setAttribute('skinWeight', new THREE.Float32BufferAttribute(child.geometry.attributes.skinWeight.array, 3));
        //     // oldGeometry.boundingSphere = child.geometry.boundingSphere;
        //     // oldGeometry.FBX_Deformer = child.geometry.FBX_Deformer;
        //     // oldGeometry.name = 'Alpha_Joints';
        //     // console.log('oldGeometry:', oldGeometry);
        //     // console.log('originalGeometry:', child.geometry);
        //     // child.geometry = oldGeometry;
        //   }
        // });
        this.group.add(object);
      });
    },
    update: function(time) {
      const delta = this.clock.getDelta();
      if (this.animationMixer) {
        this.animationMixer.update(delta);
      }
    }
  }
}

export { createRunningMan };
