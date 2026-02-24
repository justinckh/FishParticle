uniform float uTime; // Uniform to control animation time
uniform vec2 uResolution; // Viewport resolution
uniform float uSize; // Base size of particles
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform float uColorDensity;
varying vec3 vColor;


#include ../includes/simplexNoise3d.glsl

void main()
{

    // Calculate noise for current, intermediate, and target positions
    float noise = simplexNoise3d(position *uColorDensity+uTime);

    //float uTime = mod(uTime,3.141592653589793238462643383279502884197);
    float ix = position.x;
    float iy = position.y;
    float iz = position.z;

    vec3 transformed = vec3(position);
    transformed.y = sin((iy*sin(uTime) +30.0*sin(uTime*.5))*0.3*sin(iz*0.02+uTime)) + iy;
    //transformed.y = sin((ix*sin(uTime) +30.0*sin(uTime*.5))*0.3*sin(iz*0.02+uTime)) + iy;


    // Final position
    vec4 modelPosition = modelMatrix * vec4(transformed, 1.0);
    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectedPosition = projectionMatrix * viewPosition;
    gl_Position = projectedPosition;

    // Point size
    gl_PointSize = uSize ;
    gl_PointSize = uSize * uResolution.y;
    gl_PointSize *= (1.0 / - viewPosition.z);
    //gl_PointSize *= 30.0;

    // Interpolate color
    vColor= mix(uColorA, uColorB, noise);
    //vColor = mix(AB, uColorC, noise);
}

