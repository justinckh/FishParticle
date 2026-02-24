varying vec3 vColor;
uniform float uBlurr;
uniform sampler2D uSprite;

void main()
{
    //float alpha = 1.0 - smoothstep(0.4, 0.5, distanceToCenter); // Smooth edge of particles
    vec2 uv = gl_PointCoord;
    float distanceToCentre =length(uv-0.5);
    float alpha = 0.05/distanceToCentre-uBlurr;
    gl_FragColor = vec4(vColor, alpha);

        // Sample the texture
    // vec4 spriteColor = texture2D(uSprite, uv);
    
    // // Calculate distance to center for optional effects
    // float distanceToCentre = length(uv - 0.5);
    
    // // Optionally, use alpha from texture or create your own
    // float alpha = spriteColor.a; // Use the alpha from the texture
    // // Alternatively, combine with distance-based alpha
    // // float alpha = spriteColor.a * (1.0 - smoothstep(0.4, 0.5, distanceToCentre));
    
    // // Combine sprite color with interpolated color
    // vec3 finalColor = vColor * spriteColor.rgb;
    
    // gl_FragColor = vec4(finalColor, alpha - uBlurr); // Adjust as needed

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}