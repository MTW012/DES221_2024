// const arrayOK = (x) => {
//   return (x && Array.isArray(x) && x.length > 0);
// }


// const removeChildren = (elem) => {
//   while (elem.childElementCount > 0) {
//     elem.removeChild(elem.lastChild);
//   }
// }

// let globalBeat = 0;
// let lastWholeBeat = 0;
// let lastBeatTime = 0;
// let tempo = 120;
// let tatum = (60000 / 16) / tempo;
// let renderTR;

class CustomGraphics extends HTMLElement {

  // A utility function for creating a new html element with given id and class
  static newElement(tag, id, clsName) {
    const elem = document.createElement(tag);
    elem.className = clsName;
    elem.id = id;
    return elem;
  }

  constructor() {
    // Always call super first in constructor
    super();
    
    this.canvasWidth = 800;
    this.canvasHeight = 600;
    this.running = false;

    this.mouseX = 0;
    this.mouseY = 0;
    this.lastTime = performance.now() / 1000;
    this.frame = 0;
    
    // get access to the DOM tree for this element
    const shadow = this.attachShadow({mode: 'open'});

    // Apply customMidi external stylesheet to the shadow dom
    const styleLinkElem = document.createElement('link');
    styleLinkElem.setAttribute('rel', 'stylesheet');
    styleLinkElem.setAttribute('href', 'components/GraphicsComponent/GraphicsComponent.css');

    // we also want prism.css stylesheet for syntax highlighting shader code
    const prismStyleLinkElem = document.createElement('link');
    prismStyleLinkElem.setAttribute('rel', 'stylesheet');
    prismStyleLinkElem.setAttribute('href', 'components/GraphicsComponent/lib/prism.css'); 

    // Attach the created elements to the shadow dom
    shadow.appendChild(styleLinkElem);
    shadow.appendChild(prismStyleLinkElem);

    // load opengl matrix library
    const glScriptElem = document.createElement('script');
    glScriptElem.setAttribute('src', 'components/GraphicsComponent/lib/gl-matrix.js');
    shadow.appendChild(glScriptElem);

    // and load prism syntax highlighting library
    const prismScriptElem = document.createElement('script');
    prismScriptElem.setAttribute('src', 'components/GraphicsComponent/lib/prism.js');
    shadow.appendChild(prismScriptElem);

    // create a top level full width strip to hold the component
    this.mainStrip = CustomGraphics.newElement('div', 'customGraphicsMainStrip', 'custom-graphics main-strip vertical-panel');
    shadow.appendChild(this.mainStrip);

    // expand/collapse component
    this.titlePanel = CustomGraphics.newElement('div', 'customGraphicsTitlePanel', 'title-panel-collapsed horizontal-panel');
    this.mainStrip.appendChild(this.titlePanel);

    this.expandCollapseButton = CustomGraphics.newElement('button', 'customGraphicsExpandCollapseButton', 'expand-collapse-button collapsed');
    this.expandCollapseButton.innerHTML = "+";
    this.expandCollapseButton.addEventListener('click', (event) => {
      if (this.mainPanel.style.visibility !== 'visible') {
        this.mainPanel.style.visibility = 'visible';
        this.expandCollapseButton.innerHTML = "-";
        this.expandCollapseButton.classList.remove('collapsed');
        this.expandCollapseButton.classList.add('expanded');
        this.titlePanel.classList.remove('title-panel-collapsed');
        this.titlePanel.classList.add('title-panel-expanded');
      } else {
        this.mainPanel.style.visibility = 'collapse';
        this.expandCollapseButton.innerHTML = "+";
        this.expandCollapseButton.classList.remove('expanded');
        this.expandCollapseButton.classList.add('collapsed');
        this.titlePanel.classList.remove('title-panel-expanded');
        this.titlePanel.classList.add('title-panel-collapsed');
      }
    });
    this.titlePanel.appendChild(this.expandCollapseButton);

    this.mainLabel = CustomGraphics.newElement('div', 'CustomGraphicsMainLabel', 'custom-graphics-label');
    this.mainLabel.innerHTML = "Graphics";
    this.titlePanel.appendChild(this.mainLabel);

    // Create a top level panel, that need not be full width
    this.mainPanel = CustomGraphics.newElement('div', 'customGraphicsMainPanel', 'custom-graphics main-panel vertical-panel');
    this.mainPanel.style.visibility = 'collapse';
    this.mainStrip.appendChild(this.mainPanel);

    this.canvas = CustomGraphics.newElement('canvas', 'customGraphicsCanvas', 'custom-graphics-canvas');
    this.canvas.width = "1200";
    this.canvas.height = "800";
    this.mainPanel.appendChild(this.canvas);
    this.canvas.addEventListener('mousemove', this.setMousePosition.bind(this));
    this.gl = this.canvas.getContext('webgl2');

    // this.controlPanel = CustomGraphics.newElement('div', 'customGraphicsControlPanel', 'vertical custom-graphics-panel');
    // this.mainPanel.appendChild(this.controlPanel);
    this.canvasControls = CustomGraphics.newElement('div', 'customGraphicsControls', 'custom-graphics-panel horizontal-panel');
    this.mainPanel.appendChild(this.canvasControls);

    this.canvasPlayButton = CustomGraphics.newElement('button', 'customGraphicsCanvasRun', 'play-button toggled-off');
    this.canvasControls.appendChild(this.canvasPlayButton);
    this.canvasPlayButton.innerHTML = "Play";
    this.canvasPlayButton.addEventListener('click', (event) => {
      if (!this.running) { 
        this.running = true;
        requestAnimationFrame(this.render.bind(this));

        this.canvasPlayButton.innerHTML = "Pause";
        this.canvasPlayButton.classList.remove('toggled-off');
        this.canvasPlayButton.classList.add('toggled-on');
         
      } else {
        this.running = false;

        this.canvasPlayButton.innerHTML = "Play";
        this.canvasPlayButton.classList.remove('toggled-on');
        this.canvasPlayButton.classList.add('toggled-off');
      }
    });

    this.copyCodeButton = CustomGraphics.newElement('button', 'customGraphicsCopyButton', 'copy-button');
    this.copyCodeButton.innerHTML = "Copy from Clipboard";
    this.canvasControls.appendChild(this.copyCodeButton);
    this.copyCodeButton.addEventListener('click', async (event) => {
      const strCode = await navigator.clipboard.readText();
      // check that this looks like valid shaderToy code, with a mainImage function
      if (!strCode.match(/void\s+mainImage/)) {
        alert("The clipboard doesn't appear to have a valid shadertoy program in it");
        return;
      }
      this.setShaderToySource(strCode);
    });

    this.showCodeButton = CustomGraphics.newElement('button', 'customGraphicsShowCodeButton', 'show-button toggled-off');
    this.showCodeButton.innerHTML = "Show code";
    this.canvasControls.appendChild(this.showCodeButton);

    // Prism syntax highlighting prefers code to be in a <pre><code> ... </code></pre> context
    this.shaderToyCodePre = CustomGraphics.newElement('pre', 'customGraphicsCodePre', 'custom-graphics-code-pre language-glsl');
    this.mainPanel.appendChild(this.shaderToyCodePre);

    this.shaderToyCode = CustomGraphics.newElement('code', 'customGraphicsCode', 'custom-graphics-code language-glsl');
    this.shaderToyCodePre.appendChild(this.shaderToyCode);

    // hide code by default
    this.shaderToyCodePre.style.visibility = 'collapse';
    
    // show hide the code with the showCodeButton
    this.showCodeButton.addEventListener('click', (event) => {
      if (this.shaderToyCodePre.style.visibility !== 'visible') {
        this.shaderToyCodePre.style.visibility = 'visible';
        this.showCodeButton.innerHTML = "Hide code";
        this.showCodeButton.classList.remove('toggled-off');
        this.showCodeButton.classList.add('toggled-on');
      } else {
        this.shaderToyCodePre.style.visibility = 'collapse';
        this.showCodeButton.innerHTML = "Show code";
        this.showCodeButton.classList.remove('toggled-on');
        this.showCodeButton.classList.add('toggled-off');
      }
    });

    // setup opengl stuff
    this.buffers = this.initCanvasBuffers(this.gl);

    // setup default shaders
    // Vertex shader program for spectrogram. This does nothing but pass directly through
    // All the interesting stuff happens in the fragment shader
    this.vsSource = `# version 300 es
    in vec4 aVertexPosition;
    in vec2 aTextureCoord;

    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    out highp vec2 vTextureCoord;

    void main(void) {
      gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
      vTextureCoord = aTextureCoord;
    }
    `;

    // Fragment shader program for spectrogram
    this.fsPrefix = `# version 300 es
    precision highp float;
    in highp vec2 vTextureCoord;

    uniform vec3 iResolution;
    uniform float iTime;
    uniform float iTimeDelta;
    uniform int iFrame;
    uniform float iFrameRate;
    uniform vec4 iDate;
    uniform vec4 iMouse;
  
    `

    let shaderToySource = `
    // Protean clouds by nimitz (twitter: @stormoid)
    // https://www.shadertoy.com/view/3l23Rh
    // License Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported License
    // Contact the author for other licensing options

    /*
      Technical details:

      The main volume noise is generated from a deformed periodic grid, which can produce
      a large range of noise-like patterns at very cheap evalutation cost. Allowing for multiple
      fetches of volume gradient computation for improved lighting.

      To further accelerate marching, since the volume is smooth, more than half the density
      information isn't used to rendering or shading but only as an underlying volume	distance to 
      determine dynamic step size, by carefully selecting an equation	(polynomial for speed) to 
      step as a function of overall density (not necessarialy rendered) the visual results can be 
      the	same as a naive implementation with ~40% increase in rendering performance.

      Since the dynamic marching step size is even less uniform due to steps not being rendered at all
      the fog is evaluated as the difference of the fog integral at each rendered step.

    */

    mat2 rot(in float a){float c = cos(a), s = sin(a);return mat2(c,s,-s,c);}
    const mat3 m3 = mat3(0.33338, 0.56034, -0.71817, -0.87887, 0.32651, -0.15323, 0.15162, 0.69596, 0.61339)*1.93;
    float mag2(vec2 p){return dot(p,p);}
    float linstep(in float mn, in float mx, in float x){ return clamp((x - mn)/(mx - mn), 0., 1.); }
    float prm1 = 0.;
    vec2 bsMo = vec2(0);

    vec2 disp(float t){ return vec2(sin(t*0.22)*1., cos(t*0.175)*1.)*2.; }

    vec2 map(vec3 p)
    {
        vec3 p2 = p;
        p2.xy -= disp(p.z).xy;
        p.xy *= rot(sin(p.z+iTime)*(0.1 + prm1*0.05) + iTime*0.09);
        float cl = mag2(p2.xy);
        float d = 0.;
        p *= .61;
        float z = 1.;
        float trk = 1.;
        float dspAmp = 0.1 + prm1*0.2;
        for(int i = 0; i < 5; i++)
        {
        p += sin(p.zxy*0.75*trk + iTime*trk*.8)*dspAmp;
            d -= abs(dot(cos(p), sin(p.yzx))*z);
            z *= 0.57;
            trk *= 1.4;
            p = p*m3;
        }
        d = abs(d + prm1*3.)+ prm1*.3 - 2.5 + bsMo.y;
        return vec2(d + cl*.2 + 0.25, cl);
    }

    vec4 render( in vec3 ro, in vec3 rd, float time )
    {
      vec4 rez = vec4(0);
        const float ldst = 8.;
      vec3 lpos = vec3(disp(time + ldst)*0.5, time + ldst);
      float t = 1.5;
      float fogT = 0.;
      for(int i=0; i<130; i++)
      {
        if(rez.a > 0.99)break;

        vec3 pos = ro + t*rd;
            vec2 mpv = map(pos);
        float den = clamp(mpv.x-0.3,0.,1.)*1.12;
        float dn = clamp((mpv.x + 2.),0.,3.);
            
        vec4 col = vec4(0);
            if (mpv.x > 0.6)
            {
            
                col = vec4(sin(vec3(5.,0.4,0.2) + mpv.y*0.1 +sin(pos.z*0.4)*0.5 + 1.8)*0.5 + 0.5,0.08);
                col *= den*den*den;
          col.rgb *= linstep(4.,-2.5, mpv.x)*2.3;
                float dif =  clamp((den - map(pos+.8).x)/9., 0.001, 1. );
                dif += clamp((den - map(pos+.35).x)/2.5, 0.001, 1. );
                col.xyz *= den*(vec3(0.005,.045,.075) + 1.5*vec3(0.033,0.07,0.03)*dif);
            }
        
        float fogC = exp(t*0.2 - 2.2);
        col.rgba += vec4(0.06,0.11,0.11, 0.1)*clamp(fogC-fogT, 0., 1.);
        fogT = fogC;
        rez = rez + col*(1. - rez.a);
        t += clamp(0.5 - dn*dn*.05, 0.09, 0.3);
      }
      return clamp(rez, 0.0, 1.0);
    }

    float getsat(vec3 c)
    {
        float mi = min(min(c.x, c.y), c.z);
        float ma = max(max(c.x, c.y), c.z);
        return (ma - mi)/(ma+ 1e-7);
    }

    //from my "Will it blend" shader (https://www.shadertoy.com/view/lsdGzN)
    vec3 iLerp(in vec3 a, in vec3 b, in float x)
    {
        vec3 ic = mix(a, b, x) + vec3(1e-6,0.,0.);
        float sd = abs(getsat(ic) - mix(getsat(a), getsat(b), x));
        vec3 dir = normalize(vec3(2.*ic.x - ic.y - ic.z, 2.*ic.y - ic.x - ic.z, 2.*ic.z - ic.y - ic.x));
        float lgt = dot(vec3(1.0), ic);
        float ff = dot(dir, normalize(ic));
        ic += 1.5*dir*sd*ff*lgt;
        return clamp(ic,0.,1.);
    }

    void mainImage( out vec4 fragColor, in vec2 fragCoord )
    {	
      vec2 q = fragCoord.xy/iResolution.xy;
        vec2 p = (gl_FragCoord.xy - 0.5*iResolution.xy)/iResolution.y;
        bsMo = (iMouse.xy - 0.5*iResolution.xy)/iResolution.y;
        
        float time = iTime*3.;
        vec3 ro = vec3(0,0,time);
        
        ro += vec3(sin(iTime)*0.5,sin(iTime*1.)*0.,0);
            
        float dspAmp = .85;
        ro.xy += disp(ro.z)*dspAmp;
        float tgtDst = 3.5;
        
        vec3 target = normalize(ro - vec3(disp(time + tgtDst)*dspAmp, time + tgtDst));
        ro.x -= bsMo.x*2.;
        vec3 rightdir = normalize(cross(target, vec3(0,1,0)));
        vec3 updir = normalize(cross(rightdir, target));
        rightdir = normalize(cross(updir, target));
      vec3 rd=normalize((p.x*rightdir + p.y*updir)*1. - target);
        rd.xy *= rot(-disp(time + 3.5).x*0.2 + bsMo.x);
        prm1 = smoothstep(-0.4, 0.4,sin(iTime*0.3));
      vec4 scn = render(ro, rd, time);
        
        vec3 col = scn.rgb;
        col = iLerp(col.bgr, col.rgb, clamp(1.-prm1,0.05,1.));
        
        col = pow(col, vec3(.55,0.65,0.6))*vec3(1.,.97,.9);

        col *= pow( 16.0*q.x*q.y*(1.0-q.x)*(1.0-q.y), 0.12)*0.7+0.3; //Vign
        
      fragColor = vec4( col, 1.0 );
    }    

    `;
    
    this.fsPostfix = `
    
    out vec4 fragColor;
    void main() {
      mainImage(fragColor, gl_FragCoord.xy);
    }
    `;

    this.setShaderToySource(shaderToySource);

    //this.shaderProgram = this.initShaderProgram(this.gl, this.vsSource, this.fsSource);

    // this.programInfo = {
    //   program: this.shaderProgram,
    //   attribLocations: {
    //     vertexPosition: this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition'),
    //     textureCoord: this.gl.getAttribLocation(this.shaderProgram, 'aTextureCoord'),
    //   },
    //   uniformLocations: {
    //     projectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
    //     modelViewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
    //     resolution: this.gl.getUniformLocation(this.shaderProgram, "iResolution"),
    //     mouse: this.gl.getUniformLocation(this.shaderProgram, "iMouse"),
    //     time: this.gl.getUniformLocation(this.shaderProgram, "iTime"),
    //   },
    // }; 

  }


