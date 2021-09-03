import { ToneMapping } from "three";

export const ShaderUtils = {
  permute: () => `
    vec4 permute(vec4 x)
    {
        return mod(((x*34.0)+1.0)*x, 289.0);
    }
  `,
  taylorInvSqrt: () => `
    vec4 taylorInvSqrt(vec4 r)
    {
        return 1.79284291400159 - 0.85373472095314 * r;
    }
  `,
  fade: () => `
    vec3 fade(vec3 t)
    {
        return t*t*t*(t*(t*6.0-15.0)+10.0);
    }
  `,
  cnoise: () => `
    // Classic Perlin 3D Noise
    // by Stefan Gustavson

    ${ShaderUtils.permute()}
    ${ShaderUtils.taylorInvSqrt()}
    ${ShaderUtils.fade()}

    float cnoise(vec3 P)
    {
        vec3 Pi0 = floor(P); // Integer part for indexing
        vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
        Pi0 = mod(Pi0, 289.0);
        Pi1 = mod(Pi1, 289.0);
        vec3 Pf0 = fract(P); // Fractional part for interpolation
        vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
        vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
        vec4 iy = vec4(Pi0.yy, Pi1.yy);
        vec4 iz0 = Pi0.zzzz;
        vec4 iz1 = Pi1.zzzz;

        vec4 ixy = permute(permute(ix) + iy);
        vec4 ixy0 = permute(ixy + iz0);
        vec4 ixy1 = permute(ixy + iz1);

        vec4 gx0 = ixy0 / 7.0;
        vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
        gx0 = fract(gx0);
        vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
        vec4 sz0 = step(gz0, vec4(0.0));
        gx0 -= sz0 * (step(0.0, gx0) - 0.5);
        gy0 -= sz0 * (step(0.0, gy0) - 0.5);

        vec4 gx1 = ixy1 / 7.0;
        vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
        gx1 = fract(gx1);
        vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
        vec4 sz1 = step(gz1, vec4(0.0));
        gx1 -= sz1 * (step(0.0, gx1) - 0.5);
        gy1 -= sz1 * (step(0.0, gy1) - 0.5);

        vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
        vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
        vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
        vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
        vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
        vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
        vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
        vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

        vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
        g000 *= norm0.x;
        g010 *= norm0.y;
        g100 *= norm0.z;
        g110 *= norm0.w;
        vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
        g001 *= norm1.x;
        g011 *= norm1.y;
        g101 *= norm1.z;
        g111 *= norm1.w;

        float n000 = dot(g000, Pf0);
        float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
        float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
        float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
        float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
        float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
        float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
        float n111 = dot(g111, Pf1);

        vec3 fade_xyz = fade(Pf0);
        vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
        vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
        float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x);
        return 2.2 * n_xyz;
    }
  `,
  snoise: () => `
    vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }

    float snoise(vec2 v){
      const vec4 C = vec4(0.211324865405187, 0.366025403784439,
              -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy) );
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod(i, 289.0);
      vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
      + i.x + vec3(0.0, i1.x, 1.0 ));
      vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
        dot(x12.zw,x12.zw)), 0.0);
      m = m*m ;
      m = m*m ;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
  `,
  voronoise: () => `
    vec3 hash3( vec2 p ){
        vec3 q = vec3( dot(p,vec2(127.1,311.7)),
              dot(p,vec2(269.5,183.3)),
              dot(p,vec2(419.2,371.9)) );
      return fract(sin(q)*43758.5453);
    }

    float iqnoise( in vec2 x, float u, float v ){
      vec2 p = floor(x);
      vec2 f = fract(x);

      float k = 1.0+63.0*pow(1.0-v,4.0);

      float va = 0.0;
      float wt = 0.0;
        for( int j=-2; j<=2; j++ )
        for( int i=-2; i<=2; i++ )
        {
            vec2 g = vec2( float(i),float(j) );
        vec3 o = hash3( p + g )*vec3(u,u,1.0);
        vec2 r = g - f + o.xy;
        float d = dot(r,r);
        float ww = pow( 1.0-smoothstep(0.0,1.414,sqrt(d)), k );
        va += o.z*ww;
        wt += ww;
        }

        return va/wt;
    }
  `,
  fractalNoise: () => `
    const float pi2 = radians(360.);

    // A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm.
    uint hash( uint x ) {
        x += ( x << 10u );
        x ^= ( x >>  6u );
        x += ( x <<  3u );
        x ^= ( x >> 11u );
        x += ( x << 15u );
        return x;
    }



    // Compound versions of the hashing algorithm I whipped together.
    uint hash( uvec2 v ) { return hash( v.x ^ hash(v.y)                         ); }
    uint hash( uvec3 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z)             ); }
    uint hash( uvec4 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w) ); }



    // Construct a float with half-open range [0:1] using low 23 bits.
    // All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.
    float floatConstruct( uint m ) {
        const uint ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask
        const uint ieeeOne      = 0x3F800000u; // 1.0 in IEEE binary32

        m &= ieeeMantissa;                     // Keep only mantissa bits (fractional part)
        m |= ieeeOne;                          // Add fractional part to 1.0

        float  f = uintBitsToFloat( m );       // Range [1:2]
        return f - 1.0;                        // Range [0:1]
    }



    // Pseudo-random value in half-open range [0:1].
    float random( float x ) { return floatConstruct(hash(floatBitsToUint(x))); }
    float random( vec2  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
    float random( vec3  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
    float random( vec4  v ) { return floatConstruct(hash(floatBitsToUint(v))); }


    vec2 random_unit_vector(vec2 uv)
    {
        float theta = random(uv)*pi2;
        return vec2(cos(theta), sin(theta));
    }


    vec3 random_unit_vector(vec3 uv)
    {
        const vec3 offset = vec3(531.2346,652.56,567.3);

        float theta = random(uv)*pi2;
        float phi = acos(1. - 2. * random(uv+offset));
        vec3 unit_vec;
        unit_vec.x = sin(phi) * cos(theta);
        unit_vec.y = sin(phi) * sin(theta);
        unit_vec.z = cos(phi);

        return unit_vec;
    }

    vec2 smooth_func(vec2 x)
    {
        return x*x*x*((6.*x - 15.)*x + 10.);
    }

    vec3 smooth_func(vec3 x)
    {
        return x*x*x*((6.*x - 15.)*x + 10.);
    }

    float value_noise(vec2 uv)
    {
        vec2 lv = smoothstep(0., 1., fract(uv));
        vec2 id = floor(uv);

        float lb = random(id);
        float rb = random(id + vec2(1., 0.));
        float lt = random(id + vec2(0., 1.));
      float rt = random(id + vec2(1., 1.));

        return mix(mix(lb, rb, lv.x), mix(lt, rt, lv.x), lv.y);
    }

    float value_noise(vec3 uv)
    {
        vec3 lv = smoothstep(0., 1., fract(uv));
        vec3 id = floor(uv);

        float lbf = random(id);
        float rbf = random(id + vec3(1., 0., 0.));
        float ltf = random(id + vec3(0., 1., 0.));
      float rtf = random(id + vec3(1., 1., 0.));

        float lbb = random(id + vec3(0., 0., 1.));
        float rbb = random(id + vec3(1., 0., 1.));
        float ltb = random(id + vec3(0., 1., 1.));
      float rtb = random(id + vec3(1., 1., 1.));

        float front = mix(mix(lbf, rbf, lv.x), mix(ltf, rtf, lv.x), lv.y);
        float back = mix(mix(lbb, rbb, lv.x), mix(ltb, rtb, lv.x), lv.y);
        return mix(front, back, lv.z);
    }

    float perlin_noise(vec2 uv)
    {
        vec2 lv = fract(uv);
        vec2 id = floor(uv);

        vec2 lb, rb, lt, rt;

        lb = random_unit_vector(id);
        rb = random_unit_vector(id + vec2(1., 0.));
        lt = random_unit_vector(id + vec2(0., 1.));
        rt = random_unit_vector(id + vec2(1., 1.));

        float dlb = dot(lb, lv);
      float drb = dot(rb, lv - vec2(1., 0.));
        float dlt = dot(lt, lv - vec2(0., 1.));
        float drt = dot(rt, lv - vec2(1., 1.));

        lv = smooth_func(lv);

        return mix(mix(dlb, drb, lv.x), mix(dlt, drt, lv.x), lv.y)*1.41421356*0.5+0.5;
    }

    float perlin_noise(vec3 uv)
    {
        vec3 lv = fract(uv);
        vec3 id = floor(uv);

        vec3 lbf, rbf, ltf, rtf, lbb, rbb, ltb, rtb;

        lbf = random_unit_vector(id);
        rbf = random_unit_vector(id + vec3(1., 0., 0.));
        ltf = random_unit_vector(id + vec3(0., 1., 0.));
        rtf = random_unit_vector(id + vec3(1., 1., 0.));
        lbb = random_unit_vector(id + vec3(0., 0., 1.));
        rbb = random_unit_vector(id + vec3(1., 0., 1.));
        ltb = random_unit_vector(id + vec3(0., 1., 1.));
        rtb = random_unit_vector(id + vec3(1., 1., 1.));

        float dlbf = dot(lbf, lv);
      float drbf = dot(rbf, lv - vec3(1., 0., 0.));
        float dltf = dot(ltf, lv - vec3(0., 1., 0.));
        float drtf = dot(rtf, lv - vec3(1., 1., 0.));

        float dlbb = dot(lbb, lv - vec3(0., 0., 1.));
      float drbb = dot(rbb, lv - vec3(1., 0., 1.));
        float dltb = dot(ltb, lv - vec3(0., 1., 1.));
        float drtb = dot(rtb, lv - vec3(1., 1., 1.));

        lv = smooth_func(lv);

        float f = mix(mix(dlbf, drbf, lv.x), mix(dltf, drtf, lv.x), lv.y);
        float b = mix(mix(dlbb, drbb, lv.x), mix(dltb, drtb, lv.x), lv.y);

        return mix(f, b, lv.z)*1.154700538*0.5+0.5;
    }

    float fractal_noise(vec2 uv, float octaves)
    {
        float c = 0.;
        float s = 0.;
        for(float i = 0.; i < octaves; i++)
        {
            float a = pow(2., i);
            float b = 1. / a;
            c += perlin_noise(uv*a)*b;
            s += b;
        }

        return c / s;
    }

    float fractal_noise(vec3 uv, float octaves)
    {
        float c = 0.;
        float s = 0.;
        for(float i = 0.; i < octaves; i++)
        {
            float a = pow(2., i);
            float b = 1. / a;
            c += perlin_noise(uv*a)*b;
            s += b;
        }

        return c / s;
    }
  `
}

