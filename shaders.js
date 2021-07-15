const ringedPulseFragment = `
  uniform float uTime;
  uniform int uDetailSteps;
  uniform vec3 uResolution;

  varying vec2 vUv;

  #define time uTime*0.15
  #define tau 6.2831853

  mat2 makem2(in float theta){float c = cos(theta);float s = sin(theta);return mat2(c,-s,s,c);}
  float rand(float n){return fract(sin(n) * 43758.5453123);}

  float noise(in float p)
  {
    float fl = floor(p);
    float fc = fract(p);
    return mix(rand(fl), rand(fl + 1.0), fc);
  }

  float rand(vec2 n) { 
    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
  }
  
  float noise(vec2 p){
    vec2 ip = floor(p);
    vec2 u = fract(p);
    u = u*u*(3.0-2.0*u);
    
    float res = mix(
      mix(rand(ip),rand(ip+vec2(1.0,0.0)),u.x),
      mix(rand(ip+vec2(0.0,1.0)),rand(ip+vec2(1.0,1.0)),u.x),u.y);
    return res*res;
  }

  float fbm(in vec2 p)
  {
    float z=2.;
    float rz = 0.;
    vec2 bp = p;
    for (float i= 1.;i < 6.;i++)
    {
      rz+= abs((noise(p)-0.5)*2.)/z;
      z = z*2.;
      p = p*2.;
    }
    return rz;
  }

  float dualfbm(in vec2 p)
  {
      //get two rotated fbm calls and displace the domain
    vec2 p2 = p*.7;
    vec2 basis = vec2(fbm(p2-time*1.6),fbm(p2+time*1.7));
    basis = (basis-.5)*.2;
    p += basis;

    //coloring
    return fbm(p*makem2(time*0.2));
  }

  float circ(vec2 p)
  {
    float r = length(p);
    r = log(sqrt(r));
    return abs(mod(r*4.,tau)-3.14)*3.+.2;

  }

  void mainImage( out vec4 fragColor, in vec2 fragCoord )
  {
    //setup system
    vec2 p = vUv-0.5;
    // p.x *= uResolution.x/uResolution.y;
    p*=4.;

      float rz = dualfbm(p);

    //rings
    p /= exp(mod(time*10.,3.14159));
    rz *= pow(abs((0.1-circ(p))),.9);

    //final color
    vec3 col = vec3(.2,0.1,0.4)/rz;
    col=pow(abs(col),vec3(.99));
    fragColor = vec4(col,1.);
  }

  void main()
  {
    mainImage(gl_FragColor, gl_FragCoord.xy);
  }
`
