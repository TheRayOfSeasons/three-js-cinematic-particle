import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
// import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass';

import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  Group,
  LinearFilter,
  MeshBasicMaterial,
  MeshNormalMaterial,
  RGBAFormat,
  ShaderMaterial,
  TextGeometry,
  Texture,
  UniformsUtils,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";

import { Pass } from "three/examples/jsm/postprocessing/Pass";

// typescript definitions doesn't have FullScreenQuad
//@ts-ignore
import { FullScreenQuad } from "three/examples/jsm/postprocessing/Pass";

import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
import { LuminosityHighPassShader } from "three/examples/jsm/shaders/LuminosityHighPassShader.js";

/**
 * Thanks to https://github.com/mrdoob/three.js/issues/14104#issuecomment-429664412 for this fragmentShaderfix
 * 
 * UnrealBloomPass is inspired by the bloom pass of Unreal Engine. It creates a
 * mip map chain of bloom textures and blurs them with different radii. Because
 * of the weighted combination of mips, and because larger blurs are done on
 * higher mips, this effect provides good quality and performance.
 *
 * Reference:
 * - https://docs.unrealengine.com/latest/INT/Engine/Rendering/PostProcessEffects/Bloom/
 */
class UnrealBloomPass extends Pass {
  strength: number;
  radius: number;
  threshold: number;
  resolution: Vector2;
  clearColor: Color;
  renderTargetsHorizontal: any[];
  renderTargetsVertical: any[];
  nMips: number;
  renderTargetBright: WebGLRenderTarget;
  highPassUniforms: any;
  materialHighPassFilter: ShaderMaterial;
  separableBlurMaterials: any[];
  compositeMaterial: ShaderMaterial;
  bloomTintColors: Vector3[];
  copyUniforms: any;
  materialCopy: ShaderMaterial;
  _oldClearColor: Color;
  oldClearAlpha: number;
  basic: MeshBasicMaterial;
  fsQuad: Pass.FullScreenQuad;
  static BlurDirectionX: any;
  static BlurDirectionY: any;
  constructor(resolution: Vector2, strength: number, radius: number, threshold: number) {
    super();

    this.strength = strength !== undefined ? strength : 1;
    this.radius = radius;
    this.threshold = threshold;
    this.resolution =
      resolution !== undefined
        ? new Vector2(resolution.x, resolution.y)
        : new Vector2(256, 256);

    // create color only once here, reuse it later inside the render function
    this.clearColor = new Color(0, 0, 0);

    // render targets
    const pars = {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      format: RGBAFormat,
    };
    this.renderTargetsHorizontal = [];
    this.renderTargetsVertical = [];
    this.nMips = 5;
    let resx = Math.round(this.resolution.x / 2);
    let resy = Math.round(this.resolution.y / 2);

    this.renderTargetBright = new WebGLRenderTarget(resx, resy, pars);
    this.renderTargetBright.texture.name = "UnrealBloomPass.bright";
    this.renderTargetBright.texture.generateMipmaps = false;

    for (let i = 0; i < this.nMips; i++) {
      const renderTargetHorizonal = new WebGLRenderTarget(resx, resy, pars);

      renderTargetHorizonal.texture.name = "UnrealBloomPass.h" + i;
      renderTargetHorizonal.texture.generateMipmaps = false;

      this.renderTargetsHorizontal.push(renderTargetHorizonal);

      const renderTargetVertical = new WebGLRenderTarget(resx, resy, pars);

      renderTargetVertical.texture.name = "UnrealBloomPass.v" + i;
      renderTargetVertical.texture.generateMipmaps = false;

      this.renderTargetsVertical.push(renderTargetVertical);

      resx = Math.round(resx / 2);

      resy = Math.round(resy / 2);
    }

    // luminosity high pass material

    if (LuminosityHighPassShader === undefined)
      console.error("THREE.UnrealBloomPass relies on LuminosityHighPassShader");

    const highPassShader = LuminosityHighPassShader;
    this.highPassUniforms = UniformsUtils.clone(highPassShader.uniforms);

    this.highPassUniforms["luminosityThreshold"].value = threshold;
    this.highPassUniforms["smoothWidth"].value = 0.01;

    this.materialHighPassFilter = new ShaderMaterial({
      uniforms: this.highPassUniforms,
      vertexShader: highPassShader.vertexShader,
      fragmentShader: highPassShader.fragmentShader,
      defines: {},
    });

    // Gaussian Blur Materials
    this.separableBlurMaterials = [];
    const kernelSizeArray = [3, 5, 7, 9, 11];
    resx = Math.round(this.resolution.x / 2);
    resy = Math.round(this.resolution.y / 2);

    for (let i = 0; i < this.nMips; i++) {
      this.separableBlurMaterials.push(
        this.getSeperableBlurMaterial(kernelSizeArray[i])
      );

      this.separableBlurMaterials[i].uniforms["texSize"].value = new Vector2(
        resx,
        resy
      );

      resx = Math.round(resx / 2);

      resy = Math.round(resy / 2);
    }

    // Composite material
    this.compositeMaterial = this.getCompositeMaterial(this.nMips);
    this.compositeMaterial.uniforms["blurTexture1"].value =
      this.renderTargetsVertical[0].texture;
    this.compositeMaterial.uniforms["blurTexture2"].value =
      this.renderTargetsVertical[1].texture;
    this.compositeMaterial.uniforms["blurTexture3"].value =
      this.renderTargetsVertical[2].texture;
    this.compositeMaterial.uniforms["blurTexture4"].value =
      this.renderTargetsVertical[3].texture;
    this.compositeMaterial.uniforms["blurTexture5"].value =
      this.renderTargetsVertical[4].texture;
    this.compositeMaterial.uniforms["bloomStrength"].value = strength;
    this.compositeMaterial.uniforms["bloomRadius"].value = 0.1;
    this.compositeMaterial.needsUpdate = true;

    const bloomFactors = [1.0, 0.8, 0.6, 0.4, 0.2];
    this.compositeMaterial.uniforms["bloomFactors"].value = bloomFactors;
    this.bloomTintColors = [
      new Vector3(1, 1, 1),
      new Vector3(1, 1, 1),
      new Vector3(1, 1, 1),
      new Vector3(1, 1, 1),
      new Vector3(1, 1, 1),
    ];
    this.compositeMaterial.uniforms["bloomTintColors"].value =
      this.bloomTintColors;

    // copy material
    if (CopyShader === undefined) {
      console.error("THREE.UnrealBloomPass relies on CopyShader");
    }

    const copyShader = CopyShader;

    this.copyUniforms = UniformsUtils.clone(copyShader.uniforms);
    this.copyUniforms["opacity"].value = 1.0;

    this.materialCopy = new ShaderMaterial({
      uniforms: this.copyUniforms,
      vertexShader: copyShader.vertexShader,
      fragmentShader: copyShader.fragmentShader,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });

    this.enabled = true;
    this.needsSwap = false;

    this._oldClearColor = new Color();
    this.oldClearAlpha = 1;

    this.basic = new MeshBasicMaterial();

    this.fsQuad = new FullScreenQuad(null);
  }