export const fractals = () => `
const float pi2 = radians(360.);
const float ripple = 0.001;
const float scale = 1.0;
const float balance = 6.0;
const float speed = 0.1;

// A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm.
uint hash( uint x ) {
    x += ( x << 10u );
    x ^= ( x >>  6u );
    x += ( x <<  3u );
    x ^= ( x >> 11u );
    x += ( x << 15u );
    return x;
}


// Compound versions of the hashing algorithm I whipped together.
uint hash( uvec2 v ) { return hash( v.x ^ hash(v.y)                         ); }
uint hash( uvec3 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z)             ); }
uint hash( uvec4 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w) ); }



// Construct a float with half-open range [0:1] using low 23 bits.
// All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.
float floatConstruct( uint m ) {
    const uint ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask
    const uint ieeeOne      = 0x3F800000u; // 1.0 in IEEE binary32

    m &= ieeeMantissa;                     // Keep only mantissa bits (fractional part)
    m |= ieeeOne;                          // Add fractional part to 1.0

    float  f = uintBitsToFloat( m );       // Range [1:2]
    return f - 1.0;                        // Range [0:1]
}



// Pseudo-random value in half-open range [0:1].
float random( float x ) { return floatConstruct(hash(floatBitsToUint(x))); }
float random( vec2  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
float random( vec3  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
float random( vec4  v ) { return floatConstruct(hash(floatBitsToUint(v))); }


vec2 random_unit_vector(vec2 uv)
{
    float theta = random(uv)*pi2;    
    return vec2(cos(theta), sin(theta));
}


vec3 random_unit_vector(vec3 uv)
{
    const vec3 offset = vec3(531.2346,652.56,567.3);
    
    float theta = random(uv)*pi2;
    float phi = acos(1. - 2. * random(uv+offset));
    vec3 unit_vec;
    unit_vec.x = sin(phi) * cos(theta);
    unit_vec.y = sin(phi) * sin(theta);
    unit_vec.z = cos(phi);
    
    return unit_vec;
}

vec2 smooth_func(vec2 x)
{
    return x*x*x*((6.*x - 15.)*x + 10.);
}

vec3 smooth_func(vec3 x)
{
    return x*x*x*((6.*x - 15.)*x + 10.);
}

float value_noise(vec2 uv)
{
    vec2 lv = smoothstep(0., 1., fract(uv));
    vec2 id = floor(uv);
    
    float lb = random(id);
    float rb = random(id + vec2(1., 0.));
    float lt = random(id + vec2(0., 1.));
	float rt = random(id + vec2(1., 1.));

    return mix(mix(lb, rb, lv.x), mix(lt, rt, lv.x), lv.y);
}

float value_noise(vec3 uv)
{
    vec3 lv = smoothstep(0., 1., fract(uv));
    vec3 id = floor(uv);
    
    float lbf = random(id);
    float rbf = random(id + vec3(1., 0., 0.));
    float ltf = random(id + vec3(0., 1., 0.));
	float rtf = random(id + vec3(1., 1., 0.));
    
    float lbb = random(id + vec3(0., 0., 1.));
    float rbb = random(id + vec3(1., 0., 1.));
    float ltb = random(id + vec3(0., 1., 1.));
	float rtb = random(id + vec3(1., 1., 1.));
	
    float front = mix(mix(lbf, rbf, lv.x), mix(ltf, rtf, lv.x), lv.y);
    float back = mix(mix(lbb, rbb, lv.x), mix(ltb, rtb, lv.x), lv.y);
    return mix(front, back, lv.z);
}

float perlin_noise(vec2 uv)
{
    vec2 lv = fract(uv);
    vec2 id = floor(uv);
    
    vec2 lb, rb, lt, rt;
    
    lb = random_unit_vector(id);
    rb = random_unit_vector(id + vec2(1., 0.));
    lt = random_unit_vector(id + vec2(0., 1.));
    rt = random_unit_vector(id + vec2(1., 1.));
    
    float dlb = dot(lb, lv);
	float drb = dot(rb, lv - vec2(1., 0.));
    float dlt = dot(lt, lv - vec2(0., 1.));
    float drt = dot(rt, lv - vec2(1., 1.));

    lv = smooth_func(lv);

    return mix(mix(dlb, drb, lv.x), mix(dlt, drt, lv.x), lv.y)*1.41421356*0.5+0.5;
}

float perlin_noise(vec3 uv)
{
    vec3 lv = fract(uv);
    vec3 id = floor(uv);
    
    vec3 lbf, rbf, ltf, rtf, lbb, rbb, ltb, rtb;

    lbf = random_unit_vector(id);
    rbf = random_unit_vector(id + vec3(1., 0., 0.));
    ltf = random_unit_vector(id + vec3(0., 1., 0.));
    rtf = random_unit_vector(id + vec3(1., 1., 0.));
    lbb = random_unit_vector(id + vec3(0., 0., 1.));
    rbb = random_unit_vector(id + vec3(1., 0., 1.));
    ltb = random_unit_vector(id + vec3(0., 1., 1.));
    rtb = random_unit_vector(id + vec3(1., 1., 1.));
    
    float dlbf = dot(lbf, lv);
	float drbf = dot(rbf, lv - vec3(1., 0., 0.));
    float dltf = dot(ltf, lv - vec3(0., 1., 0.));
    float drtf = dot(rtf, lv - vec3(1., 1., 0.));
    
    float dlbb = dot(lbb, lv - vec3(0., 0., 1.));
	float drbb = dot(rbb, lv - vec3(1., 0., 1.));
    float dltb = dot(ltb, lv - vec3(0., 1., 1.));
    float drtb = dot(rtb, lv - vec3(1., 1., 1.));
    
    lv = smooth_func(lv);
    
    float f = mix(mix(dlbf, drbf, lv.x), mix(dltf, drtf, lv.x), lv.y);
    float b = mix(mix(dlbb, drbb, lv.x), mix(dltb, drtb, lv.x), lv.y);

    return mix(f, b, lv.z)*1.154700538*scale+scale;
}

float fractal_noise(vec2 uv, float octaves)
{
    float c = 0.;
    float s = 0.;
    for(float i = 0.; i < octaves; i++)
    {
        float a = pow(2., i);
        float b = 1. / a;
        c += perlin_noise(uv*a)*b;
        s += b;
    }
    
    return c / s;
}

float fractal_noise(vec3 uv, float octaves)
{
    float c = 0.;
    float s = 0.;
    for(float i = 0.; i < octaves; i++)
    {
        float a = pow(2., i);
        float b = 1. / a;
        c += perlin_noise(uv*a)*b;
        s += b;
    }
    
    return c / s;
}

float noise(vec2 uv)
{
    return fractal_noise(vec3(uv, uTime * speed), ripple);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * balance - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float getFractalPattern(vec2 uv)
{
  vec3 pattern = hsv2rgb(vec3(noise(uv)*10., 1., 1.));
  float steppedPattern = sin(pattern.x) + sin(pattern.y) + cos(pattern.z);
  steppedPattern = smoothstep(0.0, 3.2, steppedPattern);
  return steppedPattern;
}
`;




