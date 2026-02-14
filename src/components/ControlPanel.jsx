import { Download, RefreshCw } from "lucide-react";

export function ControlPanel({
  colorCount,
  setColorCount,
  aspectRatio,
  setAspectRatio,
  preset,
  setPreset,
  points,
  onColorChange,
  onGenerate,
  onExportPNG,
}) {
  return (
    <div className="shrink-0 w-full min-[901px]:w-80 flex flex-col gap-6">
      <div>
        <h1 className="text-[1.75rem] font-bold tracking-tight mb-1.5 max-[900px]:text-[1.35rem]">
          Mesh Gradient
        </h1>
        <p className="text-text-muted text-[0.95rem] mb-8">
          Create beautiful random mesh gradients instantly
        </p>
      </div>
      <div className="flex flex-col gap-4 w-full">
        <div className="flex gap-2.5 w-full">
          <button
            className="inline-flex items-center justify-center gap-2 py-3 px-5 text-[0.9rem] font-semibold border-0 rounded-lg cursor-pointer transition-colors duration-150 active:scale-[0.97] text-white w-full bg-accent hover:bg-accent-hover"
            onClick={onGenerate}
            title="Generate (Space)"
          >
            <RefreshCw size={18} />
            Randomize
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 py-3 px-5 text-[0.9rem] font-semibold rounded-lg cursor-pointer transition-colors duration-150 active:scale-[0.97] text-text w-full bg-surface border border-border hover:bg-surface-hover"
            onClick={onExportPNG}
            title="Download PNG"
          >
            <Download size={18} />
            PNG
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 w-full bg-surface p-5 rounded-xl border border-border">
        <div className="flex justify-between items-center gap-2 w-full">
          <label
            htmlFor="color-count"
            className="text-[0.85rem] text-text-muted whitespace-nowrap"
          >
            Colors
          </label>
          <input
            type="number"
            id="color-count"
            min={3}
            max={8}
            value={colorCount}
            onChange={(e) => setColorCount(parseInt(e.target.value) || 5)}
            className="bg-bg border border-border text-text rounded-md py-2 px-3 text-[0.85rem] outline-none min-w-[100px] text-right focus:border-accent"
          />
        </div>
        <div className="flex justify-between items-center gap-2 w-full">
          <label
            htmlFor="aspect-ratio"
            className="text-[0.85rem] text-text-muted whitespace-nowrap"
          >
            Ratio
          </label>
          <select
            id="aspect-ratio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value)}
            className="bg-bg border border-border text-text rounded-md py-2 px-3 text-[0.85rem] outline-none min-w-[100px] text-right focus:border-accent"
          >
            <option value="16/10">16:10</option>
            <option value="16/9">16:9</option>
            <option value="4/3">4:3</option>
            <option value="3/2">3:2</option>
            <option value="1/1">1:1</option>
            <option value="9/16">9:16</option>
            <option value="3/4">3:4</option>
            <option value="21/9">21:9</option>
          </select>
        </div>
        <div className="flex justify-between items-center gap-2 w-full">
          <label
            htmlFor="preset"
            className="text-[0.85rem] text-text-muted whitespace-nowrap"
          >
            Palette
          </label>
          <select
            id="preset"
            value={preset}
            onChange={(e) => setPreset(e.target.value)}
            className="bg-bg border border-border text-text rounded-md py-2 px-3 text-[0.85rem] outline-none min-w-[100px] text-right focus:border-accent"
          >
            <option value="random">Random</option>
            <option value="warm">Warm</option>
            <option value="cool">Cool</option>
            <option value="pastel">Pastel</option>
            <option value="neon">Neon</option>
            <option value="earth">Earthy</option>
            <option value="sunset">Sunset</option>
            <option value="ocean">Ocean</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-3 bg-surface p-5 rounded-xl border border-border">
        <span className="text-[0.85rem] text-text-muted font-medium">
          Current Palette
        </span>
        <div className="flex gap-2.5 flex-wrap">
          {points.map((p, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-11 h-11 rounded-[10px] border-2 border-border cursor-pointer transition-all duration-150 hover:scale-110 hover:border-accent relative"
                style={{ background: p.color }}
                onClick={() =>
                  document.getElementById(`swatch-input-${i}`)?.click()
                }
              >
                <input
                  id={`swatch-input-${i}`}
                  type="color"
                  value={p.color}
                  onChange={(e) => onColorChange(i, e.target.value)}
                  className="opacity-0 absolute w-0 h-0"
                />
              </div>
              <span className="text-[0.65rem] text-text-muted font-mono">
                {p.color.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[0.75rem] text-text-muted mt-4">
        Press{" "}
        <kbd className="inline-block bg-surface border border-border rounded px-1.5 py-0.5 text-[0.72rem] mx-0.5">
          Space
        </kbd>{" "}
        to generate
      </p>
      <p className="text-center text-[0.75rem] text-text-muted mt-4">
        <a href="https://bansal.io" target="_blank" rel="noopener noreferrer">
          Made by Bansal
        </a>
      </p>
    </div>
  );
}
