// Utility: hex <-> HSL conversions
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = x => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function normalizeHue(h) { return ((h % 360) + 360) % 360; }

// Palette generation strategies
function generatePalette(hex, mode, count) {
  const [h, s, l] = hexToHsl(hex);
  const colors = [];

  if (mode === 'random') {
    for (let i = 0; i < count; i++) {
      const rh = Math.floor(Math.random() * 360);
      const rs = 40 + Math.floor(Math.random() * 50);
      const rl = 35 + Math.floor(Math.random() * 40);
      colors.push(hslToHex(rh, rs, rl));
    }
    return colors;
  }

  const baseHues = {
    analogous: Array.from({ length: count }, (_, i) => normalizeHue(h + (i - Math.floor(count / 2)) * 30)),
    complementary: [h, ...Array.from({ length: count - 1 }, (_, i) => normalizeHue(h + 180 + (i - Math.floor((count - 1) / 2)) * 20))],
    triadic: [h, normalizeHue(h + 120), normalizeHue(h + 240), ...Array.from({ length: count - 3 }, (_, i) => normalizeHue(h + (i + 1) * 60))].slice(0, count),
    'split-complementary': [h, normalizeHue(h + 150), normalizeHue(h + 210), ...Array.from({ length: count - 3 }, (_, i) => normalizeHue(h + 30 + i * 30))].slice(0, count),
    tetradic: [h, normalizeHue(h + 90), normalizeHue(h + 180), normalizeHue(h + 270), ...Array.from({ length: count - 4 }, (_, i) => normalizeHue(h + 45 + i * 45))].slice(0, count),
  };

  const hues = (baseHues[mode] || baseHues.analogous).slice(0, count);
  const lightnessSteps = Array.from({ length: count }, (_, i) => Math.max(30, Math.min(75, l - 15 + i * (30 / count))));

  return hues.map((hue, i) => hslToHex(hue, Math.min(s + 5, 95), lightnessSteps[i]));
}

// DOM references
const baseColorInput = document.getElementById('baseColor');
const modeSelect = document.getElementById('mode');
const countSlider = document.getElementById('count');
const countDisplay = document.getElementById('countDisplay');
const generateBtn = document.getElementById('generateBtn');
const paletteContainer = document.getElementById('paletteContainer');
const exportBtn = document.getElementById('exportBtn');
const copyAllBtn = document.getElementById('copyAllBtn');
const exportModal = document.getElementById('exportModal');
const closeModal = document.getElementById('closeModal');
const cssOutput = document.getElementById('cssOutput');
const copyCssBtn = document.getElementById('copyCssBtn');
const toast = document.getElementById('toast');

let currentPalette = [];

// Render palette
function renderPalette(colors) {
  currentPalette = colors;
  paletteContainer.innerHTML = '';
  colors.forEach(hex => {
    const swatch = document.createElement('div');
    swatch.className = 'swatch';
    swatch.style.background = hex;
    swatch.innerHTML = `
      <span class="copy-indicator">Copied!</span>
      <span class="swatch-label">${hex.toUpperCase()}</span>
    `;
    swatch.addEventListener('click', () => {
      navigator.clipboard.writeText(hex.toUpperCase()).then(() => {
        swatch.classList.add('copied');
        setTimeout(() => swatch.classList.remove('copied'), 1200);
        showToast(`${hex.toUpperCase()} copied!`);
      });
    });
    paletteContainer.appendChild(swatch);
  });
}

// Show toast notification
function showToast(message) {
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.add('hidden'), 2000);
}

// Generate and render
function generate() {
  const hex = baseColorInput.value;
  const mode = modeSelect.value;
  const count = parseInt(countSlider.value);
  const palette = generatePalette(hex, mode, count);
  renderPalette(palette);
}

// Events
countSlider.addEventListener('input', () => {
  countDisplay.textContent = countSlider.value;
  generate();
});

baseColorInput.addEventListener('input', generate);
modeSelect.addEventListener('change', generate);
generateBtn.addEventListener('click', generate);

copyAllBtn.addEventListener('click', () => {
  const text = currentPalette.map(c => c.toUpperCase()).join(', ');
  navigator.clipboard.writeText(text).then(() => showToast('All hex codes copied!'));
});

exportBtn.addEventListener('click', () => {
  const css = `:root {\n${currentPalette.map((c, i) => `  --color-${i + 1}: ${c.toUpperCase()};`).join('\n')}\n}`;
  cssOutput.textContent = css;
  exportModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => exportModal.classList.add('hidden'));
exportModal.addEventListener('click', e => { if (e.target === exportModal) exportModal.classList.add('hidden'); });

copyCssBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(cssOutput.textContent).then(() => showToast('CSS copied!'));
});

// Init
generate();
