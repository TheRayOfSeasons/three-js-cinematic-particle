import * as THREE from 'three';


const createTwistedVectors = ({ span, radius, inverted=false }) => {
  const splineVectors = [];
  for(let i = 0; i < span; i++) {
    const x = (i + 1) - (span / 2);
    const y = (inverted ? Math.cos(x) : Math.sin(x)) * radius;
    const z = (inverted ? Math.sin(x) : Math.cos(x)) * radius;
    const vector = new THREE.Vector3(x, y, z);
    splineVectors.push(vector);
  }
  return splineVectors;
}

const createPathedDNA = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    parameters: {
      frameSpan: 100,
      speed: 0.05,
      objectCountPerSpline: 50,
      reverse: false,
      static: false,
    },
    init: function() {
      this.subGroup = new THREE.Group();

      this.splineVectorCollection = [
        createTwistedVectors({ span: 25, radius: 1, inverted: false }),
        createTwistedVectors({ span: 25, radius: 1, inverted: false })
      ];

      const materials = [
        new THREE.MeshLambertMaterial({
          color: '#dbdbdb',
          metalness: 0.25,
          roughness: 1,
          emissiveIntensity: 1,
        }),
        new THREE.MeshStandardMaterial({
          color: '#20d620',
          metalness: 0.25,
          roughness: 1,
          emissiveIntensity: 1,
        }),
      ];
      const geometries = [
        new THREE.BoxBufferGeometry(0.25, 0.25, 0.25),
        new THREE.SphereBufferGeometry(0.15, 8, 8)
      ];

      this.splines = [];
      let splineIndex = 0;
      for(const splineVectors of this.splineVectorCollection) {

        const objectMaterial = materials[splineIndex];
        splineIndex++;

        const spline = new THREE.CatmullRomCurve3(splineVectors);
        const points = spline.getPoints(50);

        const localGroup = new THREE.Group();
        const objects = [];
        this.posIndices = [];
        const objectCount = this.parameters.objectCountPerSpline;
        const objectPositions = spline.getPoints(objectCount);
        for(let i = 0; i < objectPositions.length - 1; i++) {
          const vector = objectPositions[i];
          const geometry = geometries[i % geometries.length];
          const mesh = new THREE.Mesh(geometry, objectMaterial);
          mesh.position.x = vector.x;
          mesh.position.y = vector.y;
          mesh.position.z = vector.z;
          localGroup.add(mesh);
          this.posIndices.push(this.parameters.frameSpan * (i / objectCount));
          objects.push({ mesh, index: i });
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ color : 0xff0000, transparent: true, opacity: 0 });
        const splineObject = new THREE.Line(geometry, material);
        this.subGroup.add(splineObject);
        this.subGroup.add(localGroup);

        this.splines.push({
          spline,
          splineObject,
          objects,
          group: localGroup
        })
      }
      this.splines[1].splineObject.rotation.x = Math.PI * 0.75;
      this.splines[1].group.rotation.x = Math.PI * 0.75;

      this.group.add(this.subGroup);
    },
    update: function(time) {
      if(this.parameters.static) {
        return;
      }

      for(const { spline, splineObject, objects } of this.splines) {
        for(const { mesh, index } of objects ) {
          this.posIndices[index] += this.parameters.reverse
            ? -this.parameters.speed
            : this.parameters.speed;
          const limitReached = this.parameters.reverse
            ? this.posIndices[index] < 0
            : this.posIndices[index] > this.parameters.frameSpan;
          if(limitReached) {
            this.posIndices[index] = this.parameters.reverse
              ? this.parameters.frameSpan
              : 0;
          }
          const newPosIndex = this.posIndices[index];
          const newPos = spline.getPoint(newPosIndex / this.parameters.frameSpan);
          const newRot = spline.getTangent(newPosIndex / this.parameters.frameSpan);

          mesh.position.x = newPos.x;
          mesh.position.y = newPos.y;
          mesh.position.z = newPos.z;

          mesh.rotation.z = newRot.z;
          mesh.rotation.z = newRot.z;
          mesh.rotation.z = newRot.z;
        }
      }
    }
  }
}

export { createPathedDNA };
