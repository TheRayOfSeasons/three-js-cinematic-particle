import * as THREE from 'three';

const createTwistedVectors = ({ span, radius, inverted=false }) => {
  const splineVectors = [];
  for(let i = 0; i < span; i++) {
    const x = (i + 1) - (span / 2);
    const y = (inverted ? Math.cos(x) : Math.sin(x)) * radius * (inverted ? -1 : 1);
    const z = (inverted ? Math.sin(x) : Math.cos(x)) * radius * (inverted ? -1 : 1);
    const vector = new THREE.Vector3(x, y, z);
    splineVectors.push(vector);
  }
  return splineVectors;
}

const createEnhancedAnimatedDNA = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const smallSphereGeometry = new THREE.SphereBufferGeometry(0.025, 8, 8);
      const smallSphereMaterial = new THREE.MeshPhongMaterial({
        color: '#96fc8c',
        specular: '#ffffff',
        shininess: 100,
        emissiveIntensity: 1,
      });
      this.smallSphereMesh = new THREE.InstancedMesh(smallSphereGeometry, smallSphereMaterial, 8000);
      this.smallSphereMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.smallDummy = new THREE.Object3D();
      this.rotatingGroup.add(this.smallSphereMesh);

      const largeSphereGeometry = new THREE.SphereBufferGeometry(0.1, 8, 8);
      const largeSphereMaterial = new THREE.MeshPhongMaterial({
        color: '#25d1db',
        specular: '#ffffff',
        shininess: 100,
        emissiveIntensity: 1,
      });
      this.largeSphereMesh = new THREE.InstancedMesh(largeSphereGeometry, largeSphereMaterial, 8000);
      this.largeSphereMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.largeDummy = new THREE.Object3D();
      this.rotatingGroup.add(this.largeSphereMesh);

      this.splineVectorCollection = [
        {
          vectors: createTwistedVectors({ span: 25, radius: 1.5, inverted: false }),
          invert: false,
          rotation: 0
        },
        {
          vectors: createTwistedVectors({ span: 25, radius: 1.5, inverted: false }),
          invert: true,
          rotation: Math.PI
        }
      ];

      const count = 100;
      const lineFrequency = 5;
      const lineFrequencyOffset = 1;
      this.splines = this.splineVectorCollection.map(({ vectors }) => {
        const curve = new THREE.CatmullRomCurve3(vectors);
        return curve;
      });
      this.splinePoints = this.splines.map(spline => spline.getPoints(count));

      this.splineObjects = [];
      for(let i = 0; i < this.splinePoints.length; i++) {
        const geometry = new THREE.BufferGeometry().setFromPoints(this.splinePoints[i]);
        if(this.splineVectorCollection[i].invert) {
          geometry.rotateX(this.splineVectorCollection[i].rotation);
        }
        const material = new THREE.LineBasicMaterial({
          color : 0xff0000,
          transparent: true,
          opacity: 0
        });
        const splineObject = new THREE.Line(geometry, material);
        this.rotatingGroup.add(splineObject);
        this.splineObjects.push({
          splineObject,
          geometry
        });
      }

      const lineVectorGroups = [];
      for(let i = 0; i < count; i++) {
        if((i + lineFrequencyOffset) % lineFrequency == 0) {
          const i3 = i * 3;
          const x = i3;
          const y = i3 + 1;
          const z = i3 + 2;
          const vectorGroup = [];
          for(const { geometry } of this.splineObjects) {
            const xPos = geometry.attributes.position.array[x];
            const yPos = geometry.attributes.position.array[y];
            const zPos = geometry.attributes.position.array[z];
            vectorGroup.push(new THREE.Vector3(xPos, yPos, zPos));
          }
          lineVectorGroups.push(vectorGroup);
        }
      }

      this.middleLines = [];
      for(const lineVectorGroup of lineVectorGroups) {
        const line = new THREE.CatmullRomCurve3(lineVectorGroup);
        const points = line.getPoints(15);
        this.middleLines.push({
          line,
          points
        });
      }

      this.lineObjects = [];
      for(const { points } of this.middleLines) {
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
          color : 0xff0000,
          transparent: true,
          opacity: 0
        });
        const lineObject = new THREE.Line(geometry, material);
        this.rotatingGroup.add(lineObject);
        this.lineObjects.push(lineObject);
      }

      const strayRange = 0.5;
      const strayCount = 4;
      const flattenedCurvePoints = this.splineObjects.reduce((accumulator, { geometry }) => {
        const points = [];
        for(let i = 0; i < geometry.attributes.position.array.length; i++) {
          const i3 = i * 3;
          const x = i3;
          const y = i3 + 1;
          const z = i3 + 2;
          const xPos = geometry.attributes.position.array[x];
          const yPos = geometry.attributes.position.array[y];
          const zPos = geometry.attributes.position.array[z];
          for(let j = 0; j < strayCount; j++) {
            points.push(new THREE.Vector3(
              (Math.random() - 0.5) * strayRange + xPos,
              (Math.random() - 0.5) * strayRange + yPos,
              (Math.random() - 0.5) * strayRange + zPos,
            ));
          }
          points.push(new THREE.Vector3(xPos, yPos, zPos));
        }
        return [...accumulator, ...points];
      }, []);
      const flattenedLinePoints = this.middleLines
        .map(({ points }) => points)
        .reduce((accumulator, current) => {
          const points = [];
          for(let i = 0; i < current.length; i++) {
            const xPos = current[i].x;
            const yPos = current[i].y;
            const zPos = current[i].z;
            for(let j = 0; j < strayCount * 2; j++) {
              points.push(new THREE.Vector3(
                (Math.random() - 0.5) * strayRange + xPos,
                (Math.random() - 0.5) * strayRange + yPos,
                (Math.random() - 0.5) * strayRange + zPos,
              ));
            }
            points.push(current[i]);
          }
          return [...accumulator, ...points];
        }, []);;
      const positions = [...flattenedCurvePoints, ...flattenedLinePoints];

      let smallInstanceIndex = 0;
      let largeInstanceIndex = 0;
      const largeGeometryFrequency = 75;
      for(let i = 0; i < positions.length; i++) {
        const position = positions[i];
        if(position) {
          if(i % largeGeometryFrequency == 0) {
            this.largeDummy.position.set(position.x, position.y, position.z);
            this.largeDummy.updateMatrix();
            this.largeSphereMesh.setMatrixAt(largeInstanceIndex++, this.largeDummy.matrix);
          }
          else {
            this.smallDummy.position.set(position.x, position.y, position.z);
            this.smallDummy.updateMatrix();
            this.smallSphereMesh.setMatrixAt(smallInstanceIndex++, this.smallDummy.matrix);
          }
        }
      }

      this.group.add(this.rotatingGroup);
      this.group.rotation.z = -Math.PI * 0.15;
    },
    update: function(time) {
      const elapsedTime = this.clock.getElapsedTime();
      const speed = 0.25;
      this.rotatingGroup.rotation.x = elapsedTime * speed;

      if(this.smallSphereMesh) {
        this.smallSphereMesh.setMatrixAt(0, this.smallDummy.matrix);
        this.smallSphereMesh.instanceMatrix.needsUpdate = true;
      }

      if(this.largeSphereMesh) {
        this.largeSphereMesh.setMatrixAt(0, this.largeDummy.matrix);
        this.largeSphereMesh.instanceMatrix.needsUpdate = true;
      }
    }
  }
}

export { createEnhancedAnimatedDNA };