// temp
// const float pi2 = radians(360.);

// const float ripple = 0.001;
// const float scale = 0.75;
// const float balance = 6.0;

// // A single iteration of Bob Jenkins' One-At-A-Time hashing algorithm.
// uint hash( uint x ) {
//     x += ( x << 10u );
//     x ^= ( x >>  6u );
//     x += ( x <<  3u );
//     x ^= ( x >> 11u );
//     x += ( x << 15u );
//     return x;
// }



// // Compound versions of the hashing algorithm I whipped together.
// uint hash( uvec2 v ) { return hash( v.x ^ hash(v.y)                         ); }
// uint hash( uvec3 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z)             ); }
// uint hash( uvec4 v ) { return hash( v.x ^ hash(v.y) ^ hash(v.z) ^ hash(v.w) ); }



// // Construct a float with half-open range [0:1] using low 23 bits.
// // All zeroes yields 0.0, all ones yields the next smallest representable value below 1.0.
// float floatConstruct( uint m ) {
//     const uint ieeeMantissa = 0x007FFFFFu; // binary32 mantissa bitmask
//     const uint ieeeOne      = 0x3F800000u; // 1.0 in IEEE binary32

//     m &= ieeeMantissa;                     // Keep only mantissa bits (fractional part)
//     m |= ieeeOne;                          // Add fractional part to 1.0

