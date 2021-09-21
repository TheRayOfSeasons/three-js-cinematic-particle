import {
  BoxGeometry,
  Group,
  Mesh,
  MeshNormalMaterial,
  Plane,
  PlaneHelper,
  PointLight,
  Raycaster,
  Vector3,
} from 'three';
import { Size } from '../constants';
import { MonoBehaviour, SceneObject } from '../core/behaviour';


class OrangeLight extends MonoBehaviour {
  start() {
    this.group = new Group();
    const light = new PointLight(0xf78e17, 1, 50);
    light.power = 6 * Math.PI;
    this.group.add(light);
  }

  exportAsSceneObject() {
    return this.group;
  }
}

class Light extends MonoBehaviour {
  start() {
    this.group = new Group();
    const light = new PointLight(0x60a1c4, 1, 50);
    light.power = 6 * Math.PI;
    this.group.add(light);
  }

  exportAsSceneObject() {
    return this.group;
  }
}

class MouseFollower extends MonoBehaviour {
  hookedComponent = 'Light';
  parameters = {
    xOffset: 0.0,
    yOffset: 0.0,
    zOffset: 0.5,
    debug: false
  }

  subscribeToMousePosition() {
    this.mousePosition = new Vector3(0, 0, 0);
    this.raycaster = new Raycaster();
    window.addEventListener('mousemove', event => {
      this.mousePosition.x = (event.clientX / Size.width) * 2 - 1;
      this.mousePosition.y = -(event.clientY / Size.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mousePosition, this.scene.currentCamera);
    });
  }

  start() {
    this.group = new Group();
    this.debugGroup = new Group();
    this.group.add(this.debugGroup);
    this.hookedObject = this.getComponent(this.hookedComponent).group;
    this.raycastPlane = new Plane(new Vector3(0, 1, 0), 0.01);
    if(this.parameters.debug) {
      const planeHelper = new PlaneHelper(this.raycastPlane, 1, 0xffff00);
      const boxGeometry = new BoxGeometry(0.1, 0.1, 0.1);
      const boxMaterial = new MeshNormalMaterial();
      const mesh = new Mesh(boxGeometry, boxMaterial);
      this.debugGroup.add(mesh);
      this.group.add(planeHelper);
    }
    this.intersectPoint = new Vector3();
    this.subscribeToMousePosition();
  }

  update(time) {
    this.raycaster.ray.intersectPlane(this.raycastPlane, this.intersectPoint);
    const position = new Vector3(
      this.intersectPoint.x + this.parameters.xOffset,
      this.intersectPoint.y + this.parameters.yOffset,
      this.intersectPoint.z + this.parameters.zOffset
    );
    this.hookedObject.position.x = position.x;
    this.hookedObject.position.y = position.y;
    this.hookedObject.position.z = position.z;
    if(this.parameters.debug) {
      this.debugGroup.position.x = position.x;
      this.debugGroup.position.y = position.y;
      this.debugGroup.position.z = position.z;
    }
  }

  exportAsSceneObject() {
    return this.group;
  }
}

export class OrangeMouseLight extends SceneObject {
  monobehaviours = {
    Light: OrangeLight,
    MouseFollower
  }
}

export class MouseLight extends SceneObject {
  monobehaviours = {
    Light,
    MouseFollower
  }
}
