import * as THREE from 'three';

function fillWithPoints(geometry, count) {

  var ray = new THREE.Ray()

  var size = new THREE.Vector3();
  geometry.computeBoundingBox();
  let bbox = geometry.boundingBox;

  let points = [];

  var dir = new THREE.Vector3(1, 1, 1).normalize();
  for (let i = 0; i < count; i++) {
    let p = setRandomVector(bbox.min, bbox.max);
    points.push(p);
  }

  function setRandomVector(min, max){
    let v = new THREE.Vector3(
      THREE.Math.randFloat(min.x, max.x),
      THREE.Math.randFloat(min.y, max.y),
      THREE.Math.randFloat(min.z, max.z)
    );
    if (!isInside(v)){return setRandomVector(min, max);}
    return v;
  }

  function isInside(v){

    ray.set(v, dir);
    let counter = 0;

    let pos = geometry.attributes.position;
    let faces = pos.count / 3;
    let vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3();

    for(let i = 0; i < faces; i++){
      vA.fromBufferAttribute(pos, i * 3 + 0);
      vB.fromBufferAttribute(pos, i * 3 + 1);
      vC.fromBufferAttribute(pos, i * 3 + 2);
      if (ray.intersectTriangle(vA, vB, vC)) counter++;
    }

    return counter % 2 == 1;
  }

  return new THREE.BufferGeometry().setFromPoints(points);
}

const oldShader = `
  float rand(float n){return fract(sin(n) * 43758.5453123);}

  float noise(float p)
  {
    float fl = floor(p);
    float fc = fract(p);
    return mix(rand(fl), rand(fl + 1.0), fc);
  }

  void main()
  {
    float initialSinWaveValue = abs(1.15 * sin(vLightFactor * 10.0));
    float noiseResult = noise(initialSinWaveValue);
    float mixStrength = clamp(initialSinWaveValue, 0.1, 0.9);
    vec3 color = mix(uColor, uMaxColor, mixStrength);
    gl_FragColor = vec4(color, 1.0);
  }
`

const truchet1 = `
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uMaxColor;

  varying float vLightFactor;
  varying float vVertexIndexId;
  varying vec2 vUv;

  // noise
  float Hash21(vec2 p)
  {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  void main()
  {
    vec2 uv = vUv;
    vec3 color = vec3(0);
    float zoom = 50.0;
    uv *= zoom;
    uv += uTime * 0.2;
    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);
    float randomNumber = Hash21(id);
    if(randomNumber < 0.5)
    {
      gv.x *= -1.0;
    }
    float width = 0.1;
    float distance = abs(abs(gv.x + gv.y) - 0.5);
    float mask = smoothstep(0.01, -0.01, distance - width);
    color += mask;

    // if(gv.x > 0.48 || gv.y > 0.48)
    // {
    //   color = vec3(1, 0, 0);
    // }

    gl_FragColor = vec4(color, 1.0);
  }
`;

const truchet2 = `
// https://www.youtube.com/watch?v=2R7h76GoIJM
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uMaxColor;

  varying float vLightFactor;
  varying float vVertexIndexId;
  varying vec2 vUv;

  // noise
  float Hash21(vec2 p)
  {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  void main()
  {
    vec2 uv = vUv;
    vec3 color = vec3(0);
    float zoom = 50.0;
    uv *= zoom;
    uv += uTime * 0.2;
    // gv = grid uv
    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);
    float randomNumber = Hash21(id);
    if(randomNumber < 0.5)
    {
      gv.x *= -1.0;
    }
    float width = 0.1;
    float distance = abs(abs(gv.x + gv.y) - 0.5);

    // explnation: 0.001 prevents sign from returning 0
    // sign returns -1, 0, or 1
    // this modification is responsible for the curved truchet
    vec2 circleUv = gv - sign(gv.x + gv.y + 0.001) * 0.5;
    distance = length(circleUv) - 0.5;
    float mask = smoothstep(0.01, -0.01, abs(distance) - width);
    float angle = atan(circleUv.x, circleUv.y); // an angle within -pi to pi

    // so that every other uv animates in a different direction
    // this is so the movement is uniform
    // basically a checkerboard pattern
    // why "* 2.0 - 1.0" https://youtu.be/2R7h76GoIJM?t=1473
    float checker = mod(id.x + id.y, 2.0) * 2.0 - 1.0; // a number within -1 to 1
    float flowSpeed = 2.0;
    float flow = sin((uTime * flowSpeed) + checker * angle * 10.0);

    color += flow * mask;

    // if(gv.x > 0.48 || gv.y > 0.48)
    // {
    //   color = vec3(1, 0, 0);
    // }

    gl_FragColor = vec4(color, 1.0);
  }
`;