  // mouse tracking in the graphics canvas
  setMousePosition(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.mouseX = e.clientX - rect.left;
    this.mouseY = rect.height - (e.clientY - rect.top) - 1;  // bottom is 0 in WebGL
  }

  // Combines the copy/pasted code from shaderToy into our proper fragment shader
  combineFragmentShaderSources() {
    this.fsSource = this.fsPrefix + this.shaderToySource + this.fsPostfix;
  }
  
  // sets the shadertoy source in our fragment shader program, and also in the code display
  setShaderToySource(srcString) {
    this.shaderToySource = srcString;
    this.shaderToyCode.innerHTML = srcString.replace(/&/g, "&amp").replace(/</g, "&lt").replace(/>/g, "&gt");
    this.combineFragmentShaderSources();
    this.shaderProgram = this.initShaderProgram(this.gl, this.vsSource, this.fsSource);
    
    this.programInfo = {
      program: this.shaderProgram,
      attribLocations: {
        vertexPosition: this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition'),
        textureCoord: this.gl.getAttribLocation(this.shaderProgram, 'aTextureCoord'),
      },
      uniformLocations: {
        projectionMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: this.gl.getUniformLocation(this.shaderProgram, 'uModelViewMatrix'),
        resolution: this.gl.getUniformLocation(this.shaderProgram, "iResolution"),
        time: this.gl.getUniformLocation(this.shaderProgram, "iTime"),
        timeDelta: this.gl.getUniformLocation(this.shaderProgram, "iTimeDelta"),
        frame: this.gl.getUniformLocation(this.shaderProgram, "iFrame"),
        frameDelta: this.gl.getUniformLocation(this.shaderProgram, "iFrameDelta"),
        mouse: this.gl.getUniformLocation(this.shaderProgram, "iMouse"),
        date: this.gl.getUniformLocation(this.shaderProgram, "iDate"),        
      },
    }; 
  }

