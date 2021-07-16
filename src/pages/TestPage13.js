import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Stats from 'stats-js';

import { CORE } from './Core';
import { createEnhancedAnimatedDNA } from './EnhancedDNA';
import { createAmbientMeshParticles } from './AmbientMeshParticles';
import { createCameraPanner } from './CameraPanner';

const stats = new Stats();

const EnhancedDnaAnimation = canvas => {
  return {
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 6.5;

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

      this.objects = [
        (() => {
          const dna = createEnhancedAnimatedDNA();
          dna.init();
          this.scene.add(dna.group);
          return dna;
        })(),
        (() => {
          const ambientParticles = createAmbientMeshParticles({
            geometry: new THREE.SphereBufferGeometry(0.05, 8, 8),
            material: new THREE.MeshPhongMaterial({
              color: '#2041d6',
              specular: '#ffffff',
              emissiveIntensity: 1,
            }),
            count: 200
          });
          ambientParticles.init();
          this.scene.add(ambientParticles.group);
          return ambientParticles;
        })(),
        (() => {
          const ambientParticles = createAmbientMeshParticles({
            geometry: new THREE.SphereBufferGeometry(0.05, 8, 8),
            material: new THREE.MeshPhongMaterial({
              color: '#20d620',
              specular: '#ffffff',
              emissiveIntensity: 1,
            }),
            count: 200
          });
          ambientParticles.init();
          this.scene.add(ambientParticles.group);
          return ambientParticles;
        })(),
        (() => {
          const cameraPanner = createCameraPanner({
            camera: this.camera,
            panLimit: 1.75,
            easing: 0.03
          });
          cameraPanner.init();
          this.scene.add(cameraPanner.group);
          return cameraPanner;
        })(),
      ];

      console.log('Initialization done!');
      this.renderer.setAnimationLoop(this.update());
      console.log('Animation started!');
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        stats.begin();
        for(const object of this.objects) {
          object.update(time);
        }
        this.renderer.render(this.scene, this.camera);
        stats.end();
      }
    }
  }
}


export const TestPage13 = () => {
  const canvasScene = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      let animation = EnhancedDnaAnimation(canvasScene.current);
      animation.init();
      document.getElementById('test-stats').appendChild(stats.dom);
    }
  }, [canvasScene]);

  return (
    <div className="hero-container">
      <div id="test-stats"></div>
      <div className="blue-background"></div>
      <canvas ref={canvasScene} className="blurred" style={{
        width: '100vw',
        height: '100vh',
      }}>
      </canvas>
    </div>
  );
}
