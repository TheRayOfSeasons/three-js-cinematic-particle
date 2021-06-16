import {
  AdditiveBlending,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  Group,
  Mesh,
  MeshNormalMaterial,
  Plane,
  PlaneHelper,
  Points,
  Raycaster,
  ShaderMaterial,
  Vector2,
  Vector3
} from 'three';
import { Size } from '../constants';
import { MonoBehaviour, SceneObject } from '../core';

const debug = false;

const clock = new Clock();

function getDistance(x1, y1, x2, y2) {
  return Math.sqrt(Math.pow((x1 - x2), 2) + Math.pow((y1 - y2), 2));
}

/**
 * @typedef {Number} loopIncrementIndex
 * @param {Array} array
 * @param {Number} currentIndex
 */
function loopIncrementIndex(array, currentIndex, defaultIndex=0) {
  const newIndex = currentIndex + 1;
  return array[newIndex] ? newIndex : defaultIndex;
}

const waypoints = [
  new Vector3(7, 7, 0),
  new Vector3(6.99, 6.99, 0),
  new Vector3(-7, -7, 0),
  new Vector3(2, -2, 0),
  new Vector3(-2, 2, 0)
];

class Dots extends MonoBehaviour {
  parameters = {
    dotCount: 10000,
    dotSize: 0.02,
    area: 100
  }

  start() {
    this.group = new Group();
    this.geometry = new BufferGeometry();

    const positions = new Float32Array(this.parameters.dotCount * 3);
    const colors = new Float32Array(this.parameters.dotCount * 3);
    const sizes = new Float32Array(this.parameters.dotCount);
    const waypointIndices = new Float32Array(this.parameters.dotCount);
    const waypointIndexStart = 2;
    const currentDestinations = new Float32Array(this.parameters.dotCount * 3); 
    for(let i = 0, currentWaypointIndex = waypointIndexStart; i < this.parameters.dotCount; i++) {
      const i3 = i * 3;
      const x = i3;
      const y = i3 + 1;
      const z = i3 + 2;

      positions[x] = waypoints[0].x;
      positions[y] = waypoints[0].y;
      positions[z] = waypoints[0].z;
      currentDestinations[x] = waypoints[currentWaypointIndex].x;
      currentDestinations[y] = waypoints[currentWaypointIndex].y;
      currentDestinations[z] = waypoints[currentWaypointIndex].z;
      colors[x] = 1;
      colors[y] = 1;
      colors[z] = 1;
      sizes[i] = 0.2;
      waypointIndices[i] = currentWaypointIndex;
      if(currentWaypointIndex < waypoints.length - 1) {
        currentWaypointIndex++;
      }
      else {
        currentWaypointIndex = waypointIndexStart;
      }
    }
    console.log(waypointIndices);

    this.geometry.setAttribute('position', new BufferAttribute(positions, 3));
    this.geometry.setAttribute('customColor', new BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new BufferAttribute(sizes, 1));
    this.geometry.setAttribute('waypointIndex', new BufferAttribute(waypointIndices, 1));
    this.geometry.setAttribute('currentDestination', new BufferAttribute(currentDestinations, 3));
    // lerp target as attribute

    this.material = new ShaderMaterial({
      uniforms: {
        color: { value: new Color( 0xffffff ) },
        // for further experimentation:
        // pointTexture: { value: this.particleImg }
      },
      vertexShader: `
        attribute float size;
        attribute vec3 customColor;
        varying vec3 vColor;

        void main() {
          vColor = customColor;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 color;
        // uniform sampler2D pointTexture;

        varying vec3 vColor;

        void main() {
          gl_FragColor = vec4(color * vColor, 1.0);
          // gl_FragColor = gl_FragColor * texture2D(pointTexture, gl_PointCoord);
        }
      `,
      blending: AdditiveBlending,
      depthTest: false,
      transparent: true
    })
    this.points = new Points(this.geometry, this.material);
    this.group.add(this.points);
  }

  exportAsSceneObject() {
    return this.group;
  }
}

class MouseOverDotAnimation extends MonoBehaviour {
  parameters = {
    ease: 0.05,
    affectedArea: 1,
    useExperimentalHoverEffect: false,
    keepDynamicWhenIdle: true,
  }

  subscribeToMousePosition() {
    this.mousePosition = new Vector2();
    this.raycaster = new Raycaster();
    this.mouseIsMoving = false;
    const updateMousePosition = event => {
      this.mouseIsMoving = true;
      this.mousePosition.x = (event.clientX / Size.width) * 2 - 1;
      this.mousePosition.y = -(event.clientY / Size.height) * 2 + 1;
      this.raycaster.setFromCamera(this.mousePosition, this.scene.currentCamera);
    }
    window.addEventListener('mousemove', updateMousePosition);
    document.addEventListener('DOMContentLoaded', updateMousePosition);
  }

