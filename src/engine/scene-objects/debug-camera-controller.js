import { Vector3 } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Size } from '../constants';
import { MonoBehaviour, SceneObject } from '../core';

/** Defines whether the debug camera will use orbit controls by click or mouse movement. */
const useOrbit = false;

class CameraLogic extends MonoBehaviour {
  parameters = {
    distance: 20,
  }

  start() {
    if(useOrbit) {
      this.controls = new OrbitControls(this.scene.currentCamera, this.scene.scene);
      this.controls.enableDamping = true;
    }
    else {
      this.cursor = {x: 0, y: 0};
      window.addEventListener('mousemove', event => {
        this.cursor.x = event.clientX / Size.width - 0.5;
        this.cursor.y = -(event.clientY / Size.height - 0.5);
      });
    }
  }

  update(time) {
    if(useOrbit) {
      this.controls.update();
    }
    else {
      this.scene.currentCamera.position.x = Math.sin(this.cursor.x * Math.PI * 2) * this.parameters.distance;
      this.scene.currentCamera.position.z = Math.cos(this.cursor.x * Math.PI * 2) * this.parameters.distance;
      this.scene.currentCamera.position.y = this.cursor.y * 5;
      this.scene.currentCamera.lookAt(new Vector3());
    }
  }
}

/** Use this in a scene for debugging purposes regarding object positions. */
export class DebugCameraController extends SceneObject {
  monobehaviours = {
    CameraLogic
  }
}
