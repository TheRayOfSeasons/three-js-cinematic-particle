import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Stats from 'stats-js';

import { CORE } from './Core';
import { createAnimatedCorona } from './AnimatedCorona';

const stats = new Stats();

const CoronaAnimation = canvas => {
  return {
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 2;

      const hemiLight = new THREE.HemisphereLight(0x949494, 0x444444);
      hemiLight.position.set(0, 200, 0);
      this.scene.add( hemiLight );

      const dirLight = new THREE.DirectionalLight(0x949494);
      dirLight.position.set(100, 200, 200);
      dirLight.castShadow = true;
      dirLight.shadow.camera.top = 180;
      dirLight.shadow.camera.bottom = - 100;
      dirLight.shadow.camera.left = - 120;
      dirLight.shadow.camera.right = 120;
      this.scene.add(dirLight);

      this.animatedCorona1 = createAnimatedCorona();
      this.animatedCorona1.init();
      this.scene.add(this.animatedCorona1.group);

      console.log('Initialization done!');
      this.renderer.setAnimationLoop(this.update());
      console.log('Animation started!');
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        stats.begin();
        this.animatedCorona1.update(time);
        this.renderer.render(this.scene, this.camera);
        stats.end();
      }
    }
  }
}


export const TestPage4 = () => {
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
