import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Stats from 'stats-js';

import { CORE } from './Core';
import { createPathedDNA } from './PathedDNA';
import { createAmbientMeshParticles } from './AmbientMeshParticles';
import { createCameraPanner } from './CameraPanner';

const stats = new Stats();

const PathedDNAAnimation = canvas => {
  return {
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 4.5;

      const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x444444 );
      hemiLight.position.set( 0, 200, 0 );
      this.scene.add( hemiLight );

      const dirLight = new THREE.DirectionalLight( 0xffffff );
      dirLight.intensity = 0.25;
      dirLight.position.set( 75, 50, 100 );
      dirLight.castShadow = true;
      dirLight.shadow.camera.top = 180;
      dirLight.shadow.camera.bottom = - 100;
      dirLight.shadow.camera.left = - 120;
      dirLight.shadow.camera.right = 120;
      this.scene.add( dirLight );

      this.objects = [
        (() => {
          const pathedDNA = createPathedDNA(canvas, this.camera);
          pathedDNA.init();
          this.scene.add(pathedDNA.group);
          return pathedDNA;
        })(),
        (() => {
          const ambientParticles = createAmbientMeshParticles({
            geometry: new THREE.SphereBufferGeometry(0.05, 8, 8),
            material: new THREE.MeshStandardMaterial({
              color: '#2041d6',
              metalness: 0.25,
              roughness: 1,
              emissiveIntensity: 1,
            }),
          });
          ambientParticles.init();
          this.scene.add(ambientParticles.group);
          return ambientParticles;
        })(),
        (() => {
          const ambientParticles = createAmbientMeshParticles({
            geometry: new THREE.BoxBufferGeometry(0.1, 0.1, 0.1),
            material: new THREE.MeshStandardMaterial({
              color: '#20d620',
              metalness: 0.25,
              roughness: 1,
              emissiveIntensity: 1,
            }),
          });
          ambientParticles.init();
          this.scene.add(ambientParticles.group);
          return ambientParticles;
        })(),
        (() => {
          const cameraPanner = createCameraPanner({
            camera: this.camera,
            panLimit: 2,
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
        for(const obj of this.objects) {
          obj.update(time);
        }
        this.renderer.render(this.scene, this.camera);
        stats.end();
      }
    }
  }
}


export const TestPage11 = () => {
  const canvasScene = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      let animation = PathedDNAAnimation(canvasScene.current);
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
