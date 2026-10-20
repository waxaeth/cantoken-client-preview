/* An interactive WebGL depth mesh built from the original CanToken hero artwork.
   The source image remains in the markup as an accessible, non-WebGL fallback. */
(() => {
  const visual = document.querySelector('.hero-visual');
  const artwork = visual?.querySelector('.hero-art');
  if (!visual || !artwork || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const WIDTH = 1672;
  const HEIGHT = 941;
  const scenes = [
    { name: 'Mountain water', polygon: [[413, 286], [572, 176], [766, 269], [806, 376], [641, 461], [422, 385]] },
    { name: 'Forest', polygon: [[731, 192], [867, 112], [1038, 160], [1085, 280], [936, 354], [735, 292]] },
    { name: 'Fields', polygon: [[1001, 260], [1103, 186], [1319, 223], [1361, 355], [1163, 451], [978, 354]] },
    { name: 'Mining', polygon: [[632, 340], [785, 294], [965, 363], [1008, 476], [830, 552], [629, 453]] },
    { name: 'Maple leaf', polygon: [[824, 393], [983, 330], [1156, 401], [1152, 529], [966, 607], [795, 509]] },
    { name: 'City', polygon: [[1104, 401], [1280, 326], [1483, 422], [1495, 568], [1298, 655], [1092, 543]] },
    { name: 'Wind farm', polygon: [[428, 502], [605, 423], [844, 513], [852, 664], [672, 749], [428, 630]] },
    { name: 'Harbour', polygon: [[830, 592], [1010, 511], [1240, 616], [1264, 772], [1098, 855], [826, 727]] },
    { name: 'Coast', polygon: [[1270, 521], [1467, 459], [1655, 532], [1670, 681], [1522, 781], [1283, 683]] },
  ];

  function contains(polygon, x, y) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j];
      if ((a[1] > y) !== (b[1] > y) && x < ((b[0] - a[0]) * (y - a[1])) / (b[1] - a[1]) + a[0]) inside = !inside;
    }
    return inside;
  }

  function cropScale(rect) {
    const boxAspect = rect.width / rect.height;
    const imageAspect = WIDTH / HEIGHT;
    return boxAspect < imageAspect ? [boxAspect / imageAspect, 1] : [1, imageAspect / boxAspect];
  }

  const canvas = document.createElement('canvas');
  canvas.className = 'hero-webgl';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('title', 'Move over an asset tile to animate its environment');
  visual.append(canvas);
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, powerPreference: 'low-power' });
  if (!gl) { canvas.remove(); return; }

  const masks = `
    float oval(vec2 p, vec2 c, vec2 r, float angle) {
      vec2 v = p - c;
      float s = sin(angle), co = cos(angle);
      v = vec2(co * v.x - s * v.y, s * v.x + co * v.y);
      return 1.0 - smoothstep(0.70, 1.02, length(v / r));
    }
    float maskFor(int scene, vec2 p) {
      if (scene == 0) return oval(p, vec2(.360,.335), vec2(.155,.154), -.16);
      if (scene == 1) return oval(p, vec2(.530,.248), vec2(.119,.137), .16);
      if (scene == 2) return oval(p, vec2(.697,.336), vec2(.128,.145), -.21);
      if (scene == 3) return oval(p, vec2(.492,.444), vec2(.112,.123), -.15);
      if (scene == 4) return oval(p, vec2(.584,.505), vec2(.123,.133), .12);
      if (scene == 5) return oval(p, vec2(.779,.520), vec2(.128,.152), -.20);
      if (scene == 6) return oval(p, vec2(.385,.621), vec2(.139,.153), -.15);
      if (scene == 7) return oval(p, vec2(.623,.734), vec2(.155,.158), -.10);
      if (scene == 8) return oval(p, vec2(.878,.655), vec2(.125,.146), -.10);
      return 0.0;
    }
  `;

  const vertexSource = `#version 300 es
    precision highp float;
    precision highp int;
    in vec2 a_uv;
    uniform float u_time;
    uniform float u_hover;
    uniform int u_scene;
    uniform vec2 u_crop;
    uniform vec2 u_tilt;
    out vec2 v_image_uv;
    out float v_height;
    ${masks}
    void main() {
      v_image_uv = .5 + (a_uv - .5) * u_crop;
      float area = maskFor(u_scene, v_image_uv);
      float pulse = sin(u_time * 1.7 + v_image_uv.x * 43.0 + v_image_uv.y * 21.0);
      float height = area * u_hover * (.15 + pulse * .011);
      vec2 point = vec2(a_uv.x * 2.0 - 1.0, 1.0 - a_uv.y * 2.0);
      vec2 cameraShift = vec2(u_tilt.x, -u_tilt.y) * height * .17;
      float perspective = 1.0 - height * .20;
      gl_Position = vec4((point + cameraShift) / perspective, height * .25, 1.0);
      v_height = height;
    }
  `;

  const fragmentSource = `#version 300 es
    precision highp float;
    precision highp int;
    uniform sampler2D u_art;
    uniform float u_time;
    uniform float u_hover;
    uniform int u_scene;
    in vec2 v_image_uv;
    in float v_height;
    out vec4 outColor;
    ${masks}
    void main() {
      float area = maskFor(u_scene, v_image_uv) * u_hover;
      vec2 uv = v_image_uv;
      float shimmer = 0.0;
      if (u_scene == 0 || u_scene == 7 || u_scene == 8) {
        float wave = sin(uv.y * 90.0 + u_time * 2.2 + sin(uv.x * 40.0));
        uv.x += wave * area * .0018;
        uv.y += cos(uv.x * 70.0 - u_time * 1.8) * area * .0010;
        shimmer = pow(max(0.0, wave), 7.0) * area * .13;
      } else if (u_scene == 1) {
        uv.x += (sin(u_time * 1.4) * .0028 + sin(uv.y * 28.0 + u_time * 1.8) * .0010) * area;
        shimmer = max(0.0, sin(uv.x * 90.0 + u_time * 1.8)) * area * .035;
      } else if (u_scene == 2) {
        uv.x += (sin(u_time * 1.8) * .0035 + sin(uv.y * 38.0 + u_time * 2.2) * .0013) * area;
        shimmer = max(0.0, sin((uv.x + uv.y) * 95.0 + u_time * 2.2)) * area * .075;
      } else if (u_scene == 3) {
        uv.x += sin(uv.y * 85.0 + u_time * 1.3) * area * .0025;
        shimmer = max(0.0, sin(uv.x * 220.0 + u_time * 1.7)) * area * .06;
      } else if (u_scene == 4) {
        shimmer = (sin(u_time * 2.2) * .5 + .5) * area * .13;
      } else if (u_scene == 5) {
        shimmer = pow(max(0.0, sin((uv.x * 220.0 + uv.y * 95.0) - u_time * 3.0)), 14.0) * area * .16;
      } else if (u_scene == 6) {
        uv.x += sin(u_time * 1.5 + uv.y * 24.0) * area * .0025;
        shimmer = max(0.0, sin(uv.x * 80.0 + u_time * 1.9)) * area * .05;
      }
      vec3 color = texture(u_art, clamp(uv, vec2(0.0), vec2(1.0))).rgb;
      float rim = (1.0 - maskFor(u_scene, v_image_uv)) * area * .18;
      vec3 light = (u_scene == 2 || u_scene == 3 || u_scene == 4) ? vec3(1.0,.76,.36) : vec3(.65,.86,1.0);
      color = min(vec3(1.0), color + light * (shimmer + rim) + vec3(v_height * .06));
      outColor = vec4(color, 1.0);
    }
  `;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) {
    console.warn('Interactive hero unavailable; showing the original artwork.', error);
    canvas.remove();
    return;
  }

  // A dense image-mapped mesh gives each glass tile independent depth on hover.
  const columns = 150, rows = 84;
  const coordinates = new Float32Array((columns + 1) * (rows + 1) * 2);
  const indices = new Uint16Array(columns * rows * 6);
  for (let y = 0; y <= rows; y++) for (let x = 0; x <= columns; x++) {
    const offset = (y * (columns + 1) + x) * 2;
    coordinates[offset] = x / columns;
    coordinates[offset + 1] = y / rows;
  }
  for (let y = 0, n = 0; y < rows; y++) for (let x = 0; x < columns; x++) {
    const a = y * (columns + 1) + x, b = a + 1, c = a + columns + 1, d = c + 1;
    indices[n++] = a; indices[n++] = c; indices[n++] = b;
    indices[n++] = b; indices[n++] = c; indices[n++] = d;
  }
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, coordinates, gl.STATIC_DRAW);
  const location = gl.getAttribLocation(program, 'a_uv');
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
  const indexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  const uniforms = Object.fromEntries(['u_art', 'u_time', 'u_hover', 'u_scene', 'u_crop', 'u_tilt'].map(name => [name, gl.getUniformLocation(program, name)]));
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  let scene = -1, target = 0, blend = 0, running = false, ready = false;
  let tilt = [0, 0], targetTilt = [0, 0], previousTime = 0, tapTimer;
  const size = [0, 0];
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const scale = Math.min(1, 2200 / Math.max(rect.width * dpr, rect.height * dpr));
    const w = Math.max(1, Math.round(rect.width * dpr * scale));
    const h = Math.max(1, Math.round(rect.height * dpr * scale));
    if (w !== size[0] || h !== size[1]) {
      canvas.width = size[0] = w;
      canvas.height = size[1] = h;
      gl.viewport(0, 0, w, h);
    }
    return rect;
  }

  function draw(time) {
    running = false;
    if (!ready || document.hidden) return;
    const elapsed = Math.min(.08, Math.max(.001, (time - (previousTime || time)) / 1000));
    previousTime = time;
    const easing = 1 - Math.exp(-elapsed * 8);
    blend += (target - blend) * easing;
    tilt[0] += (targetTilt[0] - tilt[0]) * easing;
    tilt[1] += (targetTilt[1] - tilt[1]) * easing;
    const rect = resize();
    const crop = cropScale(rect);
    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(uniforms.u_art, 0);
    gl.uniform1f(uniforms.u_time, time / 1000);
    gl.uniform1f(uniforms.u_hover, blend);
    gl.uniform1i(uniforms.u_scene, scene);
    gl.uniform2f(uniforms.u_crop, crop[0], crop[1]);
    gl.uniform2f(uniforms.u_tilt, tilt[0], tilt[1]);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    if (!visual.classList.contains('is-webgl')) visual.classList.add('is-webgl');
    if (target > 0 || blend > .003 || Math.abs(tilt[0]) + Math.abs(tilt[1]) > .003) requestDraw();
  }
  function requestDraw() {
    if (running || !ready) return;
    running = true;
    requestAnimationFrame(draw);
  }

  function sceneAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const crop = cropScale(rect);
    const u = .5 + ((clientX - rect.left) / rect.width - .5) * crop[0];
    const v = .5 + ((clientY - rect.top) / rect.height - .5) * crop[1];
    const x = u * WIDTH, y = v * HEIGHT;
    // Front-most glass tiles take precedence where their hit areas overlap.
    for (const i of [4, 8, 7, 5, 6, 3, 2, 1, 0]) if (contains(scenes[i].polygon, x, y)) return i;
    return -1;
  }
  function activate(event) {
    const next = sceneAt(event.clientX, event.clientY);
    if (next !== scene) { scene = next; blend = Math.min(blend, .25); }
    target = next < 0 ? 0 : 1;
    canvas.style.cursor = next < 0 ? 'default' : 'pointer';
    const rect = canvas.getBoundingClientRect();
    targetTilt = next < 0 ? [0, 0] : [((event.clientX - rect.left) / rect.width - .5) * 2, ((event.clientY - rect.top) / rect.height - .5) * 2];
    requestDraw();
  }
  canvas.addEventListener('pointermove', event => { if (event.pointerType !== 'touch') activate(event); });
  canvas.addEventListener('pointerleave', () => { target = 0; targetTilt = [0, 0]; canvas.style.cursor = 'default'; requestDraw(); });
  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    activate(event);
    clearTimeout(tapTimer);
    tapTimer = setTimeout(() => { target = 0; targetTilt = [0, 0]; requestDraw(); }, 2600);
  });
  canvas.addEventListener('webglcontextlost', event => { event.preventDefault(); visual.classList.remove('is-webgl'); canvas.remove(); });
  const observer = new ResizeObserver(requestDraw);
  observer.observe(canvas);
  document.addEventListener('visibilitychange', requestDraw);

  async function start() {
    if (!artwork.complete || !artwork.naturalWidth) await artwork.decode();
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, artwork);
    gl.generateMipmap(gl.TEXTURE_2D);
    ready = true;
    requestDraw();
  }
  start().catch(error => { console.warn('Interactive hero unavailable; showing the original artwork.', error); canvas.remove(); });
})();