//     float  f = uintBitsToFloat( m );       // Range [1:2]
//     return f - 1.0;                        // Range [0:1]
// }



// // Pseudo-random value in half-open range [0:1].
// float random( float x ) { return floatConstruct(hash(floatBitsToUint(x))); }
// float random( vec2  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
// float random( vec3  v ) { return floatConstruct(hash(floatBitsToUint(v))); }
// float random( vec4  v ) { return floatConstruct(hash(floatBitsToUint(v))); }


// vec2 random_unit_vector(vec2 uv)
// {
//     float theta = random(uv)*pi2;    
//     return vec2(cos(theta), sin(theta));
// }


// vec3 random_unit_vector(vec3 uv)
// {
//     const vec3 offset = vec3(531.2346,652.56,567.3);
    
//     float theta = random(uv)*pi2;
//     float phi = acos(1. - 2. * random(uv+offset));
//     vec3 unit_vec;
//     unit_vec.x = sin(phi) * cos(theta);
//     unit_vec.y = sin(phi) * sin(theta);
//     unit_vec.z = cos(phi);
    
//     return unit_vec;
// }

// vec2 smooth_func(vec2 x)
// {
//     return x*x*x*((6.*x - 15.)*x + 10.);
// }

// vec3 smooth_func(vec3 x)
// {
//     return x*x*x*((6.*x - 15.)*x + 10.);
// }

