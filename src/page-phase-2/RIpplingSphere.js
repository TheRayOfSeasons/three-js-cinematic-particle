import React, { useRef, useEffect } from 'react';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { applyAnimation } from '../three-animations/animations';

export const RipplingSphere = () => {
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
      animationName: 'RipplingSphereAnimation',
      gui,
      guiAPI: {
        // lighting
        skyColor: '#ffffff',
        groundColor: '#383838',
        directionalLight: '#ffffff',
        enableAmbientLight: true,
        enableDirectionalLight: true,
        ambientLightIntensity: 0.7,
        ambientLightX: 0,
        ambientLightY: 200,
        ambientLightZ: 0,
        directionalLightIntensity: 0.8,
        dirLightX: 100,
        dirLightY: 0,
        dirLightZ: 260,

        // objects
        controlPoint1: -3,
        controlPoint2: 8,
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
