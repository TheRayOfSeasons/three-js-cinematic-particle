import React, { useRef, useEffect } from 'react';
import { GUI } from 'three/examples/jsm/libs/dat.gui.module';
import { applyAnimation } from '../three-animations/animations';

export const SampleCube = () => {
  const animationCanvas = useRef(null);

  useEffect(() => {
    if(!animationCanvas)
      return;

    const animation = applyAnimation({
      canvas: animationCanvas.current,
      animationName: 'SampleCube'
      // }
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
