import { PerspectiveCamera } from 'three';
import { Size } from '../constants.js';

export const DefaultCamera = new PerspectiveCamera(
  75,
  Size.width / Size.height
);
