import {
  Clock,
  Color,
  Group,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Plane,
  Raycaster,
  Sphere,
  SphereBufferGeometry,
  Vector2,
  Vector3
} from 'three';
import { MonoBehaviour, SceneObject } from '../core/behaviour';
import { isMobile } from '../core/utils';
import { rippleShader } from '../shaders/ripples';

class RipplingSphere extends MonoBehaviour {
  group = new Group();
  clock = new Clock();
  parameters = {
    debug: false,
    radius: 1,
    interactionEasing: 0.1,
  };
  material = new MeshStandardMaterial({ color: '#a9a9a9' });

  subscribeToMousePosition() {
    this.mousePosition = new Vector2();
    this.raycaster = new Raycaster();
    this.raycastPlane = new Plane(new Vector3(0, 0, 1), -4);
    this.raycastSphere = new Sphere(new Vector3(), this.parameters.radius);
    this.intersectPoint = new Vector3();
    this.easingPosition = new Object3D();
    this.group.add(this.easingPosition);
    this.mouseMoveInitiated = false;
    window.addEventListener('mousemove', event => {
      this.mouseMoveInitiated = true;
      this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mousePosition, this.scene.currentCamera);
    });
  }

  start() {
    this.subscribeToMousePosition();

    const segments = isMobile() ? 256 : 768;
    this.geometry = new SphereBufferGeometry(this.parameters.radius, segments, segments);

    const webglVersion = this.scene.renderer.capabilities.isWebGL2;

    this.material.onBeforeCompile = shader => {
      shader.uniforms.uInteractionRadius = { value: 6.0 };
      shader.uniforms.uMaxElevation = { value: 0.65 };
      shader.uniforms.uMidRadius = { value: this.parameters.radius };
      shader.uniforms.uSmoothing = { value: 0.66 };
      shader.uniforms.uSpeed = { value: 0.05 };
      shader.uniforms.uTime = { value: 0.0 };
      shader.uniforms.uUvZoom = { value: 8.7 };
      shader.uniforms.uSurfaceColor = { value: new Color('#c1c1c1') };
      shader.uniforms.uDepthColor = { value: new Color('#b2b2b2') };
      shader.vertexShader = `
        const float RADIANS_TO_DEGREES = 57.29577951308232;
        const float PI = 3.141592653589793;

        uniform float uInteractionRadius;
        uniform float uMaxElevation;
        uniform float uMidRadius;
        uniform float uSmoothing;
        uniform float uSpeed;
        uniform float uTime;
        uniform float uUvZoom;

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

        ${rippleShader(webglVersion ? 2 : 1)}

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

          float normalizedPattern = pattern / uMaxElevation;
          vPattern = normalizedPattern;

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
    this.mesh = new Mesh(this.geometry, this.material);
    this.group.add(this.mesh);
  }

  update(time) {
    if(!this.material.userData.shader)
      return;
    const elapsedTime = this.clock.getElapsedTime();
    this.material.userData.shader.uniforms.uTime.value = elapsedTime;
  }

  exportAsSceneObject() {
    return this.group;
  }
}

export class AnimatedRipplingSphere extends SceneObject {
  monobehaviours = {
    RipplingSphere
  }
}
