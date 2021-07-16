import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import Stats from 'stats-js';

import { CORE } from './Core';
import { createAnimatedNeuron } from './Neuron';
import { createCameraPanner } from './CameraPanner';

const stats = new Stats();

const NeuronAnimation = canvas => {
  return {
    canvas,
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 1;

      const hemiLight = new THREE.HemisphereLight('#979797', '#444444');
      hemiLight.position.set( 100, 200, 0 );
      this.scene.add( hemiLight );

      const dirLight = new THREE.DirectionalLight('#979797');
      dirLight.intensity = 0.25;
      dirLight.position.set( 75, 200, 100 );
      dirLight.castShadow = true;
      dirLight.shadow.camera.top = 180;
      dirLight.shadow.camera.bottom = - 100;
      dirLight.shadow.camera.left = - 120;
      dirLight.shadow.camera.right = 120;
      this.scene.add( dirLight );
      
      this.neurons = [
        (() => {
          const neuron = createAnimatedNeuron(this.canvas);
          neuron.init();
          this.scene.add(neuron.group);
          neuron.group.rotation.x = -Math.PI * 0.075;
          neuron.group.rotation.y = -Math.PI;
          neuron.group.rotation.z = -Math.PI * 0.05;
          neuron.group.position.x = 0.75;
          return neuron;
        })(),
        (() => {
          const neuron = createAnimatedNeuron(this.canvas);
          neuron.init();
          this.scene.add(neuron.group);
          neuron.group.rotation.x = -Math.PI * 0.075;
          neuron.group.rotation.y = Math.PI * 0.35;
          neuron.group.position.x = -1.75;
          neuron.group.position.z = -2;
          return neuron;
        })(),
        (() => {
          const neuron = createAnimatedNeuron(this.canvas);
          neuron.init();
          this.scene.add(neuron.group);
          neuron.group.rotation.x = -Math.PI * 0.075;
          neuron.group.rotation.y = Math.PI * 0.75;
          neuron.group.rotation.z = Math.PI * 0.25;
          neuron.group.position.x = 3;
          neuron.group.position.y = 1.75;
          neuron.group.position.z = -3;
          return neuron;
        })(),
      ];

      console.log('Initialization done!');
      this.renderer.setAnimationLoop(this.update());
      console.log('Animation started!');

      this.cameraPanner = createCameraPanner({
        camera: this.camera,
        panLimit: 0.4,
        easing: 0.03
      });
      this.cameraPanner.init();
      this.scene.add(this.cameraPanner.group);
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        stats.begin();
        this.cameraPanner.update(time);
        for(const neuron of this.neurons) {
          neuron.update(time);
        }
        this.renderer.render(this.scene, this.camera);
        stats.end();
      }
    }
  }
}


export const TestPage10 = () => {
  const canvasScene = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      let animation = NeuronAnimation(canvasScene.current);
      animation.init();
      document.getElementById('test-stats').appendChild(stats.dom);
    }
  }, [canvasScene]);

  return (
    <div className="hero-container">
      <div id="test-stats"></div>
      {/* <div className="hero-content">
        <div>
          <h1>Test content</h1>
        </div>
      </div> */}
      <div className="dirty-white-background"></div>
      {/* <div className="orbit-controls-overlay"></div> */}
      <canvas ref={canvasScene} className="blurred" style={{
        // position: 'absolute',
        width: '100vw',
        height: '100vh',
        // zIndex: '1',
      }}>
      </canvas>
    </div>
  );
}