  initCanvasBuffers(gl) {

    // Create a buffer for the square's positions.
    const positionBuffer = gl.createBuffer();
  
    // Select the positionBuffer as the one to apply buffer
    // operations to from here out.
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  
    // Now create an array of positions for the square.
    const positions = [
      -1.0, -1.0,
       1.0, -1.0,
       1.0,  1.0,
      -1.0,  1.0,
    ];
  
    // Now pass the list of positions into WebGL to build the
    // shape. We do this by creating a Float32Array from the
    // JavaScript array, then use it to fill the current buffer.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  
    // Create the texture coordinates
    const textureCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);
  
    const textureCoordinates = [
      // Front
      0.0,  1.0,
      1.0,  1.0,
      1.0,  0.0,
      0.0,  0.0,
    ];
  
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);
  
    // Build the element array buffer; this specifies the indices
    // into the vertex arrays for each face's vertices.
    const indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  
    // This array defines each face as two triangles, using the
    // indices into the vertex array to specify each triangle's
    // position.
    const indices = [
      0,  1,  2,      0,  2,  3,
    ];
  
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
  
    return {
      position: positionBuffer,
      textureCoord: textureCoordBuffer,
      indices: indexBuffer,
    };
  }
  

  initTexture(gl) {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  pixel);
  
    // Turn off mips and set  wrapping to clamp to edge so it
    // will work regardless of the dimensions of the video.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  
    return texture;
  }
  

  updateTextureFromImage(gl, texture, image) {
    const level = 0;
    const internalFormat = gl.RGBA;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    //gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  srcFormat, srcType, image);
  }
  
  
  zeroTexture(gl, texture) {
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const blackPixel = new Uint8Array([0, 0, 0, 0]);  // transparent black
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border, srcFormat, srcType,
                  blackPixel);
  }
  

  // Main drawing routine for the video display
  render( time ) {
    const gl = this.gl;
    time *= 0.001
    const timeDelta = time - this.lastTime;
    this.lastTime = time;
    this.frame++;
    const frameRate = 1 / timeDelta;
    const today = new Date();

    gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
    gl.clearDepth(1.0);                 // Clear everything
    gl.enable(gl.DEPTH_TEST);           // Enable depth testing
    gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

    // Clear the canvas before we start drawing on it.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    const projectionMatrix = mat4.create();

    // Set the drawing position to the "identity" point, which is
    // the center of the scene.
    const modelViewMatrix = mat4.create();

    // Now move the drawing position a bit to where we want to
    // start drawing the square.
    // mat4.translate(modelViewMatrix,     // destination matrix
    //                modelViewMatrix,     // matrix to translate
    //                [poi.x, poi.y, -0.0]);

    // mat4.scale(modelViewMatrix,
    //            modelViewMatrix,
    //             [zoom, zoom, 1.0]);

    // mat4.translate(modelViewMatrix,     // destination matrix
    //                modelViewMatrix,     // matrix to translate
    //                [-1 * poi.x, -1 * poi.y, -0.0]);  // amount to translate


    // Tell WebGL how to pull out the positions from the position
    // buffer into the vertexPosition attribute.
    {
      const numComponents = 2;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.position);
      gl.vertexAttribPointer(
      this.programInfo.attribLocations.vertexPosition,
      numComponents,
      type,
      normalize,
      stride,
      offset);
      gl.enableVertexAttribArray(
      this.programInfo.attribLocations.vertexPosition);
    }

    // Tell WebGL how to pull out the texture coordinates from
    // the texture coordinate buffer into the textureCoord attribute.
    {
      const numComponents = 2;
      const type = gl.FLOAT;
      const normalize = false;
      const stride = 0;
      const offset = 0;
      gl.bindBuffer(gl.ARRAY_BUFFER, this.buffers.textureCoord);
      gl.vertexAttribPointer(
      this.programInfo.attribLocations.textureCoord,
      numComponents,
      type,
      normalize,
      stride,
      offset);
      gl.enableVertexAttribArray(
      this.programInfo.attribLocations.textureCoord);
    }

    // Tell WebGL which indices to use to index the vertices
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.buffers.indices);

    // Tell WebGL to use our program when drawing
    gl.useProgram(this.programInfo.program);

    // Set the shader uniforms
    gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.projectionMatrix,
      false,
      projectionMatrix);

    gl.uniformMatrix4fv(
      this.programInfo.uniformLocations.modelViewMatrix,
      false,
      modelViewMatrix);

    // Specify the texture to map onto the canvas.
    // We will store the experience image in texture unit 0
    // gl.activeTexture(gl.TEXTURE0);
    // gl.bindTexture(gl.TEXTURE_2D, experienceTexture);
    // gl.uniform1i(programInfo.uniformLocations.experienceImage, 0);

    // and the countdown in texture unit 1
    // gl.activeTexture(gl.TEXTURE0 + 1);
    // gl.bindTexture(gl.TEXTURE_2D, countdownTexture);
    // gl.uniform1i(programInfo.uniformLocations.countdownImage, 1);
    // gl.uniform1i(programInfo.uniformLocations.countdown, countdown);
    // gl.uniform1f(programInfo.uniformLocations.playhead, playhead);
    // gl.uniform1f(programInfo.uniformLocations.beat, b);
    // gl.uniform1f(programInfo.uniformLocations.viewportWidth, gl.drawingBufferWidth);
    // gl.uniform1f(programInfo.uniformLocations.viewportHeight, gl.drawingBufferHeight);
    // gl.uniform1f(programInfo.uniformLocations.gain1, gains[0]);
    // gl.uniform1f(programInfo.uniformLocations.gain2, gains[1]);
    // gl.uniform1f(programInfo.uniformLocations.gain3, gains[2]);
    // gl.uniform1f(programInfo.uniformLocations.gain4, gains[3]);
    // gl.uniform1f(programInfo.uniformLocations.gain5, gains[4]);
    // gl.uniform1f(programInfo.uniformLocations.gain6, gains[5]);
    
    gl.uniform3f(this.programInfo.uniformLocations.resolution, gl.canvas.width, gl.canvas.height, 1);
    gl.uniform1f(this.programInfo.uniformLocations.time, time);
    gl.uniform1f(this.programInfo.uniformLocations.timeDelta, timeDelta);
    gl.uniform1i(this.programInfo.uniformLocations.frame, this.frame);
    gl.uniform1f(this.programInfo.uniformLocations.frame, frameRate);
    gl.uniform4f(this.programInfo.uniformLocations.mouse, this.mouseX, this.mouseY, this.mouseX, this.mouseY);
    gl.uniform4f(this.programInfo.uniformLocations.date, today.getFullYear(), today.getMonth(), today.getDay(), today.getSeconds());

    { // process the textures into the quad
      const type = gl.UNSIGNED_SHORT;
      const offset = 0;
      const vertexCount = 6;
      gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
    }

    if (this.running) { 
      requestAnimationFrame(this.render.bind(this));
    }

  }

  
  loadShader(gl, type, source) {
    const shader = gl.createShader(type);
  
    // Send the source to the shader object
    gl.shaderSource(shader, source);
  
    // Compile the shader program
    gl.compileShader(shader);
  
    // See if it compiled successfully
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
  
    return shader;
  }
  
  
  initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = this.loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = this.loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  
    // Create the shader program
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
  
    // If creating the shader program failed, alert
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
      alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }
  
    return shaderProgram;
  }

}


