import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { CORE } from '../utils/core';
import { createRipplingSphere } from '../scene-objects/rippling-sphere';
import { createShaderRipplingSphere } from '../scene-objects/shader-rippling-sphere';

const RipplingSphereAnimation = ({ canvas, gui, guiAPI }) => {
  return {
    gui,
    guiAPI,
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.renderer.setClearColor(0xbebebe, 1.0);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 18;

      // const ambientLight = new THREE.AmbientLight('#3d3d3d', 1);
      // ambientLight.position.set(0, 200, 0);
      // this.scene.add(ambientLight);

      const hemiLight = new THREE.HemisphereLight('#c0c0c0', '#383838');
      hemiLight.position.set(0, 200, 0);
      this.scene.add(hemiLight);

      const dirLight = new THREE.DirectionalLight('#ffffff');
      dirLight.position.set(0, 200, 100);
      // dirLight.castShadow = true;
      // dirLight.shadow.camera.top = 180;
      // dirLight.shadow.camera.bottom = - 100;
      // dirLight.shadow.camera.left = - 120;
      // dirLight.shadow.camera.right = 120;
      dirLight.visible = false;
      this.scene.add(dirLight);

      const lightFolder = this.gui.addFolder('Lighting');

      hemiLight.color = new THREE.Color(this.guiAPI.skyColor);
      lightFolder.addColor(this.guiAPI, 'skyColor').onChange(() => {
        hemiLight.color = new THREE.Color(this.guiAPI.skyColor);
      });

      hemiLight.groundColor = new THREE.Color(this.guiAPI.groundColor);
      lightFolder.addColor(this.guiAPI, 'groundColor').onChange(() => {
        hemiLight.groundColor = new THREE.Color(this.guiAPI.groundColor);
      });

      dirLight.color = new THREE.Color(this.guiAPI.directionalLight);
      lightFolder.addColor(this.guiAPI, 'directionalLight').onChange(() => {
        dirLight.color = new THREE.Color(this.guiAPI.directionalLight);
      });

      hemiLight.visible = this.guiAPI.enableAmbientLight;
      lightFolder.add(this.guiAPI, 'enableAmbientLight', true).onChange(() => {
        hemiLight.visible = this.guiAPI.enableAmbientLight;
      });

      hemiLight.intensity = this.guiAPI.ambientLightIntensity;
      lightFolder.add(this.guiAPI, 'ambientLightIntensity', 0.0, 10.0).onChange(() => {
        hemiLight.intensity = this.guiAPI.ambientLightIntensity;
        console.log(hemiLight.intensity);
      });

      dirLight.visible = this.guiAPI.enableDirectionalLight;
      lightFolder.add(this.guiAPI, 'enableDirectionalLight', true).onChange(() => {
        dirLight.visible = this.guiAPI.enableDirectionalLight;
      });

      dirLight.intensity = this.guiAPI.directionalLightIntensity;
      lightFolder.add(this.guiAPI, 'directionalLightIntensity', 0.0, 1.0).onChange(() => {
        dirLight.intensity = this.guiAPI.directionalLightIntensity;
      });

      hemiLight.position.x = this.guiAPI.dirLightX;
      lightFolder.add(this.guiAPI, 'ambientLightX', 0.0, 1000.0).onChange(() => {
        hemiLight.position.x = this.guiAPI.dirLightX;
      });

      hemiLight.position.y = this.guiAPI.dirLightY;
      lightFolder.add(this.guiAPI, 'ambientLightY', 0.0, 1000.0).onChange(() => {
        hemiLight.position.y = this.guiAPI.dirLightY;
      });

      hemiLight.position.z = this.guiAPI.dirLightZ;
      lightFolder.add(this.guiAPI, 'ambientLightZ', 0.0, 1000.0).onChange(() => {
        hemiLight.position.z = this.guiAPI.dirLightZ;
      });

      dirLight.position.x = this.guiAPI.dirLightX;
      lightFolder.add(this.guiAPI, 'dirLightX', 0.0, 1000.0).onChange(() => {
        dirLight.position.x = this.guiAPI.dirLightX;
      });

      dirLight.position.y = this.guiAPI.dirLightY;
      lightFolder.add(this.guiAPI, 'dirLightY', 0.0, 1000.0).onChange(() => {
        dirLight.position.y = this.guiAPI.dirLightY;
      });

      dirLight.position.z = this.guiAPI.dirLightZ;
      lightFolder.add(this.guiAPI, 'dirLightZ', 0.0, 1000.0).onChange(() => {
        dirLight.position.z = this.guiAPI.dirLightZ;
      });

      this.objects = [
        (() => {
          const ripplingSphere = createShaderRipplingSphere({ camera: this.camera });
          ripplingSphere.init();
          this.scene.add(ripplingSphere.group);

          const objectFolder = this.gui.addFolder('Rippling Sphere');
          const diameter = ripplingSphere.parameters.radius * 2.0;

          ripplingSphere.parameters.controlPoint1.x = this.guiAPI.controlPoint1;
          objectFolder.add(this.guiAPI, 'controlPoint1', -diameter, diameter).onChange(() => {
            ripplingSphere.parameters.controlPoint1.x = this.guiAPI.controlPoint1;
          });

          ripplingSphere.parameters.controlPoint2.x = this.guiAPI.controlPoint2;
          objectFolder.add(this.guiAPI, 'controlPoint2', -diameter, diameter).onChange(() => {
            ripplingSphere.parameters.controlPoint2.x = this.guiAPI.controlPoint2;
          });

          return ripplingSphere;
        })(),
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

export { RipplingSphereAnimation }
