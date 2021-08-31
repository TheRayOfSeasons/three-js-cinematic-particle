import React, { useRef, useEffect } from 'react';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { applyAnimation } from '../three-animations/animations';

export const InstancedCollidingObjects = () => {
  const animationCanvas = useRef(null);

  useEffect(() => {
    if(!animationCanvas)
      return;

    const gui = new GUI();
    gui.width = 300;
    gui.domElement.style.userSelect = 'none';
    gui.domElement.parentElement.style.zIndex = 60;
    gui.domElement.parentElement.style.color = '#000000';

    const animation = applyAnimation({
      canvas: animationCanvas.current,
      animationName: 'InstancedCollisionTestAnimation',
      gui,
      guiAPI: {
        // lighting
        skyColor: '#c0c0c0',
        groundColor: '#383838',
        directionalLight: '#ffffff',
        enableAmbientLight: true,
        enableDirectionalLight: false,
      }
    });
  }, [animationCanvas]);

  return (
    <div className="hero-container">
      <div className="dirty-white-background"></div>
      <canvas ref={animationCanvas} style={{
        width: '100vw',
        height: '100vh',
      }}>
      </canvas>
    </div>
  );
}
