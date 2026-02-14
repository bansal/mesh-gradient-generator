export function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function hexToRgbArr(hex) {
  let c = hex.substring(1);
  if (c.length === 3)
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  const num = parseInt(c, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [r / 255, g / 255, b / 255];
}

function randomHSL(hRange, sRange, lRange) {
  const h = hRange[0] + Math.random() * (hRange[1] - hRange[0]);
  const s = sRange[0] + Math.random() * (sRange[1] - sRange[0]);
  const l = lRange[0] + Math.random() * (lRange[1] - lRange[0]);
  return { h, s, l };
}

export const palettes = {
  random: () => randomHSL([0, 360], [50, 100], [40, 75]),
  warm: () => randomHSL([0, 60], [60, 100], [45, 70]),
  cool: () => randomHSL([180, 280], [50, 90], [40, 70]),
  pastel: () => randomHSL([0, 360], [40, 70], [70, 88]),
  neon: () => randomHSL([0, 360], [90, 100], [50, 65]),
  earth: () => randomHSL([20, 55], [30, 70], [30, 60]),
  sunset: () => randomHSL([340, 420], [65, 100], [45, 70]),
  ocean: () => randomHSL([170, 230], [50, 95], [35, 65]),
};

export function generateColors(count, preset) {
  let colorsHSL;
  if (preset === "tonal") {
    const hue = Math.random() * 360;
    colorsHSL = Array.from({ length: count }, () =>
      randomHSL([hue, hue], [30, 85], [25, 85]),
    );
  } else if (preset === "complementary") {
    const hue1 = Math.random() * 360;
    const hue2 = (hue1 + 180) % 360;
    colorsHSL = Array.from({ length: count }, (_, i) => {
      const h = i % 2 === 0 ? hue1 : hue2;
      return randomHSL([h, h], [40, 90], [30, 80]);
    });
    colorsHSL.sort(() => Math.random() - 0.5);
  } else {
    const gen = palettes[preset] || palettes.random;
    colorsHSL = Array.from({ length: count }, () => gen());
  }
  const hasBright = colorsHSL.some((c) => c.l > 85);

  if (!hasBright && count > 0) {
    const idx = Math.floor(Math.random() * count);
    colorsHSL[idx].l = 85 + Math.random() * 11;
  }

  return colorsHSL.map(({ h, s, l }) => {
    return hslToHex(((h % 360) + 360) % 360, s, l);
  });
}

export function generatePoints(colors, w, h) {
  return colors.map((color) => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.max(w, h) * (0.35 + Math.random() * 0.35),
    color,
  }));
}
