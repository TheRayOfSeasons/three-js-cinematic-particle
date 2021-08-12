import * as THREE from 'three';

const CORE = {
  getCanvasDimensions: canvas => {
    const canvasHeight = canvas.parentElement.clientHeight;
    const canvasWidth = canvas.parentElement.clientWidth;
    return { canvasWidth, canvasHeight };
  },
  createRenderer: function(canvas, canvasWidth, canvasHeight) {
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      // logarithmicDepthBuffer: true,
      canvas
    });
    renderer.setSize(canvasWidth, canvasHeight);
    renderer.setClearColor(0x000000, 0.0);
    return renderer;
  },
  createScene: function() {
    const scene = new THREE.Scene();
    return scene;
  },
  createCamera: function(canvasWidth, canvasHeight) {
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasWidth / canvasHeight
    );
    camera.position.z = 500;
    return camera;
  },
}

export { CORE }
