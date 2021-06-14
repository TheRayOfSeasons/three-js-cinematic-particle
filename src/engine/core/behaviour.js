import { Group } from 'three';

export class Behaviour {
  start() {}
  update() {}
  exportAsSceneObject() {}
  exportObjectGroup() {}
}

export class Component extends Behaviour {}

export class SceneObject extends Behaviour {
  monobehaviours = {}
  components = {}

  constructor({ scene }) {
    super();
    this.scene = scene;
    this.group = new Group();
  }

  addComponent({ key, monobehaviour }) {
    const component = new monobehaviour({ parentBehaviour: this, scene: this.scene });
    this.components[key] = component;
    component.start();
    const exportedSceneObject = component.exportAsSceneObject();
    if(exportedSceneObject) {
      this.group.add(exportedSceneObject);
    }
  }

  start() {
    this.group = new Group();
    Object.entries(this.monobehaviours).forEach(([key, monobehaviour]) => {
      this.addComponent({ key, monobehaviour });
    });
  }

  update(time) {
    Object.values(this.components).forEach(component => component.update(time));
  }

  exportObjectGroup() {
    return this.group;
  }
}

export class MonoBehaviour extends Component {
  constructor({ parentBehaviour, scene }) {
    super();
    this.scene = scene;
    this.parentBehaviour = parentBehaviour;
  }

  getComponent(type) {
    return this.parentBehaviour.components[type];
  }
}
