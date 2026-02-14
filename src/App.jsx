import { useState, useRef, useEffect, useCallback } from "react";
import { MeshGradientCanvas } from "./components/MeshGradientCanvas";
import { ControlPanel } from "./components/ControlPanel";
import { generateColors, generatePoints } from "./utils/gradientUtils";

function useMeshGradient(canvasWrapperRef, colorCount, preset) {
  const [points, setPoints] = useState([]);
  const prevDimensionsRef = useRef({ w: 0, h: 0 });

  const generate = useCallback(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const w = rect.width || 800;
    const h = rect.height || 600;

    const colors = generateColors(colorCount, preset);
    const newPoints = generatePoints(colors, w, h);
    prevDimensionsRef.current = { w, h };
    setPoints(newPoints);
  }, [colorCount, preset, canvasWrapperRef]);

  return [points, setPoints, generate, prevDimensionsRef];
}

export default function App() {
  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);

  const [colorCount, setColorCount] = useState(5);
  const [aspectRatio, setAspectRatio] = useState("16/10");
  const [preset, setPreset] = useState("random");

  const [points, setPoints, generate, prevDimensionsRef] = useMeshGradient(
    canvasWrapperRef,
    colorCount,
    preset,
  );

  useEffect(() => {
    const timer = setTimeout(generate, 100);
    return () => clearTimeout(timer);
  }, [generate]);

  useEffect(() => {
    if (aspectRatio && points.length && canvasWrapperRef.current) {
      const timer = setTimeout(() => {
        const rect = canvasWrapperRef.current?.getBoundingClientRect();
        if (!rect) return;

        const oldW = prevDimensionsRef.current.w || rect.width;
        const oldH = prevDimensionsRef.current.h || rect.height;

        if (oldW && oldH) {
          setPoints((prev) =>
            prev.map((p) => ({
              ...p,
              x: (p.x / oldW) * rect.width,
              y: (p.y / oldH) * rect.height,
            })),
          );
        }
        prevDimensionsRef.current = { w: rect.width, h: rect.height };
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [aspectRatio]);

  const handleColorChange = useCallback((index, color) => {
    setPoints((prev) =>
      prev.map((p, i) => (i === index ? { ...p, color } : p)),
    );
  }, []);

  const exportPNG = useCallback(() => {
    const meshRef = canvasRef.current;
    if (!meshRef?.captureAsDataURL) return;

    const dataUrl = meshRef.captureAsDataURL();
    if (!dataUrl) return;

    const link = document.createElement("a");
    link.download = "mesh-gradient.png";
    link.href = dataUrl;
    link.click();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        generate();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [generate]);

  return (
    <div className="w-full max-w-full flex flex-col-reverse sm:flex-row gap-6 items-start">
      <ControlPanel
        colorCount={colorCount}
        setColorCount={setColorCount}
        aspectRatio={aspectRatio}
        setAspectRatio={setAspectRatio}
        preset={preset}
        setPreset={setPreset}
        points={points}
        onColorChange={handleColorChange}
        onGenerate={generate}
        onExportPNG={exportPNG}
      />

      <div className="flex-1 w-full flex flex-col gap-6">
        <div
          className="relative w-full overflow-hidden border border-border rounded-xl bg-black transition-all duration-300 ease-out shadow-2xl"
          style={{ aspectRatio: aspectRatio }}
          ref={canvasWrapperRef}
        >
          <MeshGradientCanvas ref={canvasRef} points={points} />
        </div>
      </div>
    </div>
  );
}
