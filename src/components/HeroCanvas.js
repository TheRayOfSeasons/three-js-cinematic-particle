import React, { useEffect, useRef } from 'react';
import { Engine } from '../engine';

export const HeroCanvas = () => {
  const canvasScene = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      Engine.initScene('HeroScene', {
        options: {
          canvas: canvasScene.current,
          antialias: true,
          alpha: true
        },
        sceneName: 'HeroScene'
      });
    }
  }, [canvasScene]);

  return (
    <>
      <canvas ref={canvasScene} style={{
        position: 'fixed',
        top: 0,
        left: 0,
        outline: 'none',
        zIndex: -10
      }}>
      </canvas>
    </>
  )
}
