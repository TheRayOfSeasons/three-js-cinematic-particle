import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { CORE } from './Core';
import { createCylindricalDNA } from './CylindricalDNA';
import { createLinedIcoDNA } from './LinedIcoDNA';
import { createAsymmetricLinedIcoDNA } from './AsymmetricLinedIcoDNA';


const CylindricalDnaAnimation = canvas => {
  return {
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 50;

      const hemiLight = new THREE.HemisphereLight('#979797', '#444444');
      hemiLight.position.set( 0, 200, 0 );
      this.scene.add( hemiLight );

      const dirLight = new THREE.DirectionalLight('#979797');
      dirLight.position.set( 0, 50, 100 );
      dirLight.castShadow = true;
      dirLight.shadow.camera.top = 180;
      dirLight.shadow.camera.bottom = - 100;
      dirLight.shadow.camera.left = - 120;
      dirLight.shadow.camera.right = 120;
      this.scene.add( dirLight );

      this.objects = [
        (() => {
          const dna = createCylindricalDNA();
          dna.init();
          this.scene.add(dna.group);
          return dna;
        })(),
        // (() => {
        //   const dna = createLinedIcoDNA();
        //   dna.init();
        //   this.scene.add(dna.group);
        //   return dna;
        // })(),
        // (() => {
        //   const dna = createAsymmetricLinedIcoDNA();
        //   dna.init();
        //   this.scene.add(dna.group);
        //   return dna;
        // })(),
      ];

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
        for(const object of this.objects) {
          object.update(time);
        }
        this.renderer.render(this.scene, this.camera);
      }
    }
  }
}


export const TestPage18 = () => {
  const canvasScene = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      let animation = CylindricalDnaAnimation(canvasScene.current);
      animation.init();
    }
  }, [canvasScene]);

  return (
    <div className="hero-container">
      <div id="test-stats"></div>
      <div className="dirty-white-background"></div>
      <canvas ref={canvasScene} className="blurred" style={{
        width: '100vw',
        height: '100vh',
      }}>
      </canvas>
    </div>
  );
}
