const a = {
  initializeGroup1: function() {
    const geometry = new THREE.SphereGeometry(1, 24, 24);
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0.0 },
        uColor: { value: new THREE.Color('#0f0f0f') },
      },
      vertexShader: `
        uniform float uTime;

        void main()
        {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vec4 modelPosition = modelMatrix * vec4(position, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          gl_PointSize = 10.0 / -viewPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;

        void main()
        {
          gl_FragColor = vec4(uColor, 1.0);
        }
      `,
    });
    this.mesh = new THREE.LineSegments(geometry, this.material);
    this.meshGroup1 = new THREE.Group();
    this.meshGroup1.add(this.mesh);
    this.meshGroup1.rotation.z = -Math.PI * 0.15;
    this.scene.add(this.meshGroup1);
  },
  initializeGroup2: function() {
    const meshCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new THREE.Float32BufferAttribute([
      1, 0, 0,
      0, 1, 0,
      -1, 0, 0,
      0, 0, 1,
    ], 3);
    geometry.setAttribute('position', positions);
    const material = new THREE.PointsMaterial({ size: 0.1 });

    this.meshGroup2 = new THREE.Group();
    const radius = 2;
    const vector = new Vector3();
    for (let i = meshCount; i >= 0; i--) {
      const phi = Math.acos(-1 + (2 * i) / meshCount);
      const theta = Math.sqrt(meshCount * Math.PI) * phi;
      vector.setFromSphericalCoords(radius, phi, theta);
      const mesh = new THREE.Points(geometry, material);
      mesh.lookAt(vector);
      mesh.position.set(vector.x, vector.y, vector.z);
      this.meshGroup2.add(mesh);
      // console.log(mesh);
    }

    this.scene.add(this.meshGroup2);
  },
}