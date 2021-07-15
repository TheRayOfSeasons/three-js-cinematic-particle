import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const createAnimatedNeuron = canvas => {
  return {
    canvas,
    constants: {
      WAVE_DIRECTION: {
        INWARD: 0x0,
        OUTWARD: 0x1,
      }
    },
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const loader = new GLTFLoader();

      this.brainWaveShader = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0.0 },
          uResolution: { value: new THREE.Vector3() },
          uDetailSteps: { value: 10 },
          uPointSize: { value: 5.0 },
          uScale: { value: window.innerHeight / 2 },
          uNeutralColor: { value: new THREE.Color('#00a100') },
          uPulseColor: { value: new THREE.Color('#ff0000') },
          uFrequency: { value: 5.0 },
          uSpeed: { value: 0.8 },
          uWaveDirection: { value: this.constants.WAVE_DIRECTION.OUTWARD }
        },
        vertexShader: `
          uniform float uPointSize;
          uniform float uScale;

          varying vec2 vUv;
          varying vec3 vPosition;

          void main()
          {
            vUv = uv;
            vPosition = position;

            vec4 modelPosition = modelMatrix * vec4(position, 1.0);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vec4 viewPosition = viewMatrix * modelPosition;
            gl_PointSize = uPointSize / -viewPosition.z;
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform float uFrequency;
          uniform float uSpeed;
          uniform float uTime;
          uniform int uWaveDirection;
          uniform int uDetailSteps;
          uniform vec3 uNeutralColor;
          uniform vec3 uPulseColor;
          uniform vec3 uResolution;

          varying vec2 vUv;
          varying vec3 vPosition;

          void mainImage(out vec4 fragColor, in vec2 fragCoord)
          {
            float distanceFromOrigin = distance(vPosition, vec3(0));
            float flow = uWaveDirection == 0 ? uTime * uSpeed : -(uTime * uSpeed);
            float intensity = abs(sin((distanceFromOrigin + flow) * uFrequency));
            float mixStrength = clamp(intensity, 0.1, 0.9);
            vec3 color = mix(uNeutralColor, uPulseColor, mixStrength);
            fragColor = vec4(color, 1.0);
          }

          void main()
          {
            mainImage(gl_FragColor, gl_FragCoord.xy);
          }
        `
      });

      const pointsMaterial = new THREE.PointsMaterial({
        size: 0.02,
        sizeAttenuation: true,
        color: '#ff0000'
      });

      this.meshes = [];
      loader.load('/models/neuron-modded-highpoly.glb', object => {
        object.scene.traverse(child => {
          if(child.isMesh) {
            // child.geometry.clearGroups();
            // child.geometry.addGroup(0, Infinity, 0);
            // child.geometry.addGroup(0, Infinity, 1);
            // child.material = [pointsMaterial];

            const newObject = new THREE.Mesh(child.geometry, this.brainWaveShader);
            this.meshes.push(newObject);
            this.rotatingGroup.add(newObject);
          }
        });
      });

      // const geometry = new THREE.BoxBufferGeometry(0.5, 0.5, 0.5);
      // const mesh = new THREE.Mesh(geometry, this.brainWaveShader);
      // this.group.add(mesh);

      this.group.add(this.rotatingGroup);
    },
    update: function(time) {
      const elapsedTime = this.clock.getElapsedTime();
      this.brainWaveShader.uniforms.uTime.value = elapsedTime;
      this.brainWaveShader.uniforms.uResolution.value.set(this.canvas.width, this.canvas.height, 1);
    }
  }
}

export { createAnimatedNeuron };
