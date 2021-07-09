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

const createAnimatedCell = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const textureLoader = new THREE.TextureLoader();
      const cellTextureMap = textureLoader.load('/2d-cnoise.png');

      this.outerSphereShaderMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0.0 },
          uColor: { value: new THREE.Color('#65ca35') },
          uMaxColor: { value: new THREE.Color('#2e740e') },
          uSize: { value: 0.075 },
          uScale: { value: window.innerHeight / 2 },
          uInterval: { value: 10.0 },
          uLength: { value: 10.0 },
          uAlphaT: { value: 1.0 },
        },
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

            vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
            gl_PointSize = uSize * (uScale / length(mvPosition.xyz));
            gl_Position = projectionMatrix * viewMatrix * modelMatrix * modelPosition;
          }
        `,
        fragmentShader: `
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
            uv += uTime * 0.02;
            float zoom = 10.0;
            vec2 gv = fract(uv * zoom) - 0.5;
            // color.rg = gv;
            // color += gv.x;

            vec2 id = floor(vUv);
            float randomNumber = Hash21(id);
            if(randomNumber < 0.5)
            {
              gv.x *= -1.0;
            }
            float width = 0.1;
            float mask = smoothstep(0.01, -0.01, abs(gv.x + gv.y) - width);
            color += mask;

            // if(gv.x > 0.48 || gv.y > 0.48)
            // {
            //   color = vec3(1, 0, 0);
            // }

            gl_FragColor = vec4(color, 1.0);
          }
        `,
        transparent: false,
        alphaTest: true
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

export { createAnimatedCell  };
