import * as THREE from 'three';

/**
 * 
 * @param {THREE.Vector3} origin 
 */
const createRipple = ({ origin }) => {
  return {
    origin,
    getUpdatedMovement: function(elapsedTime, { vertexPosition, midRadius, amplitude, cycleLength }) {
      const chordLength = this.origin.distanceTo(vertexPosition);
      const chordAngle = Math.cos(chordLength / midRadius) * (180 / Math.PI);
      const arcLength = (chordAngle / 360) * 2 * Math.PI * midRadius;

      const movement = Math.cos((elapsedTime + arcLength) * amplitude) * cycleLength;
      return movement;
    }
  }
}


const createRipplingSphere = ({ camera }) => {
  return {
    camera,
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    parameters: {
      debug: false,
      radius: 7,
      wave: {
        amplitudeMultiplier: 5.0,
        cycleMultiplier: 0.175,
      }
    },
    init: function() {
      this.subGroup = new THREE.Group();

      this.geometry = new THREE.IcosahedronBufferGeometry(this.parameters.radius, 16);
      // this.geometry = new THREE.SphereBufferGeometry(this.parameters.radius, 128, 128);
      const material = new THREE.MeshPhongMaterial({
        color: '#a9a9a9',
        emissive: '#919191',
        shininess: 100,
        // flatShading: true,
      });
      const mesh = new THREE.Mesh(this.geometry, material);
      this.subGroup.add(mesh);

      this.reusables = {
        sphericals: {
          a: new THREE.Spherical(this.parameters.radius),
          b: new THREE.Spherical(this.parameters.radius),
        },
        vectors: {
          origin: new THREE.Vector3(),
          position: new THREE.Vector3(),
          intersectPoint: new THREE.Vector3(),
        }
      }
      this.reusables.vectors.intersectPoint.setFromSphericalCoords(
        this.parameters.radius,
        -Math.PI * 0.5,
        Math.PI * 0.25
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

      this.ripples = [
        createRipple({ origin: new THREE.Vector3().setFromSphericalCoords(
          this.parameters.radius,
          -Math.PI * 0.5,
          Math.PI * 0.25
        )}),
        createRipple({ origin: new THREE.Vector3().setFromSphericalCoords(
          this.parameters.radius,
          -Math.PI * 0.75,
          Math.PI * 0.0
        )}),
      ]

    },
    update: function(time) {
      const elapsedTime = this.clock.getElapsedTime();

      let vals;
      for(let i = 0; i < this.geometry.attributes.position.array.length; i++) {
        const i3 = i * 3;
        const xIndex = i3;
        const yIndex = i3 + 1;
        const zIndex = i3 + 2;

        const x = this.geometry.attributes.position.array[xIndex];
        const y = this.geometry.attributes.position.array[yIndex];
        const z = this.geometry.attributes.position.array[zIndex];

        // get arcLength between intersectPoint and current vertex
        // this.reusables.vectors.position.set(x, y, z);
        // this.reusables.sphericals.a.setFromCartesianCoords(x, y, z);
        // const chordLength = this.reusables.vectors.intersectPoint.distanceTo(
        //   this.reusables.vectors.position
        // );
        // //             theta
        // // arcLength = ----- * 2πr
        // //              360
        // const thetaOfChord = Math.cos(chordLength / this.parameters.radius) * (180 / Math.PI);
        // const arcLength = (thetaOfChord / 360) * 2 * Math.PI * this.parameters.radius;

        // const amplitude = this.parameters.wave.amplitudeMultiplier;
        // const cycleLength = this.parameters.wave.cycleMultiplier;
        
        // const movement = Math.cos((elapsedTime + arcLength) * amplitude) * cycleLength;
        // const radius = this.parameters.radius + (movement);

        this.reusables.vectors.origin.set(x, y, z);
        this.reusables.sphericals.a.setFromCartesianCoords(x, y, z);
        let movement = 0;
        for(const ripple of this.ripples) {
          movement += ripple.getUpdatedMovement(elapsedTime, {
            vertexPosition: new THREE.Vector3(x, y, z),
            midRadius: this.parameters.radius,
            amplitude: this.parameters.wave.amplitudeMultiplier,
            cycleLength: this.parameters.wave.cycleMultiplier
          });
        }
        const radius = this.parameters.radius + movement;
        const phi = this.reusables.sphericals.a.phi;
        const theta = this.reusables.sphericals.a.theta;
        this.reusables.vectors.position.setFromSphericalCoords(radius, phi, theta);
        this.reusables.vectors.origin.lerp(this.reusables.vectors.position, 0.05);

        this.geometry.attributes.position.array[xIndex] = this.reusables.vectors.origin.x;
        this.geometry.attributes.position.array[yIndex] = this.reusables.vectors.origin.y;
        this.geometry.attributes.position.array[zIndex] = this.reusables.vectors.origin.z;
      }
      this.geometry.attributes.position.needsUpdate = true;

      if(this.showVal) {
        console.log(vals)
      }

      this.showVal = false;
    }
  }
}

export { createRipplingSphere };