  dispose() {
    for (let i = 0; i < this.renderTargetsHorizontal.length; i++) {
      this.renderTargetsHorizontal[i].dispose();
    }

    for (let i = 0; i < this.renderTargetsVertical.length; i++) {
      this.renderTargetsVertical[i].dispose();
    }

    this.renderTargetBright.dispose();
  }

  setSize(width: number, height: number) {
    let resx = Math.round(width / 2);
    let resy = Math.round(height / 2);

    this.renderTargetBright.setSize(resx, resy);

    for (let i = 0; i < this.nMips; i++) {
      this.renderTargetsHorizontal[i].setSize(resx, resy);
      this.renderTargetsVertical[i].setSize(resx, resy);

      this.separableBlurMaterials[i].uniforms["texSize"].value = new Vector2(
        resx,
        resy
      );

      resx = Math.round(resx / 2);
      resy = Math.round(resy / 2);
    }
  }

  render(renderer: WebGLRenderer, writeBuffer: any, readBuffer: { texture: Texture; }, deltaTime: any, maskActive: any) {
    renderer.getClearColor(this._oldClearColor);
    this.oldClearAlpha = renderer.getClearAlpha();
    const oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;

    renderer.setClearColor(this.clearColor, 0);

    if (maskActive) renderer.state.buffers.stencil.setTest(false);

    // Render input to screen

    if (this.renderToScreen) {
      this.fsQuad.material = this.basic;
      this.basic.map = readBuffer.texture;

      renderer.setRenderTarget(null);
      renderer.clear();
      this.fsQuad.render(renderer);
    }

    // 1. Extract Bright Areas

    this.highPassUniforms["tDiffuse"].value = readBuffer.texture;
    this.highPassUniforms["luminosityThreshold"].value = this.threshold;
    this.fsQuad.material = this.materialHighPassFilter;

    renderer.setRenderTarget(this.renderTargetBright);
    renderer.clear();
    this.fsQuad.render(renderer);

    // 2. Blur All the mips progressively

    let inputRenderTarget = this.renderTargetBright;

    for (let i = 0; i < this.nMips; i++) {
      this.fsQuad.material = this.separableBlurMaterials[i];

      this.separableBlurMaterials[i].uniforms["colorTexture"].value =
        inputRenderTarget.texture;
      this.separableBlurMaterials[i].uniforms["direction"].value =
        UnrealBloomPass.BlurDirectionX;
      renderer.setRenderTarget(this.renderTargetsHorizontal[i]);
      renderer.clear();
      this.fsQuad.render(renderer);

      this.separableBlurMaterials[i].uniforms["colorTexture"].value =
        this.renderTargetsHorizontal[i].texture;
      this.separableBlurMaterials[i].uniforms["direction"].value =
        UnrealBloomPass.BlurDirectionY;
      renderer.setRenderTarget(this.renderTargetsVertical[i]);
      renderer.clear();
      this.fsQuad.render(renderer);

      inputRenderTarget = this.renderTargetsVertical[i];
    }

    // Composite All the mips

    this.fsQuad.material = this.compositeMaterial;
    this.compositeMaterial.uniforms["bloomStrength"].value = this.strength;
    this.compositeMaterial.uniforms["bloomRadius"].value = this.radius;
    this.compositeMaterial.uniforms["bloomTintColors"].value =
      this.bloomTintColors;

    renderer.setRenderTarget(this.renderTargetsHorizontal[0]);
    renderer.clear();
    this.fsQuad.render(renderer);

    // Blend it additively over the input texture

    this.fsQuad.material = this.materialCopy;
    this.copyUniforms["tDiffuse"].value =
      this.renderTargetsHorizontal[0].texture;

    if (maskActive) renderer.state.buffers.stencil.setTest(true);

    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(readBuffer);
      this.fsQuad.render(renderer);
    }

