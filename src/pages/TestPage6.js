import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

import { CORE } from './Core';
import { createAnimatedSpline } from './AnimatedSpline';

const CoronaAnimation = canvas => {
  return {
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 10;

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

      this.animatedSpline1 = createAnimatedSpline();
      this.animatedSpline1.init();
      this.scene.add(this.animatedSpline1.group);

      console.log('Initialization done!');
      this.renderer.setAnimationLoop(this.update());
      console.log('Animation started!');
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        this.animatedSpline1.update();
        this.renderer.render(this.scene, this.camera);
      }
    }
  }
}


export const TestPage6 = () => {
  const canvasScene = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      let animation = CoronaAnimation(canvasScene.current);
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
