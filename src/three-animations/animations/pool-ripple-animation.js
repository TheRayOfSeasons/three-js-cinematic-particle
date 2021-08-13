import * as THREE from 'three';

import { CORE } from '../utils/core';
import { createPoolRipple } from '../scene-objects/pool-ripple';

const PoolRippleAnimation = ({ canvas, gui, guiAPI }) => {
  return {
    gui,
    guiAPI,
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.renderer.setClearColor(0xe7e7e7, 1.0);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 18;

      const hemiLight = new THREE.HemisphereLight('#c0c0c0', '#383838');
      hemiLight.position.set(0, 200, 0);
      this.scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight('#ffffff');
      dirLight.position.set(0, 200, 100);
      dirLight.castShadow = true;
      dirLight.shadow.camera.top = 180;
      dirLight.shadow.camera.bottom = - 100;
      dirLight.shadow.camera.left = - 120;
      dirLight.shadow.camera.right = 120;
      dirLight.visible = false;
      this.scene.add(dirLight);

      const lightFolder = this.gui.addFolder('Lighting');

      lightFolder.addColor(this.guiAPI, 'skyColor').onChange(() => {
        hemiLight.color = new THREE.Color(this.guiAPI.skyColor);
      });

      lightFolder.addColor(this.guiAPI, 'groundColor').onChange(() => {
        hemiLight.groundColor = new THREE.Color(this.guiAPI.groundColor);
      });

      lightFolder.addColor(this.guiAPI, 'directionalLight').onChange(() => {
        dirLight.color = new THREE.Color(this.guiAPI.directionalLight);
      });

      lightFolder.add(this.guiAPI, 'enableAmbientLight', true).onChange(() => {
        hemiLight.visible = this.guiAPI.enableAmbientLight;
      });

      lightFolder.add(this.guiAPI, 'enableDirectionalLight', true).onChange(() => {
        dirLight.visible = this.guiAPI.enableDirectionalLight;
      });

      this.objects = [
        (() => {
          const ripple = createPoolRipple({ camera: this.camera });
          ripple.init();
          this.scene.add(ripple.group)
          return ripple;
        })(),
      ];

      console.log('Initialization done!');
      this.renderer.setAnimationLoop(this.update());
      console.log('Animation started!');
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        for(const object of this.objects) {
          object.update(time);
        }
        this.renderer.render(this.scene, this.camera);
      }
    }
  }
}

export { PoolRippleAnimation }