  start() {
    this.subscribeToMousePosition();
    this.group = new Group();
    this.dots = this.getComponent('Dots');
    this.raycastPlane = new Plane(new Vector3(0, 0, 1), 0);
    this.intersectPoint = new Vector3();

    this.geometryCopy = new BufferGeometry();
    this.geometryCopy.copy(this.dots.points.geometry);

    if(debug) {
      this.intersectHelperGeometry = new BoxGeometry(1, 1, 1);
      this.intersectHelperMaterial = new MeshNormalMaterial();
      this.intersectHelper = new Mesh(this.intersectHelperGeometry, this.intersectHelperMaterial);
      this.group.add(this.intersectHelper);

      for(const waypoint of waypoints) {
        const waypointMeshGeometry = new BoxGeometry(1, 1, 1);
        const waypointMeshMaterial = new MeshNormalMaterial();
        const waypointMesh = new Mesh(waypointMeshGeometry, waypointMeshMaterial);
        this.group.add(waypointMesh);
        waypointMesh.position.set(waypoint.x, waypoint.y, waypoint.z);
      }

      const planeHelper = new PlaneHelper(this.raycastPlane, 0xffff00);
      this.group.add(planeHelper);
    }
  }

  update(time) {
    const elapsedTime = clock.getElapsedTime();
    this.raycaster.ray.intersectPlane(this.raycastPlane, this.intersectPoint);

    for(let i = 0; i < this.dots.points.geometry.attributes.position.count; i++) {
      const i3 = i * 3;
      const x = i3;
      const y = i3 + 1;
      const z = i3 + 2;

      const initialX = this.geometryCopy.attributes.position.array[x];
      const initialY = this.geometryCopy.attributes.position.array[y];
      const initialZ = this.geometryCopy.attributes.position.array[z];

      let currentX = this.dots.points.geometry.attributes.position.array[x];
      let currentY = this.dots.points.geometry.attributes.position.array[y];
      let currentZ = this.dots.points.geometry.attributes.position.array[z];

      let distanceX = initialX - currentX;
      let distanceY = initialY - currentY;
      let distanceZ = initialZ - currentZ;

      const mouseDistance = getDistance(
        this.intersectPoint.x, this.intersectPoint.y,
        currentX, currentY
      );
      let distance = (
        (distanceX = this.intersectPoint.x - currentX)
        * distanceX
        + (distanceY = this.intersectPoint.y - currentY)
        * distanceY
      );
      const force = -this.parameters.affectedArea / (distance || 1); // 1 to prevent division by zero

      if(mouseDistance < this.parameters.affectedArea) {
        const t = Math.atan2(distanceY, distanceX);
        const experimentalFactor = this.parameters.useExperimentalHoverEffect
          ? elapsedTime * 0.75
          : 0;
        if(i % 5 == 0) {
          currentX -= 0.03 * Math.cos(t + experimentalFactor);
          currentY -= 0.03 * Math.sin(t + experimentalFactor);
        }
        else {
          currentX += force * Math.cos(t + experimentalFactor);
          currentY += force * Math.sin(t + experimentalFactor);
        }
        currentX += (initialX - currentX) * this.parameters.ease;
        currentY += (initialY - currentY) * this.parameters.ease;
        currentZ += (initialZ - currentZ) * this.parameters.ease;
      }
      else {
        // this defines the movements of the points outside the affected area of the mouse position

        if(this.parameters.keepDynamicWhenIdle) {
          const waypointIndex = this.dots.points.geometry.attributes.waypointIndex.array[i];

          const interpolationVector = new Vector3(
            currentX,
            currentY,
            currentZ
          );
          const destination = new Vector3(
            this.dots.points.geometry.attributes.currentDestination.array[x],
            this.dots.points.geometry.attributes.currentDestination.array[y],
            this.dots.points.geometry.attributes.currentDestination.array[z]
          );
          const preDistance = interpolationVector.distanceTo(destination);
          interpolationVector.lerp(
            destination,
            Math.atan2(0.05, preDistance)
          );

          const lerpDistance = interpolationVector.distanceTo(new Vector3(currentX, currentY, currentZ));
          if(lerpDistance < 0.01) {
            // const newIndex = loopIncrementIndex(waypoints, waypointIndex, 0);

            // const newWaypoint = waypoints[newIndex];
            // this.dots.points.geometry.attributes.waypointIndex.array[i] = newIndex;
            // this.dots.points.geometry.attributes.currentDestination.array[x] = newWaypoint.x;
            // this.dots.points.geometry.attributes.currentDestination.array[y] = newWaypoint.y;
            // this.dots.points.geometry.attributes.currentDestination.array[z] = newWaypoint.z;

            currentX = waypoints[0].x;
            currentY = waypoints[0].y;
          }
          else {
            currentX = interpolationVector.x + ((Math.random() - 0.5) * 0.1);
            currentY = interpolationVector.y + ((Math.random() - 0.5) * 0.1);
          }

          // const t = Math.atan2(initialX - interpolationVector.x, initialY - interpolationVector.y);
          // const t = Math.atan2(distanceY, distanceX);

          // experimental 1
          // const t = Math.atan2(currentX, currentY);
          // experimental 2
          // const t = Math.atan2(currentX * Math.sin(distanceX), currentY * Math.sin(distanceY));
          // experimental 3
          // const t = Math.atan2(currentX * Math.tan(distanceX), currentY * Math.tan(distanceY));

          // currentX -= Math.sin(elapsedTime + t) * 0.5;
          // currentY -= Math.cos(elapsedTime + t) * 0.5;
        }
      }


      this.dots.points.geometry.attributes.position.array[x] = currentX;
      this.dots.points.geometry.attributes.position.array[y] = currentY;
      this.dots.points.geometry.attributes.position.array[z] = currentZ;
    }
    this.dots.points.geometry.attributes.position.needsUpdate = true;
    this.dots.points.geometry.attributes.waypointIndex.needsUpdate = true;

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
