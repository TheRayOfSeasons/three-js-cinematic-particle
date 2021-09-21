import { Scene } from 'three';
import { Behaviour } from './behaviour';


export class InteractiveScene extends Behaviour {
  sceneObjects = {};
  instances = {};
  sceneProps = [];
  cameras = {};
  defaultCamera = '';

  constructor(canvas, renderer) {
    super();
    this.canvas = canvas;
    this.renderer = renderer;
    this.scene = new Scene(...this.sceneProps);
    this.modifyScene(this.scene);
  }

  modifyScene(scene) {}

  onSceneAwake() {}

  onSceneStart() {}

  onBeforeFrameRender() {}

  onAfterRender() {}

  onRender() {}

  start() {
    this.currentCamera = this.cameras[this.defaultCamera];
    this.onSceneAwake();
    Object.entries(this.sceneObjects).forEach(([key, sceneObject]) => {
      const instance = new sceneObject({ scene: this });
      this.instances[key] = instance;
      instance.start();
      const group = instance.exportObjectGroup();
      this.scene.add(group);
    });
    this.onSceneStart();
  }

  update(time) {
    this.onBeforeFrameRender();
    Object.values(this.instances).forEach(instance => instance.update(time));
    this.onRender();
  }
}