// float value_noise(vec2 uv)
// {
//     vec2 lv = smoothstep(0., 1., fract(uv));
//     vec2 id = floor(uv);
    
//     float lb = random(id);
//     float rb = random(id + vec2(1., 0.));
//     float lt = random(id + vec2(0., 1.));
// 	float rt = random(id + vec2(1., 1.));

//     return mix(mix(lb, rb, lv.x), mix(lt, rt, lv.x), lv.y);
// }

// float value_noise(vec3 uv)
// {
//     vec3 lv = smoothstep(0., 1., fract(uv));
//     vec3 id = floor(uv);
    
//     float lbf = random(id);
//     float rbf = random(id + vec3(1., 0., 0.));
//     float ltf = random(id + vec3(0., 1., 0.));
// 	float rtf = random(id + vec3(1., 1., 0.));
    
//     float lbb = random(id + vec3(0., 0., 1.));
//     float rbb = random(id + vec3(1., 0., 1.));
//     float ltb = random(id + vec3(0., 1., 1.));
// 	float rtb = random(id + vec3(1., 1., 1.));
	
//     float front = mix(mix(lbf, rbf, lv.x), mix(ltf, rtf, lv.x), lv.y);
//     float back = mix(mix(lbb, rbb, lv.x), mix(ltb, rtb, lv.x), lv.y);
//     return mix(front, back, lv.z);
// }