    // Restore renderer settings

    renderer.setClearColor(this._oldClearColor, this.oldClearAlpha);
    renderer.autoClear = oldAutoClear;
  }

  getSeperableBlurMaterial(kernelRadius: number) {
    return new ShaderMaterial({
      defines: {
        KERNEL_RADIUS: kernelRadius,
        SIGMA: kernelRadius,
      },

      uniforms: {
        colorTexture: { value: null },
        texSize: { value: new Vector2(0.5, 0.5) },
        direction: { value: new Vector2(0.5, 0.5) },
      },

      vertexShader: `varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,

      fragmentShader: `#include <common>
				varying vec2 vUv;
				uniform sampler2D colorTexture;
				uniform vec2 texSize;
				uniform vec2 direction;
				float gaussianPdf(in float x, in float sigma) {
					return 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;
				}
				void main() {\n\
          vec2 invSize = 1.0 / texSize;\
          float fSigma = float(SIGMA);\
          float weightSum = gaussianPdf(0.0, fSigma);\
          float alphaSum = 0.0;\
          vec3 diffuseSum = texture2D( colorTexture, vUv).rgb * weightSum;\
          for( int i = 1; i < KERNEL_RADIUS; i ++ ) {\
            float x = float(i);\
            float w = gaussianPdf(x, fSigma);\
            vec2 uvOffset = direction * invSize * x;\
            vec4 sample1 = texture2D( colorTexture, vUv + uvOffset);\
            vec4 sample2 = texture2D( colorTexture, vUv - uvOffset);\
            diffuseSum += (sample1.rgb + sample2.rgb) * w;\
            alphaSum += (sample1.a + sample2.a) * w;\
            weightSum += 2.0 * w;\
          }\
          gl_FragColor = vec4(diffuseSum/weightSum, alphaSum/weightSum);\n\
        }`,
    });
  }

  getCompositeMaterial(nMips: number) {
    return new ShaderMaterial({
      defines: {
        NUM_MIPS: nMips,
      },

      uniforms: {
        blurTexture1: { value: null },
        blurTexture2: { value: null },
        blurTexture3: { value: null },
        blurTexture4: { value: null },
        blurTexture5: { value: null },
        dirtTexture: { value: null },
        bloomStrength: { value: 1.0 },
        bloomFactors: { value: null },
        bloomTintColors: { value: null },
        bloomRadius: { value: 0.0 },
      },

      vertexShader: `varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
				}`,

      fragmentShader: `varying vec2 vUv;
				uniform sampler2D blurTexture1;
				uniform sampler2D blurTexture2;
				uniform sampler2D blurTexture3;
				uniform sampler2D blurTexture4;
				uniform sampler2D blurTexture5;
				uniform sampler2D dirtTexture;
				uniform float bloomStrength;
				uniform float bloomRadius;
				uniform float bloomFactors[NUM_MIPS];
				uniform vec3 bloomTintColors[NUM_MIPS];
				float lerpBloomFactor(const in float factor) {
					float mirrorFactor = 1.2 - factor;
					return mix(factor, mirrorFactor, bloomRadius);
				}
				void main() {
					gl_FragColor = bloomStrength * ( lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
						lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
						lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
						lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
						lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv) );
				}`,
    });
  }
}

UnrealBloomPass.BlurDirectionX = new Vector2(1.0, 0.0);
UnrealBloomPass.BlurDirectionY = new Vector2(0.0, 1.0);



function SphereToQuads(g) {
  let p = g.parameters;
  let segmentsX = p.widthSegments;
  let segmentsY = p.heightSegments-2;
  let mainShift = segmentsX + 1;
  let indices = [];
  for (let i = 0; i < segmentsY + 1; i++) {
    let index11 = 0;
    let index12 = 0;
    for (let j = 0; j < segmentsX; j++) {
      index11 = (segmentsX + 1) * i + j;
      index12 = index11 + 1;
      let index21 = index11;
      let index22 = index11 + (segmentsX + 1);
      indices.push(index11 + mainShift, index12 + mainShift);
      if (index22 < ((segmentsX + 1) * (segmentsY + 1) - 1)) {
        indices.push(index21 + mainShift, index22 + mainShift);
      }
    }
    if ((index12 + segmentsX + 1) <= ((segmentsX + 1) * (segmentsY + 1) - 1)) {
      indices.push(index12 + mainShift, index12 + segmentsX + 1 + mainShift);
    }
  }

  let lastIdx = indices[indices.length - 1] + 2;

  // poles
  for(let i = 0; i < segmentsX; i++){
  	//top
    indices.push(i, i + mainShift, i, i + mainShift + 1);

    // bottom
    let idx = lastIdx + i;
    let backShift = mainShift + 1;
    indices.push(idx, idx - backShift, idx, idx - backShift + 1);
  }

  g.setIndex(indices);
}

function getCenter(vectors) {
  let totalX = 0.0;
  let totalY = 0.0;
  let totalZ = 0.0;
  for(const vector of vectors) {
    totalX += vector.x;
    totalY += vector.y;
    totalZ += vector.z;
  }
  return new Vector3(
    totalX / vectors.length,
    totalY / vectors.length,
    totalZ / vectors.length,
  );
}

const LAYERS = {
  ENTIRE_SCENE: 0,
  BLOOM_SCENE: 1,
}

const materials = {};

const initializeAnimation = canvas => {
  const canvasHeight = canvas.parentElement.clientHeight;
  const canvasWidth = canvas.parentElement.clientWidth;

  const parameters = {
    maxParticleCount: 1000,
    particleCount: 600,
    radius: 800,
    effects: {
      showDots: true,
      showLines: true,
      minDistance: 100,
      limitConnections: false,
      maxConnections: 20,
      particleCount: 600
    }
  };

  const HeroAnimation = {
    createRenderer: function() {
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas
      });
      renderer.setSize(canvasWidth, canvasHeight);
      renderer.setClearColor(0x000000, 0.0);
      return renderer;
    },
    createScene: function() {
      const scene = new THREE.Scene();
      return scene;
    },
    createCamera: function() {
      const camera = new THREE.PerspectiveCamera(
        75,
        canvasWidth / canvasHeight
      );
      camera.position.z = 500;
      return camera;
    },
    animatedLines: {
      particlesData: [],
      group: new THREE.Group(),
      particlePositions: new Float32Array(parameters.maxParticleCount * 3),
      positions: new Float32Array(parameters.maxParticleCount * parameters.maxParticleCount * 3),
      colors: new Float32Array(parameters.maxParticleCount * parameters.maxParticleCount * 3),
      halfRadius: parameters.radius / 2,
      init: function() {
        const pointsMaterial = new THREE.PointsMaterial({
          color: 0xFFFFFF,
					size: 3,
					blending: THREE.AdditiveBlending,
					transparent: true,
					sizeAttenuation: false
        });
        const particles = new THREE.BufferGeometry();

        for (let i = 0; i < parameters.maxParticleCount; i ++) {
          const x = Math.random() * parameters.radius - this.halfRadius;
          const y = Math.random() * parameters.radius - this.halfRadius;
          const z = Math.random() * parameters.radius - this.halfRadius;
          this.particlePositions[i * 3] = x;
					this.particlePositions[i * 3 + 1] = y;
					this.particlePositions[i * 3 + 2] = z;
          this.particlesData.push({
            velocity: new THREE.Vector3(
              - 1 + Math.random() * 2,
              - 1 + Math.random() * 2,
              - 1 + Math.random() * 2
            ),
						numConnections: 0
          });
        }
        particles.setDrawRange(0, parameters.particleCount);
        particles.setAttribute(
          'position',
          new THREE.BufferAttribute(this.particlePositions, 3).setUsage(THREE.DynamicDrawUsage)
        );

        this.pointCloud = new THREE.Points(particles, pointsMaterial);
        this.pointCloud.visible = parameters.effects.showDots;
        this.group.add(this.pointCloud);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage)
        );
				geometry.setAttribute(
          'color',
          new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage)
        );
        geometry.computeBoundingSphere();
        geometry.setDrawRange(0, 0);
        const material = new THREE.LineBasicMaterial({
          vertexColors: true,
					blending: THREE.AdditiveBlending,
					transparent: true
        });
        this.lineMesh = new THREE.LineSegments(geometry, material);
        this.lineMesh.visible = parameters.effects.showLines;
        this.group.add(this.lineMesh);
      },
      update: function(time) {
        let vertexPos = 0;
        let colorPos = 0;
        let numConnected = 0;

        for(let i = 0; i < parameters.particleCount; i++) {
          this.particlesData[i].numConnections = 0;
        }
        for(let i = 0; i < parameters.particleCount; i++) {
          const particleData = this.particlesData[i];

          this.particlePositions[i * 3] += particleData.velocity.x;
					this.particlePositions[i * 3 + 1] += particleData.velocity.y;
					this.particlePositions[i * 3 + 2] += particleData.velocity.z;

          const xParticlePosition = this.particlePositions[i * 3];
          const yParticlePosition = this.particlePositions[i * 3 + 1];
          const zParticlePosition = this.particlePositions[i * 3 + 2];

          if(yParticlePosition < -this.halfRadius || yParticlePosition > this.halfRadius)
            particleData.velocity.y = -particleData.velocity.y;

          if(xParticlePosition < -this.halfRadius || xParticlePosition > this.halfRadius)
            particleData.velocity.x = -particleData.velocity.x;

          if(zParticlePosition < -this.halfRadius || zParticlePosition > this.halfRadius)
            particleData.velocity.z = -particleData.velocity.z;

          if(parameters.effects.limitConnections && particleData.numConnections >= parameters.effects.maxConnections)
            continue;

          // Check collision
          for(let j = i + 1; j < parameters.particleCount; j++) {
            const particleDataB = this.particlesData[j];
            if(parameters.effects.limitConnections && particleDataB.numConnections >= parameters.effects.maxConnections)
              continue;

            const dx = this.particlePositions[i * 3] - this.particlePositions[j * 3];
            const dy = this.particlePositions[i * 3 + 1] - this.particlePositions[j * 3 + 1];
            const dz = this.particlePositions[i * 3 + 2] - this.particlePositions[j * 3 + 2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if(distance < parameters.effects.minDistance) {
              particleData.numConnections++;
							particleDataB.numConnections++;

              const alpha = 1.0 - distance / parameters.effects.minDistance;

              this.positions[vertexPos++] = this.particlePositions[i * 3];
							this.positions[vertexPos++] = this.particlePositions[i * 3 + 1];
							this.positions[vertexPos++] = this.particlePositions[i * 3 + 2];

							this.positions[vertexPos++] = this.particlePositions[j * 3];
							this.positions[vertexPos++] = this.particlePositions[j * 3 + 1];
							this.positions[vertexPos++] = this.particlePositions[j * 3 + 2];

							this.colors[colorPos++] = alpha;
							this.colors[colorPos++] = alpha;
							this.colors[colorPos++] = alpha;

              // We set the next alpha so we can gradient the colors.
              this.colors[colorPos++] = alpha;
							this.colors[colorPos++] = alpha;
							this.colors[colorPos++] = alpha;

							numConnected++;
            }
          }
        }

        this.lineMesh.geometry.setDrawRange(0, numConnected * 2);
        this.lineMesh.geometry.attributes.position.needsUpdate = true;
				this.lineMesh.geometry.attributes.color.needsUpdate = true;
        this.pointCloud.geometry.attributes.position.needsUpdate = true;
        // this.group.rotation.y = time * 0.00015;
      }
    },
    init: function() {
      console.log('Begin initialization...');
      this.renderer = this.createRenderer();
      this.scene = this.createScene();

      this.animatedLines.init();
      this.scene.add(this.animatedLines.group);
      this.animatedLines.group.rotation.y = Math.PI * 0.25;

      console.log('Initialization done!');
      this.renderer.setAnimationLoop(this.update());
      console.log('Animation started!');
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        this.animatedLines.update(time);
        this.renderer.render(this.scene, this.createCamera());
      }
    }
  }

  return HeroAnimation;
}


const initializeBlurredAnimation = canvas => {
  const canvasHeight = canvas.parentElement.clientHeight;
  const canvasWidth = canvas.parentElement.clientWidth;

  const HeroAnimation = {
    createRenderer: function() {
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas
      });
      renderer.setSize(canvasWidth, canvasHeight);
      renderer.toneMappingExposure = Math.pow(1, 4);
      return renderer;
    },
    createScene: function() {
      const scene = new THREE.Scene();
      return scene;
    },
    createCamera: function() {
      const camera = new THREE.PerspectiveCamera(
        75,
        canvasWidth / canvasHeight
      );
      camera.position.z = 500;
      return camera;
    },
    sphereHero: () => {
      return {
        group: new THREE.Group(),
        rotatingGroup: new THREE.Group(),
        vertexAnimatorMaterial: new THREE.ShaderMaterial({
          uniforms: {
            uThreshold: { value: 10.5 },
            uTime: { value: 0.0 },
            uSize: { value: 3.0 },
            uTarget: { value: new THREE.Vector3(-0, 0, 0) },
            uColor: { value: new THREE.Color('#747474') },
          },
          vertexShader: `
            uniform float uSize;
            uniform float uTime;
            uniform float uThreshold;
            uniform vec3 uTarget;

            void main()
            {
              position.x = sin(uTime + position.y);
              vec4 modelPosition = modelMatrix * vec4(position, 1.0);
              // float distanceFromTarget = distance(uTarget, position);
              // if(distanceFromTarget <= uThreshold)
              // {
              // }
              // vec4 viewPosition = viewMatrix * modelPosition;
              // gl_PointSize = (uSize / viewPosition.z);
              // gl_PointSize = uSize;

              // mvPosition.x += 1.0;
              modelPosition.y = sin(uTime);

              gl_Position = projectionMatrix * modelPosition * viewMatrix;
            }
          `,
          fragmentShader: `
            uniform vec3 uColor;

            void main()
            {
              gl_FragColor = vec4(uColor, 1.0);
            }
          `,
          blending: THREE.AdditiveBlending
        }),
        target: new THREE.Vector3(-500, 0, 0),
        pointsGeometry: new THREE.SphereBufferGeometry(250, 24, 16),
        lineGeometry: new THREE.SphereBufferGeometry(250, 24, 16),
        diffuseGeometry: new THREE.SphereBufferGeometry(250, 24, 16),
        init: function(camera) {
          this.pointsGeometry.clearGroups();
          this.pointsGeometry.addGroup(0, Infinity, 0);
          this.pointsGeometry.addGroup(0, Infinity, 1);
          const pointsMaterial = new THREE.PointsMaterial({
            size: 5,
            sizeAttenuation: true,
            color: 0xffffff,
            blending: THREE.AdditiveBlending
          })
          this.pointCloudAnimatorShader = new THREE.ShaderMaterial({
            uniforms: {
              uThreshold: { value: 10.5 },
              uTime: { value: 0.0 },
              uSize: { value: 3.0 },
              uTarget: { value: new THREE.Vector3(-0, 0, 0) },
              uColor: { value: new THREE.Color('#747474') },
            },
            vertexShader: `
              uniform float uSize;
              uniform float uTime;
              uniform float uThreshold;
              uniform vec3 uTarget;
    
              void main()
              {
                position.x = smoothstep(πosition.x, 5.0, uTime);
                vec4 modelPosition = modelMatrix * vec4(position, 1.0);
                // float distanceFromTarget = distance(uTarget, position);
                // if(distanceFromTarget <= uThreshold)
                // {
                // }
                // vec4 viewPosition = viewMatrix * modelPosition;
                // gl_PointSize = (uSize / viewPosition.z);
                // gl_PointSize = uSize;
    
                // mvPosition.x += 1.0;
                // modelPosition.y = smoothstep(modelPosition.y, 5.0, uTime);
    
                gl_Position = projectionMatrix * modelPosition * viewMatrix;
              }
            `,
            fragmentShader: `
              uniform vec3 uColor;
    
              void main()
              {
                gl_FragColor = vec4(uColor, 1.0);
              }
            `,
            blending: THREE.AdditiveBlending
          });
          const pointCloud = new THREE.Points(this.pointsGeometry, [pointsMaterial]);
          this.rotatingGroup.add(pointCloud);
          pointCloud.layers.disable(LAYERS.BLOOM_SCENE);

          // SphereToQuads(this.lineGeometry);
          this.lineGeometry.clearGroups();
          this.lineGeometry.addGroup(0, Infinity, 0);
          this.lineGeometry.addGroup(0, Infinity, 1);
          const lineMaterial = new THREE.MeshBasicMaterial({ color: 0x747474, wireframe: true });
          const lineMesh = new THREE.LineSegments(this.lineGeometry, [lineMaterial]);
          this.rotatingGroup.add(lineMesh);

          this.innerSphereGeometry = new THREE.SphereBufferGeometry(100, 24, 16);
          const innerPointsMaterial = new THREE.PointsMaterial({
            size: 3,
            sizeAttenuation: true,
            color: 0xffffff,
            blending: THREE.AdditiveBlending
          })
          this.innerSphere = new THREE.Points(this.innerSphereGeometry, innerPointsMaterial);
          this.group.add(this.innerSphere);

          const translucentMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.1,
          });
          const translucentMesh = new THREE.Mesh(this.diffuseGeometry, translucentMaterial);
          // this.rotatingGroup.add(translucentMesh);

          // const light = new THREE.PointLight(0x60a1c4, 0.8); // white light
          // light.position.set(30, 100, 50);
          // this.group.add(light);

          this.rotatingGroup.layers.enable(LAYERS.ENTIRE_SCENE);

          const lightGeometry = new THREE.SphereBufferGeometry(50, 24, 16);
          const lightMaterial = new THREE.MeshBasicMaterial({
            color: '#24536d',
          });
          const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
          this.group.add(lightMesh);
          lightMesh.layers.enable(LAYERS.BLOOM_SCENE);

          this.group.add(this.rotatingGroup);
          this.group.rotation.z = -Math.PI * 0.15;

          // geometry.clearGroups();
          // geometry.addGroup(0, Infinity, 0);
          // geometry.addGroup(0, Infinity, 1);
          // const origin = new THREE.Vector3(-500, 100);
          // const direction = new Vector3();
          // direction.subVectors(new Vector3(), origin).normalize();
          // this.raycaster = new THREE.Raycaster(origin, direction);
          // this.group.add(new THREE.ArrowHelper(direction, origin, 500, 0xff0000));

          const getValueFromIndex = index => {
            return this.pointsGeometry.attributes.position.array[index];
          }

          this.movingTriangles = [];
          const loader = new THREE.FontLoader();
          let i1 = 0, i2 = 1, i3 = 2;
          const tempMat = new MeshNormalMaterial();
          // loader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', (font) => {
          //   for(let i = 0; i < this.pointsGeometry.attributes.position.array.length; i += 9) {
          //     let x1 = i;
          //     let y1 = i + 1;
          //     let z1 = i + 2;
          //     let x2 = i + 3;
          //     let y2 = i + 4;
          //     let z2 = i + 5;
          //     let x3 = i + 6;
          //     let y3 = i + 7;
          //     let z3 = i + 8;
    
          //     const points = [
          //       new Vector3(getValueFromIndex(x1), getValueFromIndex(y1), getValueFromIndex(z1)),
          //       new Vector3(getValueFromIndex(x2), getValueFromIndex(y2), getValueFromIndex(z2)),
          //       new Vector3(getValueFromIndex(x3), getValueFromIndex(y3), getValueFromIndex(z3)),
          //       new Vector3(getValueFromIndex(x1), getValueFromIndex(y1), getValueFromIndex(z1)),
          //     ];
    
          //     // temporary
          //     // const textSettings = {
          //     //   font: font,
          //     //   size: 10,
          //     //   height: 5,
          //     //   curveSegments: 1,
          //     // }
          //     // const mesh1 = new THREE.Mesh(new THREE.TextGeometry(`${i1}`, textSettings), tempMat);
          //     // mesh1.position.set(points[0].x, points[0].y, points[0].z);
          //     // this.rotatingGroup.add(mesh1);

          //     // const mesh2 = new THREE.Mesh(new THREE.TextGeometry(`${i2}`, textSettings), tempMat);
          //     // mesh2.position.set(points[1].x, points[1].y, points[1].z);
          //     // this.rotatingGroup.add(mesh2);

          //     // const mesh3 = new THREE.Mesh(new THREE.TextGeometry(`${i3}`, textSettings), tempMat);
          //     // mesh3.position.set(points[2].x, points[2].y, points[2].z);
          //     // this.rotatingGroup.add(mesh3);
          //     // this.movingTriangles.push(mesh1);
          //     // this.movingTriangles.push(mesh2);
          //     // this.movingTriangles.push(mesh3);
          //     // i1 += 3;
          //     // i2 += 3;
          //     // i3 += 3;
    
    
          //     const geometry = new THREE.BufferGeometry().setFromPoints(points);
          //     const material = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true });
          //     const mesh = new THREE.Line(geometry, material);
          //     const pointsMat = new THREE.PointsMaterial({
          //       size: 5,
          //       sizeAttenuation: true,
          //       color: 0xffffff,
          //       blending: THREE.AdditiveBlending
          //     });
          //     const meshPoints = new THREE.Points(geometry, pointsMat);
          //     const axesHelper = new THREE.AxesHelper(200);
          //     const geom = new THREE.BoxGeometry(50, 50, 50);
          //     const mat = new THREE.MeshNormalMaterial();
          //     const meshtest = new THREE.Mesh(geom, mat);
    
          //     const originalPosition = new THREE.Vector3(0, 0, 0);
          //     const triangleGroup = new THREE.Group();
          //     triangleGroup.add(meshPoints);
          //     triangleGroup.add(mesh);
          //     triangleGroup.originalPosition = originalPosition;
          //     triangleGroup.position.set(originalPosition.x, originalPosition.y, originalPosition.z);
          //     // triangleGroup.lookAt(pointCloud.position);
          //     this.movingTriangles.push(triangleGroup);
          //     this.group.add(triangleGroup);
          //     // mesh.lookAt(pointCloud);
          //     // meshPoints.add(mesh);
          //     // meshPoints.originalPosition = new Vector3(points[0].x, points[0].y, points[0].z);
          //     // meshPoints.position.set(points[0].x, points[0].y, points[0].z)
          //     // this.rotatingGroup.add(mesh);
          //     // mesh.add(meshPoints);
          //     // meshPoints.add(axesHelper);
          //     // mesh.add(meshtest);
          //   }
          // });
        },
        update: function(time, camera) {
          // this.vertexAnimatorMaterial.uniforms['uTime'].value = time;
          // this.pointCloudAnimatorShader.uniforms['uTime'].value = time;
          // let glowWorldPosition = new THREE.Vector3();
          // glowWorldPosition = this.glowMesh.getWorldPosition(glowWorldPosition);
          // let viewVector = new THREE.Vector3().subVectors(camera.position, glowWorldPosition);
          // this.glowMesh.material.uniforms.viewVector.value = viewVector;
          // for(const triangle of this.movingTriangles) {
          //   const distance = triangle.position.distanceTo(this.target);
          //   triangle.position.lerp(this.target, Math.atan2(1.5, distance));
          //   triangle.rotation.y = time * 0.0000001;
          //   if(distance < 10) {
          //     triangle.position.set(triangle.originalPosition.x, triangle.originalPosition.y, triangle.originalPosition.z);
          //   }
          // }
          this.rotatingGroup.rotation.y = time * 0.0001;
          this.innerSphere.rotation.y = -time * 0.001;
        }
      };
    },
    init: function() {
      console.log('Begin initialization...');
      this.renderer = this.createRenderer();
      this.scene = this.createScene();
      this.camera = this.createCamera();

      this.bloomLayer = new THREE.Layers();
      this.bloomLayer.set(LAYERS.BLOOM_SCENE);

      const params = {
				exposure: 1,
				bloomStrength: 5,
				bloomThreshold: 0,
				bloomRadius: 0,
			};

      const renderPass = new RenderPass(this.scene, this.camera);
      renderPass.clear = false;

      const clearPass = new ClearPass(0x000000, 0);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5,
        0.4,
        0.85
      );
			bloomPass.threshold = params.bloomThreshold;
			bloomPass.strength = params.bloomStrength;
			bloomPass.radius = params.bloomRadius;

      const bloomComposer = new EffectComposer(this.renderer);
			bloomComposer.renderToScreen = false;
      bloomComposer.addPass(clearPass);
			bloomComposer.addPass(renderPass);
			bloomComposer.addPass(bloomPass);

      const finalPass = new ShaderPass(
				new THREE.ShaderMaterial({
					uniforms: {
						baseTexture: { value: null },
						bloomTexture: { value: bloomComposer.renderTarget2.texture }
					},
					vertexShader: `
            varying vec2 vUv;

            void main()
            {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
            }
          `,
					fragmentShader: `
            uniform sampler2D baseTexture;
            uniform sampler2D bloomTexture;

            varying vec2 vUv;

            void main()
            {
              gl_FragColor = ( texture2D( baseTexture, vUv ) + vec4( 1.0 ) * texture2D( bloomTexture, vUv ) );
            }
          `,
					defines: {}
				}), "baseTexture"
			);
			finalPass.needsSwap = true;

      const finalComposer = new EffectComposer(this.renderer);
      finalComposer.addPass(clearPass);
			finalComposer.addPass(renderPass);
			finalComposer.addPass(finalPass);

      this.composers = {
        bloomComposer,
        finalComposer
      }

      this.coreGroup = new THREE.Group();
      this.sphere1 = this.sphereHero();
      this.sphere1.init(this.camera);
      this.coreGroup.add(this.sphere1.group);
      this.sphere1.group.position.z = 0;

      this.sphere2 = this.sphereHero();
      this.sphere2.init(this.camera);
      this.coreGroup.add(this.sphere2.group);
      this.sphere2.group.position.x = 1200;
      this.sphere2.group.position.z = -1000;

      this.sphere3 = this.sphereHero();
      this.sphere3.init(this.camera);
      this.coreGroup.add(this.sphere3.group);
      this.sphere3.group.position.x = -1000;
      this.sphere3.group.position.y = 500;
      this.sphere3.group.position.z = -700;

      this.scene.add(this.coreGroup);
      this.coreGroup.position.z = 800

      this.darkMaterial = new THREE.MeshBasicMaterial( { color: "black" } );
      console.log('Initialization done!');
      this.renderer.setAnimationLoop(this.update());
      console.log('Animation started!');
      this.controls = new OrbitControls(this.camera, canvas);
      this.controls.enableDamping = true;
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        this.controls.update();
        this.sphere1.update(time, this.camera);
        this.sphere2.update(time, this.camera);
        this.sphere3.update(time, this.camera);
        this.scene.traverse(obj => {
          if(this.bloomLayer.test(obj.layers) === false) {
            materials[obj.uuid] = obj.material;
            obj.material = this.darkMaterial;
          }
        });
        this.composers.bloomComposer.render();
        this.scene.traverse(obj => {
          if(materials[obj.uuid]) {
            obj.material = materials[obj.uuid];
            delete materials[obj.uuid];
          }
        })

        this.composers.finalComposer.render();
        this.coreGroup.position.lerp(new Vector3(0, 0, 0), 0.025);
        // this.renderer.render(this.scene, this.camera);
      }
    }
  }

  return HeroAnimation;
}

export const TestPage = () => {
  const canvasScene = useRef(null);
  const blurredCanvas = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      let HeroAnimation = initializeAnimation(canvasScene.current);
      HeroAnimation.init();
    }
  }, [canvasScene]);

  useEffect(() => {
    if(blurredCanvas) {
      let BlurredAnimation = initializeBlurredAnimation(blurredCanvas.current);
      BlurredAnimation.init();
    }
  }, [blurredCanvas])

  return (
    <div className="hero-container">
      <canvas ref={canvasScene} style={{
        width: '100vw',
        height: '100vh',
        position: 'absolute',
        zIndex: '-2'
      }}>
      </canvas>
      <canvas ref={blurredCanvas} className="blurred" style={{
        width: '100vw',
        height: '100vh',
        position: 'absolute',
        zIndex: '-1',
      }}>
      </canvas>
    </div>
  );
}
