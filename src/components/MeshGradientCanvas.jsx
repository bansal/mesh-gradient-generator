import { useEffect, useRef, forwardRef, useImperativeHandle, useCallback } from "react";
import { hexToRgbArr } from "../utils/gradientUtils";

const VS_SOURCE = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FS_SOURCE = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform vec3 u_colors[16];
  uniform vec2 u_positions[16];
  uniform int u_count;

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    vec3 colorSum = vec3(0.0);
    float weightSum = 0.0;
    
    for (int i = 0; i < 16; i++) {
      if (i >= u_count) break;
      vec2 pos = u_positions[i];
      float dist = distance(st, pos);
      float weight = 1.0 / (pow(dist, 2.5) + 0.005);
      colorSum += u_colors[i] * weight;
      weightSum += weight;
    }
    
    vec3 finalColor = colorSum / weightSum;
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    console.error("Program link error:", gl.getProgramInfoLog(p));
    return null;
  }
  return p;
}

export const MeshGradientCanvas = forwardRef(function MeshGradientCanvas({ points }, ref) {
  const canvasRef = useRef(null);
  const glRef = useRef(null);
  const programRef = useRef(null);
  const positionBufferRef = useRef(null);
  const locationsRef = useRef(null);
  const pointsRef = useRef(points);
  pointsRef.current = points;

  const drawFrame = useCallback((pts, pixelW, pixelH, displayW, displayH) => {
    const gl = glRef.current;
    const program = programRef.current;
    const locations = locationsRef.current;
    const canvas = canvasRef.current;
    if (!gl || !program || !canvas || !locations || !pts?.length) return;

    const dw = displayW || pixelW;
    const dh = displayH || pixelH;

    gl.viewport(0, 0, pixelW, pixelH);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);

    gl.enableVertexAttribArray(locations.position);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRef.current);
    gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(locations.resolution, pixelW, pixelH);
    gl.uniform1i(locations.count, pts.length);

    const colorsData = [];
    const positionsData = [];
    pts.forEach((p) => {
      colorsData.push(...hexToRgbArr(p.color));
      positionsData.push(p.x / dw, 1.0 - p.y / dh);
    });
    while (colorsData.length < 16 * 3) colorsData.push(0, 0, 0);
    while (positionsData.length < 16 * 2) positionsData.push(0, 0);

    gl.uniform3fv(locations.colors, new Float32Array(colorsData));
    gl.uniform2fv(locations.positions, new Float32Array(positionsData));
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }, []);

  useImperativeHandle(ref, () => ({
    captureAsDataURL: () => {
      const gl = glRef.current;
      const canvas = canvasRef.current;
      const pts = pointsRef.current;
      if (!gl || !canvas || !pts?.length) return null;

      let w = canvas.width;
      let h = canvas.height;
      let displayW = canvas.width;
      let displayH = canvas.height;
      if (w === 0 || h === 0) {
        const parentRect = canvas.parentElement?.getBoundingClientRect();
        if (!parentRect?.width || !parentRect?.height) return null;
        const dpr = window.devicePixelRatio || 1;
        displayW = parentRect.width;
        displayH = parentRect.height;
        w = Math.floor(displayW * dpr);
        h = Math.floor(displayH * dpr);
        canvas.width = w;
        canvas.height = h;
      } else {
        const rect = canvas.getBoundingClientRect();
        displayW = rect.width;
        displayH = rect.height;
      }

      drawFrame(pts, w, h, displayW, displayH);

      const pixels = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

      const flipped = new Uint8Array(pixels.length);
      const rowBytes = w * 4;
      for (let y = h - 1; y >= 0; y--) {
        const srcOffset = y * rowBytes;
        const dstOffset = (h - 1 - y) * rowBytes;
        flipped.set(pixels.subarray(srcOffset, srcOffset + rowBytes), dstOffset);
      }

      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = w;
      exportCanvas.height = h;
      const ctx = exportCanvas.getContext("2d");
      const imageData = ctx.createImageData(w, h);
      imageData.data.set(flipped);
      ctx.putImageData(imageData, 0, 0);

      return exportCanvas.toDataURL("image/png");
    },
  }), [drawFrame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const glOpts = { preserveDrawingBuffer: true, alpha: false };
    const gl = canvas.getContext("webgl", glOpts)
      || canvas.getContext("experimental-webgl", glOpts);
    if (!gl) {
      console.error("WebGL not supported");
      alert("WebGL not supported in this browser!");
      return;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VS_SOURCE);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FS_SOURCE);
    const program = createProgram(gl, vs, fs);
    if (!program) return;

    const locations = {
      position: gl.getAttribLocation(program, "a_position"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      colors: gl.getUniformLocation(program, "u_colors"),
      positions: gl.getUniformLocation(program, "u_positions"),
      count: gl.getUniformLocation(program, "u_count"),
    };

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    glRef.current = gl;
    programRef.current = program;
    positionBufferRef.current = positionBuffer;
    locationsRef.current = locations;

    return () => {
      gl.deleteProgram(program);
      gl.deleteBuffer(positionBuffer);
    };
  }, []);

  useEffect(() => {
    const gl = glRef.current;
    const program = programRef.current;
    const positionBuffer = positionBufferRef.current;
    const locations = locationsRef.current;
    const canvas = canvasRef.current;

    if (!gl || !program || !canvas || !points.length) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const displayWidth = Math.floor(rect.width * dpr);
    const displayHeight = Math.floor(rect.height * dpr);

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth;
      canvas.height = displayHeight;
    }

    drawFrame(points, displayWidth, displayHeight, rect.width, rect.height);
  }, [points, drawFrame]);

  useEffect(() => {
    const handleResize = () => {
      if (glRef.current && points.length) {
        const gl = glRef.current;
        const program = programRef.current;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        const displayWidth = Math.floor(rect.width * dpr);
        const displayHeight = Math.floor(rect.height * dpr);

        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
          canvas.width = displayWidth;
          canvas.height = displayHeight;
        }

        drawFrame(points, displayWidth, displayHeight, rect.width, rect.height);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [points, drawFrame]);

  return <canvas ref={canvasRef} id="gradient-canvas" className="w-full h-full block" />;
});
