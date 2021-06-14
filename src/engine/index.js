import { ActiveRender } from './renderer';

const activeRenders = {};

export const Engine = {
  initScene: (name, args) => {
    activeRenders[name] = new ActiveRender(args);
  }
}
