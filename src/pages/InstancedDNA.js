import * as THREE from 'three';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import { GeometryUtils } from 'three/examples/jsm/utils/GeometryUtils';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Mesh } from 'three';

const randomPointInTriangle = function () {

  var vector = new THREE.Vector3();

  return function ( vectorA, vectorB, vectorC ) {

    var point = new THREE.Vector3();

    var a = Math.random();
    var b = Math.random();

    if ( ( a + b ) > 1 ) {

      a = 1 - a;
      b = 1 - b;

    }

    var c = 1 - a - b;

    point.copy( vectorA );
    point.multiplyScalar( a );

    vector.copy( vectorB );
    vector.multiplyScalar( b );

    point.add( vector );

    vector.copy( vectorC );
    vector.multiplyScalar( c );

    point.add( vector );

    return point;

  };

}()

const triangleArea = function () {

  var vector1 = new THREE.Vector3();
  var vector2 = new THREE.Vector3();

  return function ( vectorA, vectorB, vectorC ) {

    vector1.subVectors( vectorB, vectorA );
    vector2.subVectors( vectorC, vectorA );
    vector1.cross( vector2 );

    return 0.5 * vector1.length();

  };

}()

function randomPointsInBufferGeometry( geometry, n ) {

  var i,
    vertices = geometry.attributes.position.array,
    totalArea = 0,
    cumulativeAreas = [],
    vA, vB, vC;

  // precompute face areas
  vA = new THREE.Vector3();
  vB = new THREE.Vector3();
  vC = new THREE.Vector3();

  // geometry._areas = [];
  var il = vertices.length / 9;

  for ( i = 0; i < il; i ++ ) {

    vA.set( vertices[ i * 9 + 0 ], vertices[ i * 9 + 1 ], vertices[ i * 9 + 2 ] );
    vB.set( vertices[ i * 9 + 3 ], vertices[ i * 9 + 4 ], vertices[ i * 9 + 5 ] );
    vC.set( vertices[ i * 9 + 6 ], vertices[ i * 9 + 7 ], vertices[ i * 9 + 8 ] );

    totalArea += triangleArea( vA, vB, vC );

    cumulativeAreas.push( totalArea );

  }

  // binary search cumulative areas array

  function binarySearchIndices( value ) {

    function binarySearch( start, end ) {

      // return closest larger index
      // if exact number is not found

      if ( end < start )
        return start;

      var mid = start + Math.floor( ( end - start ) / 2 );

      if ( cumulativeAreas[ mid ] > value ) {

        return binarySearch( start, mid - 1 );

      } else if ( cumulativeAreas[ mid ] < value ) {

        return binarySearch( mid + 1, end );

      } else {

        return mid;

      }

    }

    var result = binarySearch( 0, cumulativeAreas.length - 1 );
    return result;

  }

  // pick random face weighted by face area

  var r, index,
    result = [];

  for ( i = 0; i < n; i ++ ) {

    r = Math.random() * totalArea;

    index = binarySearchIndices( r );

    // result[ i ] = GeometryUtils.randomPointInFace( faces[ index ], geometry, true );
    vA.set( vertices[ index * 9 + 0 ], vertices[ index * 9 + 1 ], vertices[ index * 9 + 2 ] );
    vB.set( vertices[ index * 9 + 3 ], vertices[ index * 9 + 4 ], vertices[ index * 9 + 5 ] );
    vC.set( vertices[ index * 9 + 6 ], vertices[ index * 9 + 7 ], vertices[ index * 9 + 8 ] );
    result[ i ] = randomPointInTriangle( vA, vB, vC );

  }

  return result;

}

const createInstancedDNA = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const loader = new GLTFLoader();

      loader.load('/models/lowpoly_dna.glb', object => {
        object.scene.traverse(child => {
          if(child.isMesh) {
            const pointsGeometry = randomPointsInBufferGeometry(child.geometry.clone(), 100);
            console.log(pointsGeometry);
            const pointsMaterial = new THREE.PointsMaterial({
              color: '#440000',
              size: 0.2,
              sizeAttenuation: true,
            })
            const points = new THREE.Points(pointsGeometry, pointsMaterial);
            this.rotatingGroup.add(points);
          }
        });
      });

      this.group.add(this.rotatingGroup);
      this.group.rotation.z = Math.PI * 0.15;
    },
    update: function(time) {
      // this.rotatingGroup.rotation.x = time * 0.001;
    }
  }
}

export { createInstancedDNA };
