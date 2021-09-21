import React, { useEffect, useRef } from 'react';
import { Engine } from '../engine';

export const TechTalk = () => {
  const canvasScene = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      Engine.initScene('TechTalk', {
        options: {
          canvas: canvasScene.current,
          antialias: true,
          alpha: true
        },
        sceneName: 'TechTalkScene'
      });
    }
  }, [canvasScene]);

  return (

      <canvas ref={canvasScene} id="element" style={{
        // position: 'fixed',
        // top: 0,
        // left: 0,
        // outline: 'none',
        // zIndex: -10
      }}>
      </canvas>

  );
}
