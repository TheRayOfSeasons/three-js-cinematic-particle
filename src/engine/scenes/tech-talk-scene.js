import { InteractiveScene } from '../core';
import { DefaultCamera } from '../cameras/DefaultCamera';
import { AbstractWave } from '../scene-objects/abstract-wave';
import { MouseLight } from '../scene-objects/mouse-light';
import { HemisphereLight } from 'three';
import { Galaxy } from '../scene-objects/galaxy';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Test } from '../scene-objects/my-object';
export class TechTalkScene extends InteractiveScene {
  sceneObjects = {
    Test
    // MouseLight,
    // AbstractWave,
    // Galaxy
  }
  cameras = {
    DefaultCamera,
  }
  defaultCamera = 'DefaultCamera';

  onSceneAwake() {
    this.currentCamera.position.x = -0.5;
    this.currentCamera.position.y = 0.5;
    this.currentCamera.position.z = 0.5;

    const hemiLight = new HemisphereLight('#ffffff', '#ffffff');
    hemiLight.position.set(0, 200, 0);
    this.scene.add(hemiLight);

    this.overlay = document.getElementById('element');
    this.controls = new OrbitControls(this.currentCamera, this.overlay);
    this.controls.enableDamping = true;
  }

  onSceneStart() {
    // const galaxy = this.instances.Galaxy.components.GalaxyParticle;
    // galaxy.group.position.y = 2;
    // galaxy.group.position.z = 5;
  }

  onAfterRender() {
    this.controls.update();
  }
}
