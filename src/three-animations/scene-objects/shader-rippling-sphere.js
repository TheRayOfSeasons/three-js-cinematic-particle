import * as THREE from 'three';
import { fractals } from '../utils/shaders';

const createShaderRipplingSphere = ({ camera }) => {
  return {
    camera,
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    parameters: {
      radius: 8,
    },
    init: function() {
      // this.geometry = new THREE.IcosahedronBufferGeometry(this.parameters.radius, 18);
      this.geometry = new THREE.SphereBufferGeometry(this.parameters.radius, 512, 512);
      this.material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0.0 },
          uMidRadius: { value: this.parameters.radius },
          uSurfaceColor: { value: new THREE.Color('#e7e7e7') },
          uDepthColor: { value: new THREE.Color('#a9a9a9') },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uMidRadius;

          varying float vElevation;
          varying float vPattern;
          varying vec2 vUv;

          struct Spherical
          {
            float radius;
            float phi;
            float theta;
          };

          Spherical cartesianToSpherical(vec3 cartesianCoords)
          {
            float x = cartesianCoords.x;
            float y = cartesianCoords.y;
            float z = cartesianCoords.z;
            float radius = sqrt(x * x + y * y + z * z);
            float phi = atan(sqrt(x * x + y * y), z);
            float theta = atan(y, x);
            return Spherical(radius, phi, theta);
          }

          vec3 sphericalToCartesian(Spherical spherical)
          {
            float radius = spherical.radius;
            float phi = spherical.phi;
            float theta = spherical.theta;
            float x = radius * sin(phi) * cos(theta);
            float y = radius * sin(phi) * sin(theta);
            float z = radius * cos(phi);
            return vec3(x, y, z);
          }

          ${fractals()}

          void main()
          {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);

            float pattern = getFractalPattern(uv * 5.0);

            Spherical spherical = cartesianToSpherical(modelPosition.xyz);
            spherical.radius += pattern * 0.5;
            vec3 updatedPosition = sphericalToCartesian(spherical);

            modelPosition.x = updatedPosition.x;
            modelPosition.y = updatedPosition.y;
            modelPosition.z = updatedPosition.z;

            // modelPosition.z += pattern;

            vPattern = pattern;
            vUv = uv;

            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            gl_Position = projectedPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uSurfaceColor;
          uniform vec3 uDepthColor;

          varying float vPattern;

          void main()
          {
            float mixStrength = vPattern;
            vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
            gl_FragColor = vec4(color, 1.0);
          }
        `
      });
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.group.add(this.mesh);
    },
    update: function() {
      const elapsedTime = this.clock.getElapsedTime();
      this.material.uniforms.uTime.value = elapsedTime;
    }
  }
}

export { createShaderRipplingSphere };
