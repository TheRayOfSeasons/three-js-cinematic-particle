import * as THREE from 'three';

const createRipplingSphere = ({ camera }) => {
  return {
    camera,
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    parameters: {
      debug: false,
      radius: 7,
      wave: {
        amplitudeMultiplier: 5,
        cycleMultiplier: 0.1,
      }
    },
    init: function() {
      this.subGroup = new THREE.Group();

      this.geometry = new THREE.SphereBufferGeometry(this.parameters.radius, 128, 128);
      const material = new THREE.MeshPhongMaterial({
        color: '#a9a9a9',
        emissive: '#919191',
        shininess: 100,
        flatShading: true,
      });
      const mesh = new THREE.Mesh(this.geometry, material);
      this.subGroup.add(mesh);

      this.reusables = {
        sphericals: {
          a: new THREE.Spherical(this.parameters.radius),
          b: new THREE.Spherical(this.parameters.radius),
        },
        vectors: {
          position: new THREE.Vector3(),
          intersectPoint: new THREE.Vector3(),
        }
      }
      this.reusables.vectors.intersectPoint.setFromSphericalCoords(
        this.parameters.radius,
        Math.PI * 0.4,
        Math.PI * 0.15
      );

      if(this.parameters.debug) {
        const box = new THREE.Mesh(
          new THREE.BoxBufferGeometry(1, 1, 1),
          new THREE.MeshNormalMaterial()
        );
        box.position.set(
          this.reusables.vectors.intersectPoint.x,
          this.reusables.vectors.intersectPoint.y,
          this.reusables.vectors.intersectPoint.z
        );
        box.lookAt(new THREE.Vector3());
        this.group.add(box);
      }

      this.showVal = true;
      this.group.add(this.subGroup);
    },
    update: function(time) {
      const elapsedTime = this.clock.getElapsedTime();

      for(let i = 0; i < this.geometry.attributes.position.array.length; i++) {
        const i3 = i * 3;
        const xIndex = i3;
        const yIndex = i3 + 1;
        const zIndex = i3 + 2;

        const x = this.geometry.attributes.position.array[xIndex];
        const y = this.geometry.attributes.position.array[yIndex];
        const z = this.geometry.attributes.position.array[zIndex];

        this.reusables.vectors.position.set(x, y, z);
        this.reusables.sphericals.a.setFromCartesianCoords(x, y, z);

        const amplitude = this.parameters.wave.amplitudeMultiplier;
        const cycleLength = this.parameters.wave.cycleMultiplier;
        const phi = this.reusables.sphericals.a.phi;
        const theta = this.reusables.sphericals.a.theta;
        const phiMovement = Math.cos((elapsedTime + phi) * amplitude) * cycleLength;
        const thetaMovement = Math.sin((elapsedTime + theta) * amplitude) * cycleLength;

        const radius = this.parameters.radius - (phiMovement + thetaMovement);
        this.reusables.vectors.position.setFromSphericalCoords(radius, phi, theta);

        this.geometry.attributes.position.array[xIndex] = this.reusables.vectors.position.x;
        this.geometry.attributes.position.array[yIndex] = this.reusables.vectors.position.y;
        this.geometry.attributes.position.array[zIndex] = this.reusables.vectors.position.z;
      }
      this.geometry.attributes.position.needsUpdate = true;
    }
  }
}

export { createRipplingSphere };
