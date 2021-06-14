import { WebGLRenderer } from 'three';
import { ScenesList } from './scenes-list';

const scenes = ScenesList();

const activeRenders = {};

class ActiveRender {
  constructor({canvas, sceneName, height, width, options, useDefaultRendering=true}) {
    if(typeof(options) === 'object') {
      if(options.canvas) {
        canvas = options.canvas;
      }
    }
    this.renderer = new WebGLRenderer(options || {
      antialias: true,
      alpha: true,
      canvas
    });
    this.renderer.setSize(width || Size.GameScreen.width, height || Size.GameScreen.height);
    this.scene = new scenes[sceneName](canvas, this.renderer);
    this.scene.start();
    const animate = time => {
      this.scene.update(time);
      if(useDefaultRendering) {
        this.renderer.render(this.scene.scene, this.scene.currentCamera);
      }
      this.scene.onAfterRender();
    }
    this.renderer.setAnimationLoop(animate);
  }
}

export const manifest = {
  init: (name, args) => {
    activeRenders[name] = new ActiveRender(args);
  },
}
