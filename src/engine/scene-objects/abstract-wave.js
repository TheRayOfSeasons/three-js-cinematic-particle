import {
  Clock,
  Color,
  DoubleSide,
  Group,
  ShaderMaterial,
  PlaneBufferGeometry,
  Vector2,
  Vector3,
  Raycaster,
  UniformsUtils,
  UniformsLib,
  LineSegments,
  BoxGeometry,
  Mesh,
  Plane,
  MeshNormalMaterial,
  PlaneHelper,
} from 'three';
import anime from 'animejs/lib/anime.es.js';
import { MonoBehaviour, SceneObject } from '../core/behaviour';
import { CustomMath, ShaderUtils  } from '../core/utils';
import { Size } from '../constants';

/**
 * A local modification for PlaneBufferGeometries that
 * is used to allow the grid-like look when the geometry
 * is used for LineSegments.
 **/
Object.assign(PlaneBufferGeometry.prototype, {
  toGrid: function() {
    let segmentsX = this.parameters.widthSegments || 1;
    let segmentsY = this.parameters.heightSegments || 1;
    let indices = [];
    for (let i = 0; i < segmentsY + 1; i++) {
      let index11 = 0;
      let index12 = 0;
      for (let j = 0; j < segmentsX; j++) {
        index11 = (segmentsX + 1) * i + j;
        index12 = index11 + 1;
        let index21 = index11;
        let index22 = index11 + (segmentsX + 1);
        indices.push(index11, index12);
        if (index22 < ((segmentsX + 1) * (segmentsY + 1) - 1)) {
          indices.push(index21, index22);
        }
      }
      if ((index12 + segmentsX + 1) <= ((segmentsX + 1) * (segmentsY + 1) - 1)) {
        indices.push(index12, index12 + segmentsX + 1);
      }
    }
    this.setIndex(indices);
    return this;
  }
});


const clock = new Clock();

/**
 * Handles all the logic for allowing a plane to animate
 * in a constant wavey manner.
 */
class WaveShaderHandler extends MonoBehaviour {
  parameters = {
    minDiveDepth: 0.5,
    maxDiveDepth: 0.57,
    panLimit: 0.0005,
    easingAcceleration: 0.0085,
    dependentOnLights: true,
    pauseThreshold: 1300, // pause animation when scrollY is greater than threshold
    debug: false
  }

  subscribeToMousePosition() {
    this.mousePosition = new Vector2();
    this.raycaster = new Raycaster();
    window.addEventListener('mousemove', event => {
      this.mousePosition.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mousePosition.y = -(event.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mousePosition, this.scene.currentCamera);
    });
  }

  subscriptToScrollPosition() {
    this.scrollPosition = 0;
    this.yScrollPercentage = 0;
    this.scrollY = 0;
    window.addEventListener('scroll', event => {
      // so we catch all browsers
      const scrollTop = window.pageYOffset || (document.documentElement || document.body.parentNode || document.body).scrollTop;
      this.scrollY = scrollTop;
    });
  }

  initScrollTimeline() {
    this.timeline = anime.timeline({
      autoplay: false,
      duration: 4500,
      easing: 'easeOutSine'
    });
    this.timeline.add({
      targets: this.mesh.rotation,
      x: -Math.PI * this.parameters.maxDiveDepth,
      duration: 500,
      update: this.scene.currentCamera.updateProjectionMatrix()
    });
  }

