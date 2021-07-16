import * as THREE from 'three';


const sineWave = ({ value=0.0, amplitude=1, frequency=1.0, incremental=false, incrementalDegree=1, damping=false, dampFactor=1.0 }) => {
  let amp = amplitude + (damping ? dampFactor : 0); 
  let result = Math.sin(value * frequency) * amp;
  result += incremental ? value * incrementalDegree : 0;
  return result;
}

const createDampedSinePath = ({ waveArgs, start=0, end=10, incrementBy=1 }) => {
  const vectors = [];
  waveArgs = waveArgs || {
    frequency: 1.0,
    amplitude: 2.5,
    incremental: true,
    incrementalDegree: 1.0,
    damping: true,
    dampFactor: 1.0
  };
  for(let i = start, iInverse = end - 1; i < end; i += incrementBy, iInverse -= incrementBy) {
    const x = i;
    waveArgs['value'] = x;
    waveArgs['dampFactor'] = -iInverse * 0.15;
    const y = sineWave(waveArgs);
    const z = 0;
    vectors.push(new THREE.Vector3(x, y, z));
  }
  return vectors;
}


const createEnhancedAnimatedDots = () => {
  return {
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      let vectors = createDampedSinePath({
        start: -25.25,
        end: 5.25,
        incrementBy: 0.1,
        endOffset: 1,
        curveFactor: 1
      });
      const curve = new THREE.CatmullRomCurve3(vectors);
      const points = curve.getPoints(100);

      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({ color: '#ff0000' });
      const line = new THREE.Line(geometry, material);
      this.group.add(line);
    },
    update: function(time) {
    },
  }
}

export { createEnhancedAnimatedDots }