customElements.define('custom-graphics', CustomGraphics);

/*
// ---------- CRUFT ----------- //

let playerCanvas = document.createElement('canvas');
playerCanvas.id = "playerCanvas";
playerCanvas.className = "simple-player";
//playerCanvas.setAttribute("style", "width: 100%; height: 100%;");
mainPanel.appendChild(playerCanvas);

let currentSectionName;
let currentSectionStartBeat = 0;
let currentSectionDuration = 128;
let switchSectionsAtBeat = 0;
let nextSectionDuration = 128;
let switchSectionsTrigger = false;
let nextSectionName;
let nextSectionMatrix;
let playerPlayheadPosition = 0;

// ------------- Canvas and Objects -------------- //
//let player_currFrameTexture;
let experienceTexture;
let countdownTexture;
let countdownTextures = [];

function initCanvasBuffers(gl) {

  // Create a buffer for the square's positions.
  const positionBuffer = gl.createBuffer();

  // Select the positionBuffer as the one to apply buffer
  // operations to from here out.
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  // Now create an array of positions for the square.
  const positions = [
    -1.0, -1.0,
     1.0, -1.0,
     1.0,  1.0,
    -1.0,  1.0,
  ];

  // Now pass the list of positions into WebGL to build the
  // shape. We do this by creating a Float32Array from the
  // JavaScript array, then use it to fill the current buffer.
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // Create the texture coordinates
  const textureCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordBuffer);

  const textureCoordinates = [
    // Front
    0.0,  1.0,
    1.0,  1.0,
    1.0,  0.0,
    0.0,  0.0,
  ];

  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoordinates), gl.STATIC_DRAW);

  // Build the element array buffer; this specifies the indices
  // into the vertex arrays for each face's vertices.
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

  // This array defines each face as two triangles, using the
  // indices into the vertex array to specify each triangle's
  // position.
  const indices = [
    0,  1,  2,      0,  2,  3,
  ];

  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

  return {
    position: positionBuffer,
    textureCoord: textureCoordBuffer,
    indices: indexBuffer,
  };
}


function initTexture(gl) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const pixel = new Uint8Array([0, 0, 255, 255]);  // opaque blue
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                pixel);

  // Turn off mips and set  wrapping to clamp to edge so it
  // will work regardless of the dimensions of the video.
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

  return texture;
}



function updateTextureFromImage(gl, texture, image) {
  const level = 0;
  const internalFormat = gl.RGBA;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  //gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                srcFormat, srcType, image);
}


function zeroTexture(gl, texture) {
  const level = 0;
  const internalFormat = gl.RGBA;
  const width = 1;
  const height = 1;
  const border = 0;
  const srcFormat = gl.RGBA;
  const srcType = gl.UNSIGNED_BYTE;
  const blackPixel = new Uint8Array([0, 0, 0, 0]);  // transparent black
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                width, height, border, srcFormat, srcType,
                blackPixel);
}


// Main drawing routine for the video display
function drawPlayerCanvas( gl, programInfo, buffers, playhead, b, gains) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);  // Clear to black, fully opaque
  gl.clearDepth(1.0);                 // Clear everything
  gl.enable(gl.DEPTH_TEST);           // Enable depth testing
  gl.depthFunc(gl.LEQUAL);            // Near things obscure far things

  // Clear the canvas before we start drawing on it.
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  const projectionMatrix = mat4.create();

  // Set the drawing position to the "identity" point, which is
  // the center of the scene.
  const modelViewMatrix = mat4.create();

  // Now move the drawing position a bit to where we want to
  // start drawing the square.
  // mat4.translate(modelViewMatrix,     // destination matrix
  //                modelViewMatrix,     // matrix to translate
  //                [poi.x, poi.y, -0.0]);

  // mat4.scale(modelViewMatrix,
  //            modelViewMatrix,
  //             [zoom, zoom, 1.0]);

  // mat4.translate(modelViewMatrix,     // destination matrix
  //                modelViewMatrix,     // matrix to translate
  //                [-1 * poi.x, -1 * poi.y, -0.0]);  // amount to translate


  // Tell WebGL how to pull out the positions from the position
  // buffer into the vertexPosition attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.vertexAttribPointer(
    programInfo.attribLocations.vertexPosition,
    numComponents,
    type,
    normalize,
    stride,
    offset);
    gl.enableVertexAttribArray(
    programInfo.attribLocations.vertexPosition);
  }

  // Tell WebGL how to pull out the texture coordinates from
  // the texture coordinate buffer into the textureCoord attribute.
  {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.textureCoord);
    gl.vertexAttribPointer(
    programInfo.attribLocations.textureCoord,
    numComponents,
    type,
    normalize,
    stride,
    offset);
    gl.enableVertexAttribArray(
    programInfo.attribLocations.textureCoord);
  }

  // Tell WebGL which indices to use to index the vertices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

  // Tell WebGL to use our program when drawing
  gl.useProgram(programInfo.program);

  // Set the shader uniforms
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix);

  // Specify the texture to map onto the canvas.
  // We will store the experience image in texture unit 0
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, experienceTexture);
  gl.uniform1i(programInfo.uniformLocations.experienceImage, 0);

  // and the countdown in texture unit 1
  gl.activeTexture(gl.TEXTURE0 + 1);
  gl.bindTexture(gl.TEXTURE_2D, countdownTexture);
  gl.uniform1i(programInfo.uniformLocations.countdownImage, 1);
  gl.uniform1i(programInfo.uniformLocations.countdown, countdown);
  gl.uniform1f(programInfo.uniformLocations.playhead, playhead);
  gl.uniform1f(programInfo.uniformLocations.beat, b);
  gl.uniform1f(programInfo.uniformLocations.viewportWidth, gl.drawingBufferWidth);
  gl.uniform1f(programInfo.uniformLocations.viewportHeight, gl.drawingBufferHeight);
  gl.uniform1f(programInfo.uniformLocations.gain1, gains[0]);
  gl.uniform1f(programInfo.uniformLocations.gain2, gains[1]);
  gl.uniform1f(programInfo.uniformLocations.gain3, gains[2]);
  gl.uniform1f(programInfo.uniformLocations.gain4, gains[3]);
  gl.uniform1f(programInfo.uniformLocations.gain5, gains[4]);
  gl.uniform1f(programInfo.uniformLocations.gain6, gains[5]);

  // gl.uniform1f(programInfo.uniformLocations.contrast, contrast);
  // gl.uniform1f(programInfo.uniformLocations.viewportWidth, gl.drawingBufferWidth);
  // gl.uniform1f(programInfo.uniformLocations.gamma, gamma);
  // gl.uniform1f(programInfo.uniformLocations.verticalScale, verticalScale);

  { // process the textures into the quad
    const type = gl.UNSIGNED_SHORT;
    const offset = 0;
    const vertexCount = 6;
    gl.drawElements(gl.TRIANGLES, vertexCount, type, offset);
  }
}


function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  // Send the source to the shader object
  gl.shaderSource(shader, source);

  // Compile the shader program
  gl.compileShader(shader);

  // See if it compiled successfully
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}


function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  // Create the shader program
  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert('Unable to initialize the shader program: ' + gl.getProgramInfoLog(shaderProgram));
    return null;
  }

  return shaderProgram;
}


//const spectrogramCanvas = document.getElementById('spectrogramCanvas');
const player_gl = playerCanvas.getContext('webgl');

// opengl stuff
const player_buffers = initCanvasBuffers(player_gl);
// spectrogram_currFrameTexture = initTexture(spectrogram_gl);
// waveform_currFrameTexture = initTexture(spectrogram_gl);
// zeroTexture(spectrogram_gl, spectrogram_currFrameTexture);
// zeroTexture(spectrogram_gl, waveform_currFrameTexture);
experienceTexture = initTexture(player_gl);
zeroTexture(player_gl, experienceTexture);
for (let j=0; j<8; j++) {
  let x = initTexture(player_gl);
  zeroTexture(player_gl, x);
  countdownTextures.push(x);
}
countdownTexture = countdownTextures[7];


// Vertex shader program for spectrogram. This does nothing but pass directly through
// All the interesting stuff happens in the fragment shader
const player_vsSource = `
attribute vec4 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;

void main(void) {
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
  vTextureCoord = aTextureCoord;
}
`;

// Fragment shader program for spectrogram
const player_fsSource = `
varying highp vec2 vTextureCoord;
uniform sampler2D uExperienceImage;
uniform sampler2D uCountdownImage;
uniform int uCountdown;
uniform highp float uPlayhead;
uniform highp float uBeat;
uniform highp float uViewportWidth;
uniform highp float uViewportHeight;
uniform highp float uGain1;
uniform highp float uGain2;
uniform highp float uGain3;
uniform highp float uGain4;
uniform highp float uGain5;
uniform highp float uGain6;

const highp float PI = 3.1415926535897932384626433832795;

highp float sqr(highp float x) {
  return x * x;
}

// gaussian packet around angle phi
highp float localisation(highp float theta, highp float phi, highp float p) {
  highp float diff = abs(theta - phi);
  highp float diff2 = abs(diff - 2.0 * PI);
  highp float diff3 = min(diff, diff2);
  return exp(-1.0 * sqr(diff3) / (0.05 + p * 0.5));
}

// one-sided rays emanating from a ring of radius R depending on the gain
highp float radiation(highp float r, highp float R, highp float gain) {
  if (r < R) { 
    return 0.0;
  } else {
    return exp(-1.0 * sqr(r - R) / ((10.0 * gain + 0.05) * 0.001));
  }
}


// random noise
highp float rand(highp vec2 co){
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  highp float ar = uViewportWidth / uViewportHeight;

  highp vec2 vRelativeTextureCoord; // = vTextureCoord;
  // highp float scaledTextureHeight = pow(vTextureCoord.y, uGamma) * uVerticalScale;
  // highp vec4 texelColor1 = texture2D(uSpectrogram, vTextureCoord);
  // highp vec4 texelColor2 = texture2D(uWaveform, vTextureCoord);
  highp vec4 texelColor;

  // if (scaledTextureHeight > 1.0) {
  //   texelColor = vec4(1.0, 0.0, 0.0, 1.0);
  // } else {
  //   vRelativeTextureCoord = vec2(vTextureCoord.x, scaledTextureHeight);
  //   texelColor1 = texture2D(uSpectrogram, vRelativeTextureCoord);
  //   texelColor2 = texture2D(uWaveform, vRelativeTextureCoord);
  // }
  texelColor = vec4(1.0, 0.0, 0.0, 1.0);

  // highp vec4 vecContrast =  vec4(uContrast, uContrast, uContrast, 1.0);
  // texelColor1 = pow(texelColor1, vecContrast);
  // texelColor1 = clamp(texelColor1 * uGain1, 0.0, 1.0);
  // texelColor2 = clamp(texelColor2 * uGain2, 0.0, 1.0);

  // texelColor = clamp(texelColor1 + texelColor2, 0.0, 1.0);

  // if (abs(gl_FragCoord.x - uViewportWidth * uPlayhead) < 5.0) {
  //   gl_FragColor = vec4(1.0 - texelColor.r, 1.0 - texelColor.g, 1.0 - texelColor.b, 1.0);
  // } else {
  //   gl_FragColor = vec4(texelColor.rgb,1.0);
  // }

  // scaled coordinates
  highp float x;
  highp float y;
  if (uViewportWidth >= uViewportHeight) {
    x = (vTextureCoord.x - 0.5) * ar;
    y = (vTextureCoord.y - 0.5);
  } else {
    x = (vTextureCoord.x - 0.5);
    y = (vTextureCoord.y - 0.5) / ar;
  }
  vRelativeTextureCoord = vec2(x, y);

  // polar coordinates
  highp float r = sqrt(x*x + y*y);
  highp float theta = atan(y, x);
    
  // box around outer ring with a little padding (R = 0.4)
  highp vec2 boxCoordA = vec2((x * 0.4 + 0.5), (y * 0.4 + 0.5));
  highp vec2 boxCoordB = vec2((x * 2.0 + 0.5), (y * 2.0 + 0.5));

  // image samplers
  highp vec4 texelColor1; //
  highp vec4 texelColor2; // = texture2D(uCountdownImage, vRelativeTextureCoord);
  
  if (0.0 <= boxCoordA.x && boxCoordA.x < 1.0 && 0.0 <= boxCoordA.y && boxCoordA.y < 1.0) {
    texelColor1 = texture2D(uExperienceImage, boxCoordA);
  } else {
    texelColor1 = vec4(0.0, 0.0, 0.0, 0.0);
  }

  if (0.0 <= boxCoordB.x && boxCoordB.x < 1.0 && 0.0 <= boxCoordB.y && boxCoordB.y < 1.0) {
    texelColor2 = texture2D(uCountdownImage, boxCoordB);
  } else {
    texelColor2 = vec4(0.0, 0.0, 0.0, 0.0);
  }


  // striations round the circle
  highp float striation = sqr(cos(2.0 * PI * 12.0 * theta));

  highp float m4 = mod(uPlayhead * 4.0, 4.0);
  highp float m8 = mod(uPlayhead * 8.0, 8.0);
  highp float m16 = mod(uPlayhead * 16.0, 16.0);

  // angular positions for peak group activity
  highp float phi0 = mod(PI * (0.0 + m4), 2.0 * PI);
  highp float phi1 = mod(PI * (1.0 - m8), 2.0 * PI);
  
  highp float phi2 = mod(PI * (1.0 / 3.0 + m8), 2.0 * PI);
  highp float phi3 = mod(PI * (4.0 / 3.0 - m16), 2.0 * PI);
  
  highp float phi4 = mod(PI * (2.0 / 3.0 + m16), 2.0 * PI);
  highp float phi5 = mod(PI * (5.0 / 3.0 - m4), 2.0 * PI);

  highp float phase = fract(uBeat);
  highp float k0 = striation * radiation(r, 0.3, uGain1 * localisation(theta, phi0, phase));
  highp float k1 = striation * radiation(r, 0.3, uGain2 * localisation(theta, phi1, phase));
  highp float k2 = striation * radiation(r, 0.34, uGain3 * localisation(theta, phi2, phase));
  highp float k3 = striation * radiation(r, 0.34, uGain4 * localisation(theta, phi3, phase));
  highp float k4 = striation * radiation(r, 0.38, uGain5 * localisation(theta, phi4, phase));
  highp float k5 = striation * radiation(r, 0.38, uGain6 * localisation(theta, phi5, phase));

  highp float k = clamp(k0 + k1 + k2 + k3 + k4 + k5, 0.0, 1.0);
  // gl_FragColor = vec4(k, k, k, 0.8);
  
  if (uCountdown > 0) {
    gl_FragColor = vec4((0.2 + texelColor1.x * 0.8) * k + texelColor2.x, (0.2 + texelColor1.y * 0.8) * k + texelColor2.y, (0.2 + texelColor1.z * 0.8) * k + texelColor2.z, 0.8);
  } else {
    gl_FragColor = vec4((0.2 + texelColor1.x * 0.8) * k, (0.2 + texelColor1.y * 0.8) * k, (0.2 + texelColor1.z * 0.8) * k, 0.8);
  }
  
}
`;

const player_shaderProgram = initShaderProgram(player_gl, player_vsSource, player_fsSource);

const player_programInfo = {
  program: player_shaderProgram,
  attribLocations: {
    vertexPosition: player_gl.getAttribLocation(player_shaderProgram, 'aVertexPosition'),
    textureCoord: player_gl.getAttribLocation(player_shaderProgram, 'aTextureCoord'),
  },
  uniformLocations: {
    projectionMatrix: player_gl.getUniformLocation(player_shaderProgram, 'uProjectionMatrix'),
    modelViewMatrix: player_gl.getUniformLocation(player_shaderProgram, 'uModelViewMatrix'),
    experienceImage: player_gl.getUniformLocation(player_shaderProgram, 'uExperienceImage'),
    countdownImage: player_gl.getUniformLocation(player_shaderProgram, 'uCountdownImage'),
    countdown: player_gl.getUniformLocation(player_shaderProgram, 'uCountdown'),
    playhead: player_gl.getUniformLocation(player_shaderProgram, 'uPlayhead'),  
    beat: player_gl.getUniformLocation(player_shaderProgram, 'uBeat'),  
    viewportWidth: player_gl.getUniformLocation(player_shaderProgram, 'uViewportWidth'),
    viewportHeight: player_gl.getUniformLocation(player_shaderProgram, 'uViewportHeight'),
    gain1: player_gl.getUniformLocation(player_shaderProgram, 'uGain1'),
    gain2: player_gl.getUniformLocation(player_shaderProgram, 'uGain2'),
    gain3: player_gl.getUniformLocation(player_shaderProgram, 'uGain3'),
    gain4: player_gl.getUniformLocation(player_shaderProgram, 'uGain4'),
    gain5: player_gl.getUniformLocation(player_shaderProgram, 'uGain5'),
    gain6: player_gl.getUniformLocation(player_shaderProgram, 'uGain6'),    
  },
};



function loadExperienceImage(gl, imagePath) {
  const img = new Image();
  img.style.display = 'none';
  img.crossOrigin = 'anonymous';
  img.importance = 'high';
  experienceTexture = initTexture(gl);
  
  img.addEventListener('load', (event) => {
    updateTextureFromImage(gl, experienceTexture, img);
    // drawSpectrogram();
  });
  img.src = imagePath;
}


function loadCountdownImages(gl, imageDir) {
  for (let j=0; j<8; j++) {
    const img = new Image();
    img.style.display = 'none';
    img.crossOrigin = 'anonymous';
    img.importance = 'high';
    countdownTextures[j] = initTexture(gl);
    
    img.addEventListener('load', (event) => {
      updateTextureFromImage(gl, countdownTextures[j], img);
      // drawSpectrogram();
    });
    img.src = `${imageDir}/Countdown_${j+1}.png`;

  }
}

// ------- main render function ------- //
const renderPlayerFrame = () => {

  // update the peak vals
  for (let j=0; j<peakVals.length; j++) {
    peakVals[j] *= 0.85;
  }
  playerPlayheadPosition = (globalBeat - currentSectionStartBeat) / currentSectionDuration;
  drawPlayerCanvas(player_gl, player_programInfo, player_buffers, playerPlayheadPosition, globalBeat, peakVals);
  globalBeat += 1/16;
}

// ---- render loop ---- //
const renderAll = () => {
  renderPlayerFrame();
  // renderTransportFrame();
}

if (renderTR) { clearInterval(renderTR); }
renderTR = setInterval(renderAll, tatum);

*/