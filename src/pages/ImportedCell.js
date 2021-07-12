import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const createAnimatedImportedCell = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const loader = new GLTFLoader();

      this.cellShader = new THREE.ShaderMaterial({
        uniforms: THREE.UniformsUtils.merge([
          THREE.UniformsLib.lights,
          {
            uTime: { value: 0.0 },
            uColor: { value: new THREE.Color('#65ca35') },
            uMaxColor: { value: new THREE.Color('#2e740e') },
            uSize: { value: 0.075 },
            uScale: { value: window.innerHeight / 2 },
            uInterval: { value: 10.0 },
            uLength: { value: 10.0 },
            uAlphaT: { value: 1.0 },
            uResolution: { value: new THREE.Vector3() },
          }
        ]),
        vertexShader: `
          attribute float lightFactor;
          attribute float vertexIndexId;

          uniform float uAlphaT;
          uniform float uInterval;
          uniform float uLength;
          uniform float uSize;
          uniform float uScale;
          uniform float uTime;

          varying float vLightFactor;
          varying float vVertexIndexId;
          varying vec2 vUv;
          varying vec3 vPos;
          varying vec3 vNormal;

          void main()
          {
            vec3 newPosition = vec3(
              position.x + (sin((uAlphaT + vertexIndexId) / uInterval) * (0.005 * uLength)),
              position.y + (sin((uAlphaT + vertexIndexId) / uInterval) * (0.005 * uLength)),
              position.z + (sin((uAlphaT + vertexIndexId) / uInterval) * (0.005 * uLength))
            );

            vec4 modelPosition = modelMatrix * vec4(newPosition, 1.0);

            vLightFactor = lightFactor;
            vVertexIndexId = vertexIndexId;
            vUv = uv;
            vPos = (modelMatrix * vec4(position, 1.0 )).xyz;
            vNormal = normalMatrix * normal;

            vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
            gl_PointSize = uSize * (uScale / length(mvPosition.xyz));
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * modelPosition;
          }
        `,
        fragmentShader: `
          #include <common>

          uniform float uTime;
          uniform vec3 uColor;
          uniform vec3 uMaxColor;
          uniform vec3 uResolution;

          varying float vLightFactor;
          varying float vVertexIndexId;
          varying vec2 vUv;
          varying vec3 vPos;
          varying vec3 vNormal;

          #if NUM_DIR_LIGHTS > 0
            struct DirectionalLight {
              vec3 direction;
              vec3 color;
              int shadow;
              float shadowBias;
              float shadowRadius;
              vec2 shadowMapSize;
            };
            uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
          #endif

          vec2 random2(vec2 p)
          {
            return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);
          }

          void mainImage(out vec4 fragColor, in vec2 fragCoord)
          {
            vec2 uv = vUv;
            float zoom = 10.0;

            uv *= zoom;
            uv += uTime * 0.2;
            uv *= 5.0;

            // Tile (gv)
            vec2 i_st = floor(uv);
            vec2 f_st = fract(uv);

            float m_dist = 1.0; // minimum distance

            for (int y= -1; y <= 1; y++)
            {
              for (int x= -1; x <= 1; x++)
              {
                // Neighbor place in the grid
                vec2 neighbor = vec2(float(x), float(y));

                // Random position from current + neighbor place in the grid
                vec2 point = random2(i_st + neighbor);

                // Animate the point
                point = 0.5 + 0.5 * sin(uTime + 6.2831 * point);

                // Vector between the pixel and the point
                vec2 diff = neighbor + point - f_st;

                // Distance to the point
                float dist = length(diff);

                // Keep the closer distance
                m_dist = min(m_dist, dist);
              }
            }

            // Draw the min distance (distance field)
            vec3 color = mix(uColor, uMaxColor, m_dist);

            // Draw cell center
            // color = 1.-step(.02, m_dist);

            // Draw grid
            // color.r += step(.98, f_st.x) + step(.98, f_st.y);

            // Show isolines
            // color -= step(.7,abs(sin(27.0*m_dist)))*.5;

            // lights
            float r = directionalLights[0].color.r;

            // Output to screen
            fragColor = vec4(color, 1.0);
          }

          void main()
          {
            mainImage(gl_FragColor, gl_FragCoord.xy);
          }
        `,
        lights: true,
      });

      loader.load('/models/cell3.glb', object => {
        console.log(object);
        try {
          object.scene.traverse(child => {
            if(child.isMesh) {
              console.log(child.material);
              console.log(child.geometry);
              child.geometry.clearGroups();
              child.geometry.addGroup(0, Infinity, 0);
              child.geometry.addGroup(0, Infinity, 1);
              child.material = [this.cellShader];
            }
            this.rotatingGroup.add(child);
          });
        }
        catch(error) {}
      });

      this.group.add(this.rotatingGroup);
      this.group.rotation.z = Math.PI * 0.15;
    },
    update: function(time) {
      // this.rotatingGroup.rotation.x = time * 0.001;
      const elapsedTime = this.clock.getElapsedTime();
      this.cellShader.uniforms.uTime.value = elapsedTime;
    }
  }
}

export { createAnimatedImportedCell };
