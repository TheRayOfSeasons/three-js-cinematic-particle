import * as THREE from 'three';

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

const createAnimatedLines = () => {
  return {
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
  }
}

export { createAnimatedLines };
