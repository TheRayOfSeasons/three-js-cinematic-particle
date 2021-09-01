import * as THREE from 'three';

const noise = () => `
  float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                        vec2(12.9898,78.233)))
                * 43758.5453123);
  }

  // Value noise by Inigo Quilez - iq/2013
  // https://www.shadertoy.com/view/lsf3WH
  float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    vec2 u = f*f*(3.0-2.0*f);
    return mix( mix( random( i + vec2(0.0,0.0) ),
                    random( i + vec2(1.0,0.0) ), u.x),
                mix( random( i + vec2(0.0,1.0) ),
                    random( i + vec2(1.0,1.0) ), u.x), u.y);
  }

  mat2 rotate2d(float angle){
    return mat2(cos(angle),-sin(angle),
                sin(angle),cos(angle));
  }

  float lines(in vec2 pos, float b){
    float scale = 5.0;
    pos *= scale;
    return smoothstep(0.0,
                    .5+b*.5,
                    abs((sin(pos.x*3.1415)+b*2.0))*.5);
  }
`

const createShaderRipplingSphere = ({ camera }) => {
  return {
    camera,
    group: new THREE.Group(),
    clock: new THREE.Clock(),
    parameters: {
      radius: 8,
    },
    init: function() {
      this.geometry = new THREE.SphereBufferGeometry(this.parameters.radius, 128, 128);
      this.material = new THREE.MeshNormalMaterial();
      this.material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0.0 },
          uMidRadius: { value: this.parameters.radius },
          uSurfaceColor: { value: new THREE.Color('#e7e7e7') },
          uDepthColor: { value: new THREE.Color('#a9a9a9') },
        },
        vertexShader: `
          uniform float uTime;

          varying float vElevation;

          struct Spherical
          {
            float radius;
            float phi;
            float theta;
          };

          Spherical cartesianToSpherical(vec3 cartesianCoords)
          {
            float x = cartesianCoords.x;
            float y = cartesianCoords.y;
            float z = cartesianCoords.z;
            float radius = sqrt(x * x + y * y + z * z);
            float phi = atan(x, z);
            float phi = atan(
              sqrt(
                pow(cartesianCoords.x, 2)
                + pow(cartesianCoords.y, 2)
              ),
              cartesianCoords.z
            );
            return Spherical(radius, phi, theta);
          }

          void main()
          {
            vec4 modelPosition = modelMatrix * vec4(position, 1.0);

          }
        `
      });
      this.mesh = new THREE.Mesh(this.geometry, this.material);
      this.group.add(this.mesh);
    },
    update: function() {

    }
  }
}

export { createShaderRipplingSphere };
