import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { CORE } from './Core';
import { createAnimatedImportedCell } from './ImportedCell';


const CellAnimation = canvas => {
  return {
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 10;

      this.cell = createAnimatedImportedCell();
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
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        this.controls.update();
        this.cell.update(time);
        this.renderer.render(this.scene, this.camera);
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
