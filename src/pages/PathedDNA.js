import * as THREE from 'three';


const getDistance = (x1, y1, x2, y2) => {
  return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
}

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

const createPathedDNA = (canvas, camera) => {
  return {
    canvas,
    camera,
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    parameters: {
      frameSpan: 100,
      speed: 0.05,
      objectCountPerSpline: 50,
      reverse: false,
      static: false,
      interactions: {
        ease: 0.005,
        affectedArea: 10
      }
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
          objects.push({
            mesh,
            index: i,
            initialPosition: vector
          });
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
          group: localGroup,
          origin: points[0],
        })
      }
      this.splines[1].splineObject.rotation.x = Math.PI * 0.75;
      this.splines[1].group.rotation.x = Math.PI * 0.75;
      this.subGroup.rotation.z = -Math.PI * 0.15;

      this.group.add(this.subGroup);

      this.mousePosition = new THREE.Vector2();
      this.raycaster = new THREE.Raycaster();
      this.raycastPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
      this.intersectPoint = new THREE.Vector3();
      const updateMousePosition = event => {
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
      }
      window.addEventListener('mousemove', updateMousePosition);
    },
    update: function(time) {
      if(this.parameters.static) {
        return;
      }
      this.raycaster.ray.intersectPlane(this.raycastPlane, this.intersectPoint);

      for(const { spline, splineObject, objects, origin } of this.splines) {
        for(const { mesh, index, initialPosition } of objects ) {
          const speed = this.parameters.reverse
            ? -this.parameters.speed
            : this.parameters.speed;
          this.posIndices[index] += speed;
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

          let currentX =  mesh.position.x;
          let currentY =  mesh.position.y;
          let currentZ =  mesh.position.z;
          let distanceX = initialPosition.x - mesh.position.x;
          let distanceY = initialPosition.y - mesh.position.y;
          const mouseDistance = getDistance(
            this.intersectPoint.x, this.intersectPoint.y,
            currentX, currentY
          );

          const distance = (
            (distanceX = this.intersectPoint.x - currentX)
            * distanceX
            + (distanceY = this.intersectPoint.y - currentY)
            * distanceY
          );
          const force = -this.parameters.interactions.affectedArea / (distance || 1);
          if(mouseDistance < this.parameters.interactions.affectedArea) {
            const theta = Math.atan2(initialPosition.y, initialPosition.x);
            currentX += force * Math.cos(theta);
            currentY += force * Math.sin(theta);
            mesh.position.x += (initialPosition.x - currentX) * this.parameters.interactions.ease;
            mesh.position.y += (initialPosition.y - currentY) * this.parameters.interactions.ease;
            mesh.position.z += (initialPosition.z - currentZ) * this.parameters.interactions.ease;
            mesh.position.lerp(newPos, this.parameters.speed);
          }
          else {
            // mesh.position.x = newPos.x;
            // mesh.position.y = newPos.y;
            // mesh.position.z = newPos.z;
            mesh.position.lerp(newPos, this.parameters.speed);
          }

          mesh.rotation.z = newRot.z;
          mesh.rotation.z = newRot.z;
          mesh.rotation.z = newRot.z;
        }
      }
    }
  }
}

export { createPathedDNA };
