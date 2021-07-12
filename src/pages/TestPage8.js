import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass';

import { CORE } from './Core';
import { createAnimatedImportedCell } from './ImportedCell';
import { createAnimatedImportedCellSpread } from './ImportedCellSpread';


const CellAnimation = canvas => {
  return {
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 10;
      this.camera.far = 5000;
      this.camera.updateProjectionMatrix();

      this.cell = createAnimatedImportedCellSpread(this.scene, this.camera);
      this.cell.init();
      this.scene.add(this.cell.group);

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

      this.controls = new OrbitControls(this.camera, canvas);
      this.controls.enableDamping = true;

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


      // this.mousePosition = {x: 0, y: 0};
      // window.addEventListener('mousemove', event => {
      //   if ( event.isPrimary === false ) return;
			// 	this.mousePosition.x = event.clientX - (window.innerWidth / 2);
			// 	this.mousePosition.y = event.clientY - (window.innerHeight / 2);
      // })
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        this.controls.update();
        this.cell.update(time);
        this.composer.render();

        // this.camera.position.x += ( this.mousePosition.x - this.camera.position.x ) * 0.00036;
				// this.camera.position.y += ( - ( this.mousePosition.y ) - this.camera.position.y ) * 0.00036;

				// this.camera.lookAt( this.scene.position );
        // this.renderer.render(this.scene, this.camera);
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
    }
  }, [canvasScene]);

  return (
    <div className="hero-container">
      <div id="test-stats"></div>
      <canvas ref={canvasScene} className="blurred" style={{
        width: '100vw',
        height: '100vh',
      }}>
      </canvas>
    </div>
  );
}
