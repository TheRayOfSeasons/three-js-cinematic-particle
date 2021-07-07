import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { ClearPass } from 'three/examples/jsm/postprocessing/ClearPass';

import { CORE } from './Core';
import { UnrealBloomPass } from './UnrealBloomPass';
import { createAnimatedLines } from './AnimatedLines';
import { createSpherePoint, LAYERS, materials } from './SphereHero';
import { createTrianglePath } from './TrianglePath';

import Stats from 'stats-js';

const stats = new Stats();

const AnimatedLinesAnimation = canvas => {
  return {
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);

      this.animatedLines = createAnimatedLines();
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
        this.renderer.render(this.scene, this.camera);
      }
    }
  }
}

const SphereAnimation = canvas => {
  return {
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);

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
      this.sphere1 = createSpherePoint({ renderTriangles : true });
      this.sphere1.init(this.camera);
      this.coreGroup.add(this.sphere1.group);
      this.sphere1.group.position.z = 0;

      this.sphere2 = createSpherePoint({ renderTriangles : true });
      this.sphere2.init(this.camera);
      this.coreGroup.add(this.sphere2.group);
      this.sphere2.group.position.x = 1200;
      this.sphere2.group.position.z = -1000;

      this.sphere3 = createSpherePoint({ renderTriangles : true });
      this.sphere3.init(this.camera);
      this.coreGroup.add(this.sphere3.group);
      this.sphere3.group.position.x = -1000;
      this.sphere3.group.position.y = 500;
      this.sphere3.group.position.z = -700;

      // this.sphere1.transferTriangles(this.sphere3);
      this.trianglePath1 = createTrianglePath(this.sphere1.group.position, this.sphere2.group.position);
      this.trianglePath1.init();
      this.coreGroup.add(this.trianglePath1.group);

      this.trianglePath2 = createTrianglePath(this.sphere1.group.position, this.sphere3.group.position);
      this.trianglePath2.init();
      this.coreGroup.add(this.trianglePath2.group);

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
        stats.begin();
        this.controls.update();

        this.sphere1.update(time, this.camera);
        this.sphere2.update(time, this.camera);
        this.sphere3.update(time, this.camera);

        this.trianglePath1.update(time);
        this.trianglePath2.update(time);

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
        this.coreGroup.position.lerp(new THREE.Vector3(0, 0, 0), 0.025);
        // this.renderer.render(this.scene, this.camera);
        stats.end();
      }
    }
  }
}


export const TestPage2 = () => {
  const canvasScene = useRef(null);
  const blurredCanvas = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      let fgSpheres = AnimatedLinesAnimation(canvasScene.current);
      fgSpheres.init();
    }
  }, [canvasScene]);

  useEffect(() => {
    if(blurredCanvas) {
      let bgLines = SphereAnimation(blurredCanvas.current);
      bgLines.init();
      document.getElementById('test-stats').appendChild(stats.dom);
    }
  }, [blurredCanvas])

  return (
    <div className="hero-container">
      <div id="test-stats"></div>
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
        // position: 'absolute',
        // zIndex: '-1',
      }}>
      </canvas>
    </div>
  );
}
