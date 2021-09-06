import * as THREE from 'three';
import { fractals } from '../utils/shaders';

const createShaderRipplingSphere = ({ camera }) => {
  return {
    camera,
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    parameters: {
      debug: false,
      showControlPoints: true,
      radius: 8,
      controlPoint1: new THREE.Vector3(-3, 0, 0),
      controlPoint2: new THREE.Vector3(8, 0, 0),
    },
    material: new THREE.MeshStandardMaterial({ color: '#a9a9a9', }),
    init: function() {
      this.geometry = new THREE.SphereBufferGeometry(this.parameters.radius, 768, 768);

      this.mousePosition = new THREE.Vector2();
      this.raycaster = new THREE.Raycaster();
      this.raycastPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -4);
      this.raycastSphere = new THREE.Sphere(new THREE.Vector3(), this.parameters.radius);
      this.intersectPoint = new THREE.Vector3();
      this.group.add(this.easingPosition);
      window.addEventListener('mousemove', event => {
        this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
        this.raycaster.setFromCamera(this.mousePosition, this.camera);
      });

      this.material.onBeforeCompile = shader => {
        shader.uniforms.uEnableInteraction = { value: true };
        shader.uniforms.uInteractionRadius = { value: 7.0 };
        shader.uniforms.uMaxElevation = { value: 0.5 };
        shader.uniforms.uMidRadius = { value: this.parameters.radius };
        shader.uniforms.uSmoothing = { value: 0.4 };
        shader.uniforms.uSpeed = { value: 0.05 };
        shader.uniforms.uTime = { value: 0.0 };
        shader.uniforms.uUvZoom = { value: 7.2 };
        shader.uniforms.uIntersectPoint = { value: this.intersectPoint };
        shader.uniforms.uWaveControlVectorA = { value: this.parameters.controlPoint1 };
        shader.uniforms.uWaveControlVectorB = { value: this.parameters.controlPoint2 };
        shader.uniforms.uSurfaceColor = { value: new THREE.Color('#b3b3b3') };
        shader.uniforms.uDepthColor = { value: new THREE.Color('#a9a9a9') };
        shader.vertexShader = `
          const float RADIANS_TO_DEGREES = 57.29577951308232;
          const float PI = 3.141592653589793;

          uniform bool uEnableInteraction;
          uniform float uInteractionRadius;
          uniform float uMaxElevation;
          uniform float uMidRadius;
          uniform float uSmoothing;
          uniform float uSpeed;
          uniform float uTime;
          uniform float uUvZoom;
          uniform vec3 uIntersectPoint;
          uniform vec3 uWaveControlVectorA;
          uniform vec3 uWaveControlVectorB;

          varying float vPattern;

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

          bool isInBetween(float value, float min, float max)
          {
            return value >= min && value <= max;
          }

          ${fractals()}

          float noise(vec2 uv)
          {
            return fractal_noise(vec3(uv, uTime * uSpeed), ripple);
          }

          vec3 hsv2rgb(vec3 c) {
            vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
            vec3 p = abs(fract(c.xxx + K.xyz) * balance - K.www);
            return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
          }

          float getFractalPattern(vec2 uv)
          {
            vec3 pattern = hsv2rgb(vec3(noise(uv)*10., 1., 1.));
            float steppedPattern = sin(pattern.x) + sin(pattern.y) + cos(pattern.z);
            steppedPattern = smoothstep(0.0, 3.2, steppedPattern);
            return steppedPattern;
          }

          ${shader.vertexShader.replace('}', `
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);

            float pattern = getFractalPattern(uv * uUvZoom) * uMaxElevation;

            bool inBetween = isInBetween(modelPosition.x, uWaveControlVectorA.x, uWaveControlVectorB.x);

            if(inBetween)
            {
              float normalizedPattern = pattern / uMaxElevation;
              vPattern = normalizedPattern;
            }
            else
            {
              float factor = 0.0;
              if(modelPosition.x <= uWaveControlVectorA.x && modelPosition.x <= uWaveControlVectorB.x)
              {
                float distanceA = abs(uWaveControlVectorA.x - modelPosition.x);
                float span = abs(uWaveControlVectorA.x - -uMidRadius);
                factor = distanceA / span;
              }
              else if(modelPosition.x >= uWaveControlVectorB.x && modelPosition.x >= uWaveControlVectorA.x)
              {
                float distanceB = abs(uWaveControlVectorB.x - modelPosition.x);
                float span = abs(uWaveControlVectorB.x - uMidRadius);
                factor = distanceB / span;
              }

              factor = smoothstep(0.0, uSmoothing, factor);

              // if near mouse intersect point
              if(uEnableInteraction)
              {
                float chordLength = abs(distance(modelPosition.xyz, uIntersectPoint));
                float interactiveElevation = 1.0 - (chordLength / uInteractionRadius);
                interactiveElevation = smoothstep(uSmoothing, 0.0, interactiveElevation);

                factor = factor > interactiveElevation ? interactiveElevation : factor;
              }

              pattern = pattern - (pattern * factor);
              // float normalizedPattern = clamp(pattern / uMaxElevation, 0.5, 1.0);
              float normalizedPattern = pattern / uMaxElevation;
              vPattern = normalizedPattern;
            }

            Spherical spherical = cartesianToSpherical(modelPosition.xyz);
            spherical.radius += pattern;
            vec3 updatedPosition = sphericalToCartesian(spherical);

            modelPosition.x = updatedPosition.x;
            modelPosition.y = updatedPosition.y;
            modelPosition.z = updatedPosition.z;

            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            gl_Position = projectedPosition;
          }`)}
        `;
        shader.fragmentShader = `
          uniform vec3 uSurfaceColor;
          uniform vec3 uDepthColor;

          varying float vPattern;

          ${shader.fragmentShader.replace(
            'vec4 diffuseColor = vec4( diffuse, opacity );',
            `
              vec3 color = mix(uDepthColor, uSurfaceColor, vPattern);
              vec4 diffuseColor = vec4(color, opacity);
            `
          )}
        `;
        this.material.userData.shader = shader;
      }
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.group.add(this.mesh);

      this.worldPosition = new THREE.Vector3();

      if(this.parameters.showControlPoints) {
        this.axes = [
          new THREE.AxesHelper(10),
          new THREE.AxesHelper(10),
        ];
        for(const axes of this.axes) {
          this.group.add(axes);
        }
      }

      if(this.parameters.debug) {
        this.debugRaycasterBox = new THREE.Mesh(
          new THREE.BoxBufferGeometry(1, 1, 1),
          new THREE.MeshNormalMaterial()
        );
        this.group.add(this.debugRaycasterBox);
        this.group.add(new THREE.PlaneHelper(this.raycastPlane, 0xffff00));
      }
    },
    updateSphereCenter: function() {
      this.mesh.getWorldPosition(this.worldPosition);
      this.raycastSphere.center.copy(this.worldPosition);
    },
    update: function() {
      const elapsedTime = this.clock.getElapsedTime();

      // TODO: We need boolean to check if cursor hovers over sphere.
      // This is separate from the Sphere math because such intersection
      // persists. We need a checker if it still intersects or not.

      const intersectsSphere = this.raycaster.ray.intersectSphere(this.raycastSphere, this.intersectPoint);
      if(!intersectsSphere) {
        this.raycaster.ray.intersectPlane(this.raycastPlane, this.intersectPoint);
      }
      if(this.parameters.debug) {
        this.debugRaycasterBox.position.copy(this.intersectPoint);
        this.debugRaycasterBox.lookAt(this.raycastSphere.center);
      }

      if(this.material.userData.shader)
      {
        this.material.userData.shader.uniforms.uTime.value = elapsedTime;
        this.material.userData.shader.uniforms.uIntersectPoint.value = this.intersectPoint;
        this.material.userData.shader.uniforms.uWaveControlVectorA.value = this.parameters.controlPoint1;
        this.material.userData.shader.uniforms.uWaveControlVectorB.value = this.parameters.controlPoint2;

        if(this.parameters.showControlPoints) {
          this.axes[0].position.copy(this.parameters.controlPoint1);
          this.axes[1].position.copy(this.parameters.controlPoint2);
        }
      }
    }
  }
}

export { createShaderRipplingSphere };
