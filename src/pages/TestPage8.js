import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';

import { CORE } from './Core';
import { createAnimatedImportedCell } from './ImportedCell';
import { createAnimatedImportedCellSpread } from './ImportedCellSpread';
import Stats from 'stats-js';
import { createCameraPanner } from './CameraPanner';
import { createInstancedCells } from './InstancedCells';


const stats = new Stats();

const CellAnimation = canvas => {
  return {
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 70;
      this.camera.far = 5000;
      this.camera.updateProjectionMatrix();

      this.objects = [
        (() => {
          const cells = createAnimatedImportedCellSpread(this.scene, this.camera);
          cells.init();
          this.scene.add(cells.group);
          return cells;
        })(),
        // (() => {
        //   const cells = createInstancedCells({ count: 500 });
        //   cells.init();
        //   this.scene.add(cells.group);
        //   return cells;
        // })(),
        (() => {
          const cameraPanner = createCameraPanner({
            camera: this.camera,
            panLimit: 20,
            easing: 0.03
          });
          cameraPanner.init();
          this.scene.add(cameraPanner.group);
          return cameraPanner;
        })(),
      ];

      const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
      hemiLight.position.set( 0, 200, 0 );
      this.scene.add( hemiLight );

      const dirLight = new THREE.DirectionalLight( 0xffffff );
      dirLight.position.set( 0, 200, 100 );
      dirLight.castShadow = true;
      dirLight.shadow.camera.top = 180;
      dirLight.shadow.camera.bottom = - 100;
      dirLight.shadow.camera.left = - 120;
      dirLight.shadow.camera.right = 120;
      this.scene.add( dirLight );

      console.log('Initialization done!');
      this.renderer.setAnimationLoop(this.update());
      console.log('Animation started!');

      // this.controls = new OrbitControls(this.camera, canvas);
      // this.controls.enableDamping = true;

      // postprocessing
      this.composer = new EffectComposer(this.renderer);

      const renderPass = new RenderPass(this.scene, this.camera);
      this.composer.addPass(renderPass);

      const bokehPass = new BokehPass(this.scene, this.camera, {
        focus: 500.0,
        aperture: 5.0,
        maxblur: 0.01,
        height: canvasHeight,
        width: canvasWidth
      })
      this.composer.addPass(bokehPass);
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        stats.begin();
        // this.controls.update();
        for(const object of this.objects) {
          object.update(time);
        }
        // this.composer.render();

        this.renderer.render(this.scene, this.camera);
        stats.end();
      }
    }
  }
}


export const TestPage8 = () => {
  const canvasScene = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      let animation = CellAnimation(canvasScene.current);
      animation.init();
      document.getElementById('test-stats').appendChild(stats.dom);
    }
  }, [canvasScene]);

  return (
    <div className="hero-container">
      <div id="test-stats"></div>
      <div className="cell-background"></div>
      <canvas ref={canvasScene} className="blurred" style={{
        width: '100vw',
        height: '100vh',
      }}>
      </canvas>
    </div>
  );
}
