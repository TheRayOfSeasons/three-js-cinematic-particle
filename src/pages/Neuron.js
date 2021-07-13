import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const createAnimatedNeuron = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const loader = new GLTFLoader();

      this.neuronShader = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0.0 },
          uColor: { value: new THREE.Color('#c47e16') }
        },
        vertexShader: `
          varying vec2 vUv;

          void main()
          {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uColor;

          void mainImage(out vec4 fragColor, in vec2 fragCoord)
          {
            vec3 color = uColor;
            fragColor = vec4(color, 1.0);
          }

          void main()
          {
            mainImage(gl_FragColor, gl_FragCoord.xy);
          }
        `
      });

      const tempMaterial = new THREE.MeshLambertMaterial({ color: '#c47e16' })

      loader.load('/models/neuron-modded.glb', object => {
        object.scene.traverse(child => {
          if(child.isMesh) {
            child.material = tempMaterial;
            this.rotatingGroup.add(child);
          }
        });
      });

      this.group.add(this.rotatingGroup);
      this.group.rotation.z = Math.PI * 0.15;
    },
    update: function(time) {
      const elapsedTime = this.clock.getElapsedTime();
      this.neuronShader.uniforms.uTime.value = elapsedTime;
      // this.rotatingGroup.rotation.x = time * 0.001;
    }
  }
}

export { createAnimatedNeuron };
