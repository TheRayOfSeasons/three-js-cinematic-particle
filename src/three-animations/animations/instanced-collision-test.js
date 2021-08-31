import * as THREE from 'three';
import * as CANNON from 'cannon';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

import { CORE } from '../utils/core';
import { createInstancedCollidingObjects } from '../scene-objects/instanced-colliding-objects';
import { createColldingCapsules } from '../scene-objects/instanced-capsules';
import { createOrbitingBodies } from '../scene-objects/orbiting-bodies';

const InstancedCollisionTestAnimation = ({ canvas, gui, guiAPI }) => {
  return {
    gui,
    guiAPI,
    clock: new THREE.Clock(),
    init: function() {
      console.log('Begin initialization...');
      const { canvasWidth, canvasHeight } = CORE.getCanvasDimensions(canvas);
      this.renderer = CORE.createRenderer(canvas, canvasWidth, canvasHeight);
      this.renderer.setClearColor(0xe7e7e7, 1.0);
      this.scene = CORE.createScene();
      this.camera = CORE.createCamera(canvasWidth, canvasHeight);
      this.camera.position.z = 18;
      this.world = new CANNON.World();
      this.world.gravity.set(0, 0, 0);

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
        // (() => {
        //   const collidingObjects = createInstancedCollidingObjects({ world: this.world });
        //   collidingObjects.init();
        //   this.scene.add(collidingObjects.group);
        //   return collidingObjects;
        // })(),
        // (() => {
        //   const collidingObjects = createColldingCapsules({
        //     camera: this.camera,
        //     world: this.world
        //   });
        //   collidingObjects.init();
        //   this.scene.add(collidingObjects.group);
        //   return collidingObjects;
        // })(),
        (() => {
          const objects = createOrbitingBodies({
            camera: this.camera,
            world: this.world
          });
          objects.init();
          this.scene.add(objects.group);
          return objects;
        })(),
      ];

      this.controls = new OrbitControls(this.camera, canvas);
      this.controls.enableDamping = true;

      console.log('Initialization done!');
      this.renderer.setAnimationLoop(this.update());
      console.log('Animation started!');
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        this.controls.update();
        const delta = this.clock.getDelta();
        this.world.step(delta);
        for(const object of this.objects) {
          object.update(time);
        }
        this.renderer.render(this.scene, this.camera);
      }
    }
  }
}

export { InstancedCollisionTestAnimation }
