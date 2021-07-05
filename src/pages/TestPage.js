import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { LineBasicMaterial } from 'three';


function SphereToQuads(g) {
  let p = g.parameters;
  let segmentsX = p.widthSegments;
  let segmentsY = p.heightSegments-2;
  let mainShift = segmentsX + 1;
  let indices = [];
  for (let i = 0; i < segmentsY + 1; i++) {
    let index11 = 0;
    let index12 = 0;
    for (let j = 0; j < segmentsX; j++) {
      index11 = (segmentsX + 1) * i + j;
      index12 = index11 + 1;
      let index21 = index11;
      let index22 = index11 + (segmentsX + 1);
      indices.push(index11 + mainShift, index12 + mainShift);
      if (index22 < ((segmentsX + 1) * (segmentsY + 1) - 1)) {
        indices.push(index21 + mainShift, index22 + mainShift);
      }
    }
    if ((index12 + segmentsX + 1) <= ((segmentsX + 1) * (segmentsY + 1) - 1)) {
      indices.push(index12 + mainShift, index12 + segmentsX + 1 + mainShift);
    }
  }

  let lastIdx = indices[indices.length - 1] + 2;

  // poles
  for(let i = 0; i < segmentsX; i++){
  	//top
    indices.push(i, i + mainShift, i, i + mainShift + 1);

    // bottom
    let idx = lastIdx + i;
    let backShift = mainShift + 1;
    indices.push(idx, idx - backShift, idx, idx - backShift + 1);
  }

  g.setIndex(indices);
}


