import { InteractiveScene } from '../core';
import { DefaultCamera } from '../cameras/DefaultCamera';
import { AnimatedDots } from '../scene-objects/animated-dots';
import { DebugCameraController } from '../scene-objects/debug-camera-controller';

export class HeroScene extends InteractiveScene {
  sceneObjects = {
    AnimatedDots,
    // DebugCameraController,
  }
  cameras = {
    DefaultCamera,
  }
  defaultCamera = 'DefaultCamera';

  onSceneAwake() {
    this.currentCamera.position.z = 10;
  }
}
