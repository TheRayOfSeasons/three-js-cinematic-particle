import * as THREE from 'three';
import { ShaderUtils } from '../utils/shaders';

const noise = () => `
  float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                        vec2(12.9898,78.233)))
                * 43758.5453123);
  }

  // Value noise by Inigo Quilez - iq/2013
  // https://www.shadertoy.com/view/lsf3WH
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f*f*(3.0-2.0*f);
    return mix( mix( random( i + vec2(0.0,0.0) ),
                    random( i + vec2(1.0,0.0) ), u.x),
                mix( random( i + vec2(0.0,1.0) ),
                    random( i + vec2(1.0,1.0) ), u.x), u.y);
  }

  mat2 rotate2d(float angle){
    return mat2(cos(angle),-sin(angle),
                sin(angle),cos(angle));
  }

  float lines(in vec2 pos, float b){
    float scale = 5.0;
    pos *= scale;
    return smoothstep(0.0,
                    .5+b*.5,
                    abs((sin(pos.x*3.1415)+b*2.0))*.5);
  }
`

const createShaderPoolRipple = ({ camera }) => {
  return {
    camera,
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    parameters: {
      debug: false,
      rippleOrigins: [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 10, 0),
      ]
    },
    init: function() {
      this.geometry = new THREE.PlaneBufferGeometry(25, 25, 512, 512);
      this.geometry.rotateX(-Math.PI * 0.5);
      this.material = new THREE.ShaderMaterial({
        defines: {
          MAX_RIPPLES: this.parameters.rippleOrigins.length,
        },
        uniforms: {
          uTime: { value: 0.0 },
          uFrequency: { value: 2.0 },
          uAmplitude: { value: 0.5 },
          uRippleOrigins: { value: this.parameters.rippleOrigins },
          uSurfaceColor: { value: new THREE.Color('#e7e7e7') },
          uDepthColor: { value: new THREE.Color('#a9a9a9') },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uFrequency;
          uniform float uAmplitude;
          uniform vec3 uRippleOrigins[MAX_RIPPLES];

          varying float vElevation;
          varying vec2 vUv;
          varying vec4 vModelPosition;

          ${noise()}

          void main()
          {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);

            float xPos = modelPosition.x / 25.;
            float zPos = modelPosition.z / 25.;
            vec3 offsetedPos = vec3(xPos, 0, zPos);

            vec2 pos = offsetedPos.zx * vec2(7.0, 7.0);
            float pattern = pos.x;
            pos = rotate2d(noise(pos) + (uTime * 0.1)) * pos;
            pattern = lines(pos, 0.5);
            float elevation = pattern;

            modelPosition.y = elevation * 0.5;

            vElevation = elevation;
            vUv = uv;
            vModelPosition = modelPosition;

            vec4 viewPosition = viewMatrix * modelPosition;
            vec4 projectedPosition = projectionMatrix * viewPosition;
            gl_Position = projectedPosition;
          }
        `,
        fragmentShader: `
          uniform float uTime;
          uniform vec3 uSurfaceColor;
          uniform vec3 uDepthColor;

          varying float vElevation;
          varying vec2 vUv;
          varying vec4 vModelPosition;

          void main()
          {
            vec3 color = mix(uDepthColor, uSurfaceColor, vElevation);
            gl_FragColor = vec4(color, 1.0);
          }

        `
      });
      console.log(this.geometry.attributes);
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.group.add(this.mesh);


      if(this.parameters.debug) {
        const geometry = new THREE.BoxBufferGeometry(1, 1, 1);
        const material = new THREE.MeshNormalMaterial();
        const dummy = new THREE.Object3D();
        const instancedMesh = new THREE.InstancedMesh(geometry, material, this.parameters.rippleOrigins.length);
        instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        for(let i = 0; i < this.parameters.rippleOrigins.length; i++) {
          dummy.position.copy(this.parameters.rippleOrigins[i]);
          dummy.updateMatrix();
          instancedMesh.setMatrixAt(i, dummy.matrix);
        }
        this.group.add(instancedMesh);
      }
    },
    update: function(time) {
      const elapsedTime = this.clock.getElapsedTime();
      this.material.uniforms.uTime.value = elapsedTime;
    }
  }
}

export { createShaderPoolRipple };