  start() {
    this.group = new Group();
    this.subscribeToMousePosition();
    this.subscriptToScrollPosition();
    this.geometry = new PlaneBufferGeometry(15, 4, 288, 72).toGrid();
    this.shaderMaterial = new ShaderMaterial({
      uniforms: UniformsUtils.merge([
        UniformsLib.lights,
        {
          uTime: { value: 0 },
          uFrequency: { value: new Vector2(10, 5) },
          uBigWavesElevation: { value: 0.09 },
          uBigWavesFrequency: { value: new Vector2(4, 3) },
          uBigWavesSpeed: { value: 0.5 },
          uSmallWavesElevation: { value: 0.15 },
          uSmallWavesFrequency: { value: 3.0 },
          uSmallWavesSpeed: { value: 0.5 },
          uMaxBigWavesSpeed: { value: 5.0 },
          uMaxWavesInterval: { value: 30.0 },
          uDepthColor: { value: new Color('#0e0ea8') },
          uSurfaceColor: { value: new Color('#60a1c4') },
          uColorOffset: { value: 0.05 },
          uColorMultiplier: { value: 5 },
          uCalmingAxis: { value: new Vector3(0.0, 0.0, 1.75), },
          uPointSize: { value: 2.0 },
          uCameraPosition: { value: this.scene.currentCamera.position },
          uMousePosition: { value: this.mousePosition },
          uMouseBulgeElevation: { value: 0.75 },
          uMouseBulgeRadius: { value: 0.25 },
        },
      ]),
      vertexShader: `
        uniform float uTime;
        uniform float uBigWavesElevation;
        uniform float uBigWavesSpeed;
        uniform float uSmallWavesElevation;
        uniform float uSmallWavesFrequency;
        uniform float uSmallWavesSpeed;
        uniform float uMaxBigWavesSpeed;
        uniform float uMaxWavesInterval;
        uniform float uPointSize;
        uniform float uMouseBulgeElevation;
        uniform float uMouseBulgeRadius;
        uniform vec3 uMousePosition;
        uniform vec3 uCalmingAxis;
        uniform vec3 uCameraPosition;
        uniform vec2 uFrequency;
        uniform vec2 uBigWavesFrequency;

        varying float vElevation;
        varying vec3 vPos;
        varying vec3 vNormal;

        ${ShaderUtils.cnoise()}

        void main()
        {
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          float distanceFromCalmingAxis = (distance(uCalmingAxis, vec3(0.0, 0.0, modelPosition.z)));
          float waveOffsetByDistance = 1.0 / distanceFromCalmingAxis;
          float bigWaveOffset = (
            clamp(uBigWavesSpeed * waveOffsetByDistance, -uMaxBigWavesSpeed, uMaxBigWavesSpeed)
            * uMaxWavesInterval
          );
          float elevationX = sin(
            modelPosition.x
            * (uBigWavesFrequency.x * waveOffsetByDistance)
            + bigWaveOffset
            + uTime / 2.0
          );
          float elevationZ = sin(
            modelPosition.z
            * (uBigWavesFrequency.y * waveOffsetByDistance)
            + bigWaveOffset
            + uTime / 2.0
          );
          float elevation = elevationX * elevationZ * uBigWavesElevation;
          elevation -= abs(
            cnoise(
              vec3(
                modelPosition.xz * (uSmallWavesFrequency * waveOffsetByDistance),
                uTime * uSmallWavesSpeed
              )
            ) * (uSmallWavesElevation * waveOffsetByDistance)
          );

          modelPosition.y += elevation;

          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;
          gl_PointSize = uPointSize / -viewPosition.z;

          gl_Position = projectedPosition;

          vPos = (modelMatrix * vec4(position, 1.0 )).xyz;
          vNormal = normalMatrix * normal;

          vElevation = elevation;
        }
      `,
      fragmentShader: `
        precision mediump float;

        uniform vec3 uDepthColor;
        uniform vec3 uSurfaceColor;
        uniform float uColorOffset;
        uniform float uColorMultiplier;

        varying float vElevation;
        varying vec3 vPos;
        varying vec3 vNormal;

        ${this.parameters.dependentOnLights ? `
          struct PointLight {
            vec3 position;
            vec3 color;
          };
          uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
        ` : ''}

        void main()
        {
          ${this.parameters.dependentOnLights ? `
            vec4 addedLights = vec4(0.1, 0.1, 0.1, 1.0);
            for(int l = 0; l < NUM_POINT_LIGHTS; l++) {
              vec3 adjustedLight = pointLights[l].position + cameraPosition;
              vec3 lightDirection = normalize(vPos - adjustedLight);
              addedLights.rgb += clamp(dot(-lightDirection, vNormal), 0.0, 1.0) * pointLights[l].color;
            }
          ` : ''}

          float mixStrength = (vElevation + uColorOffset) * uColorMultiplier;
          vec3 color = mix(uDepthColor, uSurfaceColor, mixStrength);
          vec4 mixColor = vec4(color, 1.0);
          ${
            this.parameters.dependentOnLights
              ? 'gl_FragColor = mix(vec4(mixColor.x, mixColor.y, mixColor.z, 1.0), addedLights, addedLights);'
              : 'gl_FragColor = mixColor;'
          }
        }
      `,
      side: DoubleSide,
      transparent: true,
      lights: true,
    });
    this.mesh = new LineSegments(this.geometry, this.shaderMaterial);
    this.mesh.rotation.x = - Math.PI * this.parameters.minDiveDepth;
    this.mesh.position.set(0, 0, -0.75);
    this.raycastPlane = new Plane(new Vector3(0, 1, 1.5), 0);

    this.intersectPoint = new Vector3();
    this.group.add(this.mesh);

    this.lookAtGroup = new Group();
    this.lerpingGroup = new Group();

    this.coreGroup = new Group();
    this.coreGroup.add(this.lookAtGroup);
    this.coreGroup.add(this.lerpingGroup);
    this.coreGroup.add(this.group);

    if(this.parameters.debug) {
      this.refGroup = new Group();
      this.refGroup.position.set(0, 0, -0.5);
      const planeHelper = new PlaneHelper(this.raycastPlane, 1, 0xffff00);
      this.group.add(planeHelper);
      const boxGeom = new BoxGeometry(0.1, 0.1, 0.1);
      const boxMat = new MeshNormalMaterial();
      const refMesh = new Mesh(boxGeom, boxMat);
      this.refGroup.add(refMesh);
      const boxGeom2 = new BoxGeometry(0.1, 0.1, 0.1);
      const boxMat2 = new MeshNormalMaterial();
      const lookAtMesh = new Mesh(boxGeom2, boxMat2);
      this.lookAtGroup.add(lookAtMesh);
      const boxGeom3 = new BoxGeometry(0.1, 0.1, 0.1);
      const boxMat3 = new MeshNormalMaterial();
      const lerpingMesh = new Mesh(boxGeom3, boxMat3);
      this.lerpingGroup.add(lerpingMesh);
      this.coreGroup.add(this.refGroup);
    }

    this.initScrollTimeline();
  }

