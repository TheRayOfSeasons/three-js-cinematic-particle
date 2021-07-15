import * as THREE from 'three';

const createAmbientMeshParticles = ({ geometry, material, count }) => {
  return {
    geometry,
    material,
    parameters: {
      count: count || 1500,
    },
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    init: function() {
      this.rotatingGroup = new THREE.Group();

      const geometry = this.geometry;
      const material = this.material;
      geometry.computeVertexNormals();
      this.instancedMesh = new THREE.InstancedMesh(geometry, material, 8000);
      this.instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.rotatingGroup.add(this.instancedMesh);

      this.dummy = new THREE.Object3D();
      for (let i = 0; i < this.parameters.count; i++) {
        this.dummy.position.set(
          50 * (0.5 - Math.random()),
          50 * (0.5 - Math.random()),
          50 * (0.5 - Math.random())
        );
        this.dummy.updateMatrix();
        this.instancedMesh.setMatrixAt(i + 1, this.dummy.matrix);
      }

      this.group.add(this.rotatingGroup);
    },
    update: function(time) {
      this.rotatingGroup.rotation.y = time * 0.0001;
      if(this.instancedMesh) {
        this.instancedMesh.setMatrixAt(0, this.dummy.matrix);
        this.instancedMesh.instanceMatrix.needsUpdate = true;
      }
    }
  }
}

export { createAmbientMeshParticles };