// float perlin_noise(vec2 uv)
// {
//     vec2 lv = fract(uv);
//     vec2 id = floor(uv);
    
//     vec2 lb, rb, lt, rt;
    
//     lb = random_unit_vector(id);
//     rb = random_unit_vector(id + vec2(1., 0.));
//     lt = random_unit_vector(id + vec2(0., 1.));
//     rt = random_unit_vector(id + vec2(1., 1.));
    
//     float dlb = dot(lb, lv);
// 	float drb = dot(rb, lv - vec2(1., 0.));
//     float dlt = dot(lt, lv - vec2(0., 1.));
//     float drt = dot(rt, lv - vec2(1., 1.));

//     lv = smooth_func(lv);

//     return mix(mix(dlb, drb, lv.x), mix(dlt, drt, lv.x), lv.y)*1.41421356*0.5+0.5;
// }

// float perlin_noise(vec3 uv)
// {
//     vec3 lv = fract(uv);
//     vec3 id = floor(uv);
    
//     vec3 lbf, rbf, ltf, rtf, lbb, rbb, ltb, rtb;

//     lbf = random_unit_vector(id);
//     rbf = random_unit_vector(id + vec3(1., 0., 0.));
//     ltf = random_unit_vector(id + vec3(0., 1., 0.));
//     rtf = random_unit_vector(id + vec3(1., 1., 0.));
//     lbb = random_unit_vector(id + vec3(0., 0., 1.));
//     rbb = random_unit_vector(id + vec3(1., 0., 1.));
//     ltb = random_unit_vector(id + vec3(0., 1., 1.));
//     rtb = random_unit_vector(id + vec3(1., 1., 1.));
    
//     float dlbf = dot(lbf, lv);
// 	float drbf = dot(rbf, lv - vec3(1., 0., 0.));
//     float dltf = dot(ltf, lv - vec3(0., 1., 0.));
//     float drtf = dot(rtf, lv - vec3(1., 1., 0.));
    
//     float dlbb = dot(lbb, lv - vec3(0., 0., 1.));
// 	float drbb = dot(rbb, lv - vec3(1., 0., 1.));
//     float dltb = dot(ltb, lv - vec3(0., 1., 1.));
//     float drtb = dot(rtb, lv - vec3(1., 1., 1.));
    
//     lv = smooth_func(lv);
    
//     float f = mix(mix(dlbf, drbf, lv.x), mix(dltf, drtf, lv.x), lv.y);
//     float b = mix(mix(dlbb, drbb, lv.x), mix(dltb, drtb, lv.x), lv.y);

//     return mix(f, b, lv.z)*1.154700538*scale+scale;
// }

// float fractal_noise(vec2 uv, float octaves)
// {
//     float c = 0.;
//     float s = 0.;
//     for(float i = 0.; i < octaves; i++)
//     {
//         float a = pow(2., i);
//         float b = 1. / a;
//         c += perlin_noise(uv*a)*b;
//         s += b;
//     }
    
//     return c / s;
// }

// float fractal_noise(vec3 uv, float octaves)
// {
//     float c = 0.;
//     float s = 0.;
//     for(float i = 0.; i < octaves; i++)
//     {
//         float a = pow(2., i);
//         float b = 1. / a;
//         c += perlin_noise(uv*a)*b;
//         s += b;
//     }
    
//     return c / s;
// }

// float noise(vec2 uv)
// {
//     return fractal_noise(vec3(uv, iTime*0.2), ripple);
// }

// vec3 hsv2rgb(vec3 c) {
//   vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 1.0);
//   vec3 p = abs(fract(c.xxx + K.xyz) * balance - K.www);
//   return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
// }

// void mainImage( out vec4 fragColor, in vec2 fragCoord )
// {
//     vec2 uv = (fragCoord/iResolution.y) * 2.0;
    
// 	// fragColor = vec4(hsv2rgb(vec3(noise(uv)*10., 1., 1.)), 1.);
//     vec3 pattern = hsv2rgb(vec3(noise(uv)*10., 1., 1.));
//     fragColor = vec4(vec3(pattern.x), 1.);
// }