  update(time) {
    // pause animation when beyond scrolling threshold to optimize
    if(this.scrollY > this.parameters.pauseThreshold)
      return;

    // update time
    const elapsedTime = clock.getElapsedTime();
    this.shaderMaterial.uniforms.uTime.value = elapsedTime;

    // Sinking effect when scrolling down
    this.yScrollPercentage = CustomMath.lerp(this.yScrollPercentage, this.scrollY, 0.08);
    this.timeline.seek(this.yScrollPercentage);

    // Pan camera on mouse move
    this.raycaster.ray.intersectPlane(this.raycastPlane, this.intersectPoint);
    const panLimit = this.parameters.panLimit;
    this.lerpingGroup.position.lerp(
      new Vector3(
        CustomMath.clamp(this.intersectPoint.x, -panLimit, panLimit),
        CustomMath.clamp(this.intersectPoint.y, -panLimit, panLimit),
        CustomMath.clamp(this.intersectPoint.z, -panLimit, panLimit),
      ),
      this.parameters.easingAcceleration
    );
    this.group.lookAt(new Vector3(
      this.lerpingGroup.position.x,
      this.lerpingGroup.position.y,
      4.0
    ));
    if(this.parameters.debug) {
      this.refGroup.lookAt(this.lerpingGroup.position);
      this.lookAtGroup.position.x = this.intersectPoint.x;
      this.lookAtGroup.position.y = this.intersectPoint.y;
      this.lookAtGroup.position.z = this.intersectPoint.z;
    }
  }

  exportAsSceneObject() {
    return this.coreGroup;
  }
}

/**
 * An animated plane that moves in a constant wavey manner.
 */
export class AbstractWave extends SceneObject {
  monobehaviours = {
    WaveShaderHandler
  }
}