const initializeAnimation = canvas => {
  const canvasHeight = canvas.parentElement.clientHeight;
  const canvasWidth = canvas.parentElement.clientWidth;

  const parameters = {
    maxParticleCount: 1000,
    particleCount: 600,
    radius: 800,
    effects: {
      showDots: true,
      showLines: true,
      minDistance: 100,
      limitConnections: false,
      maxConnections: 20,
      particleCount: 600
    }
  };

  const HeroAnimation = {
    createRenderer: function() {
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas
      });
      renderer.setSize(canvasWidth, canvasHeight);
      return renderer;
    },
    createScene: function() {
      const scene = new THREE.Scene();
      return scene;
    },
    createCamera: function() {
      const camera = new THREE.PerspectiveCamera(
        75,
        canvasWidth / canvasHeight
      );
      camera.position.z = 500;
      return camera;
    },
    animatedLines: {
      particlesData: [],
      group: new THREE.Group(),
      particlePositions: new Float32Array(parameters.maxParticleCount * 3),
      positions: new Float32Array(parameters.maxParticleCount * parameters.maxParticleCount * 3),
      colors: new Float32Array(parameters.maxParticleCount * parameters.maxParticleCount * 3),
      halfRadius: parameters.radius / 2,
      init: function() {
        const pointsMaterial = new THREE.PointsMaterial({
          color: 0xFFFFFF,
					size: 3,
					blending: THREE.AdditiveBlending,
					transparent: true,
					sizeAttenuation: false
        });
        const particles = new THREE.BufferGeometry();

        for (let i = 0; i < parameters.maxParticleCount; i ++) {
          const x = Math.random() * parameters.radius - this.halfRadius;
          const y = Math.random() * parameters.radius - this.halfRadius;
          const z = Math.random() * parameters.radius - this.halfRadius;
          this.particlePositions[i * 3] = x;
					this.particlePositions[i * 3 + 1] = y;
					this.particlePositions[i * 3 + 2] = z;
          this.particlesData.push({
            velocity: new THREE.Vector3(
              - 1 + Math.random() * 2,
              - 1 + Math.random() * 2,
              - 1 + Math.random() * 2
            ),
						numConnections: 0
          });
        }
        particles.setDrawRange(0, parameters.particleCount);
        particles.setAttribute(
          'position',
          new THREE.BufferAttribute(this.particlePositions, 3).setUsage(THREE.DynamicDrawUsage)
        );

        this.pointCloud = new THREE.Points(particles, pointsMaterial);
        this.pointCloud.visible = parameters.effects.showDots;
        this.group.add(this.pointCloud);

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute(
          'position',
          new THREE.BufferAttribute(this.positions, 3).setUsage(THREE.DynamicDrawUsage)
        );
				geometry.setAttribute(
          'color',
          new THREE.BufferAttribute(this.colors, 3).setUsage(THREE.DynamicDrawUsage)
        );
        geometry.computeBoundingSphere();
        geometry.setDrawRange(0, 0);
        const material = new THREE.LineBasicMaterial({
          vertexColors: true,
					blending: THREE.AdditiveBlending,
					transparent: true
        });
        this.lineMesh = new THREE.LineSegments(geometry, material);
        this.lineMesh.visible = parameters.effects.showLines;
        this.group.add(this.lineMesh);
      },
      update: function(time) {
        let vertexPos = 0;
        let colorPos = 0;
        let numConnected = 0;

        for(let i = 0; i < parameters.particleCount; i++) {
          this.particlesData[i].numConnections = 0;
        }
        for(let i = 0; i < parameters.particleCount; i++) {
          const particleData = this.particlesData[i];

          this.particlePositions[i * 3] += particleData.velocity.x;
					this.particlePositions[i * 3 + 1] += particleData.velocity.y;
					this.particlePositions[i * 3 + 2] += particleData.velocity.z;

          const xParticlePosition = this.particlePositions[i * 3];
          const yParticlePosition = this.particlePositions[i * 3 + 1];
          const zParticlePosition = this.particlePositions[i * 3 + 2];

          if(yParticlePosition < -this.halfRadius || yParticlePosition > this.halfRadius)
            particleData.velocity.y = -particleData.velocity.y;

          if(xParticlePosition < -this.halfRadius || xParticlePosition > this.halfRadius)
            particleData.velocity.x = -particleData.velocity.x;

          if(zParticlePosition < -this.halfRadius || zParticlePosition > this.halfRadius)
            particleData.velocity.z = -particleData.velocity.z;

          if(parameters.effects.limitConnections && particleData.numConnections >= parameters.effects.maxConnections)
            continue;

          // Check collision
          for(let j = i + 1; j < parameters.particleCount; j++) {
            const particleDataB = this.particlesData[j];
            if(parameters.effects.limitConnections && particleDataB.numConnections >= parameters.effects.maxConnections)
              continue;

            const dx = this.particlePositions[i * 3] - this.particlePositions[j * 3];
            const dy = this.particlePositions[i * 3 + 1] - this.particlePositions[j * 3 + 1];
            const dz = this.particlePositions[i * 3 + 2] - this.particlePositions[j * 3 + 2];
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

            if(distance < parameters.effects.minDistance) {
              particleData.numConnections++;
							particleDataB.numConnections++;

              const alpha = 1.0 - distance / parameters.effects.minDistance;

              this.positions[vertexPos++] = this.particlePositions[i * 3];
							this.positions[vertexPos++] = this.particlePositions[i * 3 + 1];
							this.positions[vertexPos++] = this.particlePositions[i * 3 + 2];

							this.positions[vertexPos++] = this.particlePositions[j * 3];
							this.positions[vertexPos++] = this.particlePositions[j * 3 + 1];
							this.positions[vertexPos++] = this.particlePositions[j * 3 + 2];

							this.colors[colorPos++] = alpha;
							this.colors[colorPos++] = alpha;
							this.colors[colorPos++] = alpha;

              // We set the next alpha so we can gradient the colors.
              this.colors[colorPos++] = alpha;
							this.colors[colorPos++] = alpha;
							this.colors[colorPos++] = alpha;

							numConnected++;
            }
          }
        }

        this.lineMesh.geometry.setDrawRange(0, numConnected * 2);
        this.lineMesh.geometry.attributes.position.needsUpdate = true;
				this.lineMesh.geometry.attributes.color.needsUpdate = true;
        this.pointCloud.geometry.attributes.position.needsUpdate = true;
        // this.group.rotation.y = time * 0.00015;
      }
    },
    init: function() {
      console.log('Begin initialization...');
      this.renderer = this.createRenderer();
      this.scene = this.createScene();

      this.animatedLines.init();
      this.scene.add(this.animatedLines.group);
      this.animatedLines.group.rotation.y = Math.PI * 0.25;

      console.log('Initialization done!');
      this.renderer.setAnimationLoop(this.update());
      console.log('Animation started!');
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        this.animatedLines.update(time);
        this.renderer.render(this.scene, this.createCamera());
      }
    }
  }

  return HeroAnimation;
}