const hexShader = `
// https://www.youtube.com/watch?v=2R7h76GoIJM
  uniform float uTime;
  uniform vec3 uColor;
  uniform vec3 uMaxColor;

  varying float vLightFactor;
  varying float vVertexIndexId;
  varying vec2 vUv;

  // noise
  float Hash21(vec2 p)
  {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  vec2 UseQuatraticTile(vec2 uv)
  {
    return fract(uv) - 0.5;
  }

  vec2 UseHexagonalTile(vec2 uv)
  {
    vec2 r = vec2(1, 1.73);
    vec2 h = r * 0.5;
    vec2 a = mod(uv, r) - h;
    vec2 b = mod(uv - h, r) -h;

    vec2 gv;
    if(length(a) < length(b))
      gv = a;
    else
      gv = b;
    return gv;
  }

  // Return the uv's distance from the center
  float GetHexDistance(vec2 uv)
  {
    uv = abs(uv);
    float c = dot(uv, normalize(vec2(1, 1.173)));
    c = max(c, uv.x);
    return c;
  }

  // Return the uv's distance from the nearest edge
  float GetHexDistanceFromEdge(vec2 uv)
  {
    float distance = GetHexDistance(uv);
    return 0.5 - distance;
  }

  vec4 GetHexCoords(vec2 uv)
  {
    vec2 gv = UseHexagonalTile(uv);
    vec2 id = uv - gv;
    float x = atan(gv.x, gv.y);
    float y = GetHexDistanceFromEdge(gv);
    vec4 hexCoords = vec4(x, y, id.x, id.y);
    return hexCoords;
  }

  void main()
  {
    vec2 uv = vUv;
    vec3 color = vec3(0);
    float zoom = 10.0;

    uv *= zoom;
    uv += uTime * 0.2;
    uv *= 5.0;
    vec4 hexCoords = GetHexCoords(uv+100.);
    float c = smoothstep(0.01, 0.1, hexCoords.y * sin(hexCoords.z * hexCoords.w + uTime));
    color += c;

    gl_FragColor = vec4(color, 1.0);
  }
`

const createAnimatedCell = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const textureLoader = new THREE.TextureLoader();
      const cellTextureMap = textureLoader.load('/2d-cnoise.png');

      this.outerSphereShaderMaterial = new THREE.ShaderMaterial({
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
        // blending: THREE.AdditiveBlending,
        // transparent: false,
        // alphaTest: true
      });

      const outerSphereGeometry = new THREE.SphereBufferGeometry(5, 64, 64);
      const vertexCount = outerSphereGeometry.attributes.position.array.length;
      const lightFactors = new Float32Array(vertexCount);
      const vertexIndexIDs = new Float32Array(vertexCount);
      for(let i = 0; i < outerSphereGeometry.attributes.position.array.length; i++) {
        lightFactors[i] = Math.random();
        vertexIndexIDs[i] = i;
      }
      outerSphereGeometry.setAttribute('lightFactor', new THREE.BufferAttribute(lightFactors, 1));
      outerSphereGeometry.setAttribute('vertexIndexId', new THREE.BufferAttribute(vertexIndexIDs, 1));
      const outerSphereMaterial = new THREE.MeshLambertMaterial({
        map: cellTextureMap,
        color: '#2e740e',
        depthWrite: false,
        transparent: true,
        opacity: 0.75,
      });
      const outerSphereMesh = new THREE.Mesh(outerSphereGeometry, this.outerSphereShaderMaterial);
      this.group.add(outerSphereMesh);

      // const innerSphereGeometry = new THREE.SphereBufferGeometry(0.15, 32, 32);
      // const innerSphereMaterial = new THREE.MeshLambertMaterial({
      //   color: '#3bb900',
      //   transparent: true,
      //   opacity: 0.95
      // });
      // const innerSphereMesh = new THREE.Mesh(innerSphereGeometry, innerSphereMaterial);
      // this.group.add(innerSphereMesh);

      this.group.add(this.rotatingGroup);
    },
    update: function(time) {
      const elapsedTime = this.clock.getElapsedTime();
      this.outerSphereShaderMaterial.uniforms.uTime.value = elapsedTime;
      this.outerSphereShaderMaterial.uniforms.uAlphaT.value += 1;
      // this.group.rotation.y = elapsedTime * 0.5;
    }
  }
}

export { createAnimatedCell };
