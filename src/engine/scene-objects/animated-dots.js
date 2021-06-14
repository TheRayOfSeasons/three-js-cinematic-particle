import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Group,
  Mesh,
  MeshNormalMaterial,
  Plane,
  PlaneHelper,
  Points,
  PointsMaterial,
  Raycaster,
  Vector2,
  Vector3
} from 'three';
import { Size } from '../constants';
import { MonoBehaviour, SceneObject } from '../core';

const debug = true;

class Dots extends MonoBehaviour {
  parameters = {
    dotCount: 10000,
    dotSize: 0.2,
  }

  start() {
    this.group = new Group();
    this.geometry = new BufferGeometry();

    const positions = new Float32Array(this.parameters.dotCount * 3);
    const colors = new Float32Array(this.parameters.dotCount * 3);
    for(let i = 0; i < this.parameters.dotCount; i++) {
      const i3 = i * 3;
      const x = i3;
      const y = i3 + 1;
      const z = i3 + 2;

      positions[x] = (Math.random() - 0.5) * 65;
      positions[y] = (Math.random() - 0.5) * 65;
      positions[z] = 0;
      colors[x] = Math.random();
      colors[y] = Math.random();
      colors[z] = Math.random();
    }

    this.geometry.setAttribute('position', new BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new BufferAttribute(colors, 3));

    this.material = new PointsMaterial({
      size: this.parameters.dotSize,
      sizeAttenuation: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexColors: true
    });
    this.points = new Points(this.geometry, this.material);
    this.group.add(this.points);
  }

  exportAsSceneObject() {
    return this.group;
  }
}

class MouseOverDotAnimation extends MonoBehaviour {
  subscribeToMousePosition() {
    this.mousePosition = new Vector2();
    this.raycaster = new Raycaster();
    window.addEventListener('mousemove', event => {
      this.mousePosition.x = (event.clientX / Size.width) * 2 - 1;
      this.mousePosition.y = -(event.clientY / Size.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mousePosition, this.scene.currentCamera);
    });
  }

  start() {
    this.subscribeToMousePosition();
    this.group = new Group();
    this.dots = this.getComponent('Dots');
    this.raycastPlane = new Plane(new Vector3(0, 0, 1), 0);
    this.intersectPoint = new Vector3();

    if(debug) {
      this.intersectHelperGeometry = new BoxGeometry(1, 1, 1);
      this.intersectHelperMaterial = new MeshNormalMaterial();
      this.intersectHelper = new Mesh(this.intersectHelperGeometry, this.intersectHelperMaterial);
      this.group.add(this.intersectHelper);

      const planeHelper = new PlaneHelper(this.raycastPlane, 0xffff00);
      this.group.add(planeHelper);
    }
  }

  update(time) {
    this.raycaster.ray.intersectPlane(this.raycastPlane, this.intersectPoint);

    if(debug) {
      this.intersectHelper.position.x = this.intersectPoint.x;
      this.intersectHelper.position.y = this.intersectPoint.y;
      this.intersectHelper.position.z = this.intersectPoint.z;
    }
  }

  exportAsSceneObject() {
    return this.group;
  }
}

export class AnimatedDots extends SceneObject {
  monobehaviours = {
    Dots,
    MouseOverDotAnimation
  }
}
