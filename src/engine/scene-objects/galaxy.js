import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  Group,
  Points,
  PointsMaterial,
} from 'three';
import { MonoBehaviour, SceneObject } from '../core/behaviour';

const clock = new Clock();

class GalaxyParticle extends MonoBehaviour {
  parameters = {
    count: 100000,
    size: 0.02,
    radius: 5,
    branches: 3,
    spin: 1,
    speed: 0.2,
    breathingIntensity: 0.02,
    breathingDistance: 5,
    randomness: 0.2,
    spread: 5,
    innerColor: 0xff3c30,
    outerColor: 0x1b7184,
  }

  createGalaxyDefinition() {
    const colorInside = new Color(this.parameters.innerColor);
    const colorOutside = new Color(this.parameters.outerColor);
    const positions = new Float32Array(this.parameters.count * 3);
    const colors = new Float32Array(this.parameters.count * 3);
    for(let i = 0; i < this.parameters.count; i++) {
      const i3 = i * 3;
      const x = i3;
      const y = i3 + 1;
      const z = i3 + 2;

      // Positions
      const radius = Math.random() * this.parameters.radius;
      const spinAngle = radius * this.parameters.spin;
      const branchAngle = (i % this.parameters.branches) / this.parameters.branches * Math.PI * 2;
      const upwardsAngle = (i % 10) / 10 * Math.PI * 2;

      const randomX = Math.pow(Math.random(), this.parameters.spread) * (Math.random() < 0.5 ? 1 : -1);
      const randomY = Math.pow(Math.random(), this.parameters.spread) * (Math.random() < 0.5 ? 1 : -1);
      const randomZ = Math.pow(Math.random(), this.parameters.spread) * (Math.random() < 0.5 ? 1 : -1);

      positions[x] = Math.cos(branchAngle + spinAngle) * radius + randomX;
      positions[y] = Math.tan(upwardsAngle + spinAngle) * radius + randomY;
      positions[z] = Math.sin(branchAngle + spinAngle) * radius + randomZ;

      const mixedColor = colorInside.clone();
      mixedColor.lerp(colorOutside, radius / this.parameters.radius);
      colors[x] = mixedColor.r;
      colors[y] = mixedColor.g;
      colors[z] = mixedColor.b;
    }
    return { positions, colors };
  }

  createOtherDefinition() {
    const positions = new Float32Array(this.parameters.count * 3);
    for(let i = 0; i < this.parameters.count; i++) {
      const i3 = i * 3;
      const x = i3;
      const y = i3 + 1;
      const z = i3 + 2;

      positions[x] = (Math.random() - 0.5) * 10;
      positions[y] = (Math.random() - 0.5) * 10;
      positions[z] = (Math.random() - 0.5) * 10;
    }
    return { positions };
  }

  start() {
    this.group = new Group();
    this.definitions = {
      'galaxy': this.createGalaxyDefinition(),
      'other': this.createOtherDefinition(),
    }
    const generateGalaxy = () => {
      const geometry = new BufferGeometry();
      const { positions, colors } = this.definitions.galaxy;
      geometry.setAttribute('position', new BufferAttribute(positions, 3));
      geometry.setAttribute('color', new BufferAttribute(colors, 3));
      const material = new PointsMaterial({
        size: this.parameters.size,
        sizeAttenuation: true,
        depthWrite: false,
        blending: AdditiveBlending,
        vertexColors: true
      });
      const points = new Points(geometry, material);
      this.geometry = geometry;
      this.points = points;
      this.group.add(points);
      this.points.rotation.x = -1;
      this.points.rotation.z = 2.7;
    }
    generateGalaxy();
  }

  update(time) {
    const elapsedTime = clock.getElapsedTime();
    this.points.rotation.y = elapsedTime * this.parameters.speed;
    this.points.scale.y = Math.sin(elapsedTime + this.parameters.breathingDistance) * this.parameters.breathingIntensity;
    this.geometry.attributes.position.needsUpdate = true;
  }

  exportAsSceneObject() {
    return this.group;
  }
}

export class Galaxy extends SceneObject {
  monobehaviours = {
    GalaxyParticle
  }
}
