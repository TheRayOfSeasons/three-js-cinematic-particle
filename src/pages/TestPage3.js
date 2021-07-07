import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CORE } from './Core';
import { createRunningMan } from './RunningMan';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

const RunningManAnimation = canvas => {
  return {
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.y = 100;
      this.camera.position.z = 200;

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

      this.runningMan = createRunningMan();
      this.runningMan.init();
      this.scene.add(this.runningMan.group);
      this.runningMan.group.position.y = -100;
      this.runningMan.group.rotation.y = -Math.PI * 0.15;

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
        this.runningMan.update(time);
        this.renderer.render(this.scene, this.camera);
      }
    }
  }
}


export const TestPage3 = () => {
  const canvasScene = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      let fgSpheres = RunningManAnimation(canvasScene.current);
      fgSpheres.init();
    }
  }, [canvasScene]);

  return (
    <div className="hero-container">
      <div id="test-stats"></div>
      <canvas ref={canvasScene} style={{
        width: '100vw',
        height: '100vh',
        // position: 'absolute',
        // zIndex: '-2'
      }}>
      </canvas>
    </div>
  );
}