const initializeBlurredAnimation = canvas => {
  const canvasHeight = canvas.parentElement.clientHeight;
  const canvasWidth = canvas.parentElement.clientWidth;

  const HeroAnimation = {
    createRenderer: function() {
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        canvas
      });
      renderer.setSize(canvasWidth, canvasHeight);
      return renderer;
    },
    createScene: function() {
      const scene = new THREE.Scene();
      return scene;
    },
    createCamera: function() {
      const camera = new THREE.PerspectiveCamera(
        75,
        canvasWidth / canvasHeight
      );
      camera.position.z = 500;
      return camera;
    },
    sphereHero: {
      group: new THREE.Group(),
      rotatingGroup: new THREE.Group(),
      init: function() {
        const pointsGeometry = new THREE.SphereBufferGeometry(250, 16, 16);
        const pointsMaterial = new THREE.PointsMaterial({
          size: 5,
          sizeAttenuation: true,
          color: 0xffffff,
          blending: THREE.AdditiveBlending
        })
        const pointCloud = new THREE.Points(pointsGeometry, pointsMaterial);
        this.rotatingGroup.add(pointCloud);

        const lineGeometry = new THREE.SphereBufferGeometry(250, 16, 16);
        SphereToQuads(lineGeometry);
        const lineMaterial = new LineBasicMaterial({ color: 0x747474 });
        const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
        this.rotatingGroup.add(lineMesh)

        this.group.add(this.rotatingGroup);
        this.group.rotation.z = -Math.PI * 0.15;

        // geometry.clearGroups();
        // geometry.addGroup(0, Infinity, 0);
        // geometry.addGroup(0, Infinity, 1);
      },
      update: function(time) {
        this.rotatingGroup.rotation.y = time * 0.0001;
      }
    },
    init: function() {
      console.log('Begin initialization...');
      this.renderer = this.createRenderer();
      this.scene = this.createScene();

      this.sphereHero.init();
      this.scene.add(this.sphereHero.group);

      console.log('Initialization done!');
      this.renderer.setAnimationLoop(this.update());
      console.log('Animation started!');
    },
    update: function() {
      console.log('Begining animation...');
      return time => {
        this.sphereHero.update(time);
        this.renderer.render(this.scene, this.createCamera());
      }
    }
  }

  return HeroAnimation;
}

export const TestPage = () => {
  const canvasScene = useRef(null);
  const blurredCanvas = useRef(null);

  useEffect(() => {
    if(canvasScene) {
      let HeroAnimation = initializeAnimation(canvasScene.current);
      HeroAnimation.init();
    }
  }, [canvasScene]);

  useEffect(() => {
    if(blurredCanvas) {
      let BlurredAnimation = initializeBlurredAnimation(blurredCanvas.current);
      BlurredAnimation.init();
    }
  }, [blurredCanvas])

  return (
    <div className="hero-container">
      <canvas ref={canvasScene} style={{
        width: '100vw',
        height: '100vh',
        position: 'absolute',
        zIndex: '-2'
      }}>
      </canvas>
      <canvas ref={blurredCanvas} className="blurred" style={{
        width: '100vw',
        height: '100vh',
        position: 'absolute',
        zIndex: '-1',
      }}>
      </canvas>
    </div>
  );
}
