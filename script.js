// --- Color Utilities ---
function hexToHsl(hex) {
  let r = parseInt(hex.slice(1,3),16)/255;
  let g = parseInt(hex.slice(3,5),16)/255;
  let b = parseInt(hex.slice(5,7),16)/255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){ h=s=0; }
  else {
    const d=max-min;
    s=l>0.5?d/(2-max-min):d/(max+min);
    switch(max){
      case r: h=((g-b)/d+(g<b?6:0))/6; break;
      case g: h=((b-r)/d+2)/6; break;
      case b: h=((r-g)/d+4)/6; break;
    }
  }
  return [Math.round(h*360), Math.round(s*100), Math.round(l*100)];
}

function hslToHex(h,s,l) {
  s/=100; l/=100;
  const k=n=>(n+h/30)%12;
  const a=s*Math.min(l,1-l);
  const f=n=>l-a*Math.max(-1,Math.min(k(n)-3,Math.min(9-k(n),1)));
  const toHex=x=>Math.round(x*255).toString(16).padStart(2,'0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

function norm(h){ return ((h%360)+360)%360; }

function generatePalette(hex, mode, count) {
  const [h,s,l] = hexToHsl(hex);
  if(mode==='random'){
    return Array.from({length:count},()=>hslToHex(
      Math.floor(Math.random()*360),
      40+Math.floor(Math.random()*50),
      35+Math.floor(Math.random()*40)
    ));
  }
  const hueMap = {
    analogous: Array.from({length:count},(_,i)=>norm(h+(i-Math.floor(count/2))*30)),
    complementary: [h,...Array.from({length:count-1},(_,i)=>norm(h+180+(i-Math.floor((count-1)/2))*20))],
    triadic: [h,norm(h+120),norm(h+240),...Array.from({length:count-3},(_,i)=>norm(h+(i+1)*60))].slice(0,count),
    'split-complementary': [h,norm(h+150),norm(h+210),...Array.from({length:count-3},(_,i)=>norm(h+30+i*30))].slice(0,count),
    tetradic: [h,norm(h+90),norm(h+180),norm(h+270),...Array.from({length:count-4},(_,i)=>norm(h+45+i*45))].slice(0,count),
  };
  const hues = (hueMap[mode]||hueMap.analogous).slice(0,count);
  const lSteps = Array.from({length:count},(_,i)=>Math.max(30,Math.min(75,l-15+i*(30/count))));
  return hues.map((hu,i)=>hslToHex(hu,Math.min(s+5,95),lSteps[i]));
}

// --- State ---
let currentPalette = [];
let favorites = JSON.parse(localStorage.getItem('paletteFavorites')||'[]');

// --- DOM ---
const baseColorInput = document.getElementById('baseColor');
const hexDisplay = document.getElementById('hexDisplay');
const countSlider = document.getElementById('count');
const countDisplay = document.getElementById('countDisplay');
const generateBtn = document.getElementById('generateBtn');
const saveBtn = document.getElementById('saveBtn');
const exportBtn = document.getElementById('exportBtn');
const copyAllBtn = document.getElementById('copyAllBtn');
const paletteContainer = document.getElementById('paletteContainer');
const colorDetails = document.getElementById('colorDetails');
const exportModal = document.getElementById('exportModal');
const closeModal = document.getElementById('closeModal');
const cssOutput = document.getElementById('cssOutput');
const copyCssBtn = document.getElementById('copyCssBtn');
const toast = document.getElementById('toast');
const favoritesGrid = document.getElementById('favoritesGrid');
const emptyState = document.getElementById('emptyState');
const favCount = document.getElementById('favCount');

// --- Render Palette ---
function renderPalette(colors) {
  currentPalette = colors;
  paletteContainer.innerHTML = '';
  colors.forEach(hex => {
    const sw = document.createElement('div');
    sw.className = 'swatch';
    sw.style.background = hex;
    sw.innerHTML = `
      <div class="copied-flash"></div>
      <div class="swatch-info">
        <span class="swatch-hex">${hex.toUpperCase()}</span>
        <span class="swatch-copy">Click to copy</span>
      </div>`;
    sw.addEventListener('click', () => {
      navigator.clipboard.writeText(hex.toUpperCase()).then(() => {
        sw.classList.add('copied');
        setTimeout(()=>sw.classList.remove('copied'), 500);
        showToast(`${hex.toUpperCase()} copied!`);
      });
    });
    paletteContainer.appendChild(sw);
  });

  // Detail chips
  colorDetails.innerHTML = '';
  colors.forEach(hex => {
    const chip = document.createElement('div');
    chip.className = 'detail-chip';
    chip.title = 'Click to copy';
    chip.innerHTML = `<div class="detail-dot" style="background:${hex}"></div><span class="detail-hex">${hex.toUpperCase()}</span>`;
    chip.addEventListener('click', () => {
      navigator.clipboard.writeText(hex.toUpperCase()).then(() => showToast(`${hex.toUpperCase()} copied!`));
    });
    colorDetails.appendChild(chip);
  });
}

// --- Generate ---
function generate() {
  const colors = generatePalette(baseColorInput.value, getMode(), parseInt(countSlider.value));
  renderPalette(colors);
}

function getMode() {
  return document.querySelector('.pill.active')?.dataset.mode || 'analogous';
}

// --- Save Favorites ---
function savePalette() {
  if(currentPalette.length === 0) return;
  const entry = { id: Date.now(), colors: [...currentPalette], date: new Date().toLocaleDateString() };
  favorites.unshift(entry);
  localStorage.setItem('paletteFavorites', JSON.stringify(favorites));
  updateFavCount();
  renderFavorites();
  showToast('Palette saved! ♡');
}

function deleteFavorite(id) {
  favorites = favorites.filter(f => f.id !== id);
  localStorage.setItem('paletteFavorites', JSON.stringify(favorites));
  updateFavCount();
  renderFavorites();
  showToast('Palette removed');
}

function loadFavorite(colors) {
  renderPalette(colors);
  switchTab('generator');
  showToast('Palette loaded!');
}

function updateFavCount() {
  favCount.textContent = favorites.length;
  favCount.style.display = favorites.length > 0 ? 'inline' : 'none';
}

function renderFavorites() {
  favoritesGrid.innerHTML = '';
  if(favorites.length === 0) {
    favoritesGrid.innerHTML = `<div class="empty-state"><div class="empty-icon">◈</div><p>No saved palettes yet</p><span>Generate a palette and click Save to add it here</span></div>`;
    return;
  }
  favorites.forEach(fav => {
    const card = document.createElement('div');
    card.className = 'fav-card';
    const swatchesHTML = fav.colors.map(c=>`<div class="fav-swatch" style="background:${c}"></div>`).join('');
    card.innerHTML = `
      <div class="fav-swatches">${swatchesHTML}</div>
      <div class="fav-footer">
        <span class="fav-date">${fav.date}</span>
        <div class="fav-actions">
          <button class="fav-btn" onclick="loadFavorite(${JSON.stringify(fav.colors)})">Load</button>
          <button class="fav-btn" onclick="copyFavHex(${JSON.stringify(fav.colors)})">Copy</button>
          <button class="fav-btn danger" onclick="deleteFavorite(${fav.id})">Delete</button>
        </div>
      </div>`;
    favoritesGrid.appendChild(card);
  });
}

function copyFavHex(colors) {
  navigator.clipboard.writeText(colors.map(c=>c.toUpperCase()).join(', ')).then(()=>showToast('Hex codes copied!'));
}

// --- Tabs ---
function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.toggle('active', c.id === name+'Tab'));
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// --- Events ---
baseColorInput.addEventListener('input', () => {
  hexDisplay.textContent = baseColorInput.value.toUpperCase();
  generate();
});

countSlider.addEventListener('input', () => {
  countDisplay.textContent = countSlider.value;
  generate();
});

document.querySelectorAll('.pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.pill').forEach(p=>p.classList.remove('active'));
    pill.classList.add('active');
    generate();
  });
});

generateBtn.addEventListener('click', generate);
saveBtn.addEventListener('click', savePalette);

copyAllBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(currentPalette.map(c=>c.toUpperCase()).join(', ')).then(()=>showToast('All hex codes copied!'));
});

exportBtn.addEventListener('click', () => {
  cssOutput.textContent = `:root {\n${currentPalette.map((c,i)=>`  --color-${i+1}: ${c.toUpperCase()};`).join('\n')}\n}`;
  exportModal.classList.remove('hidden');
});

closeModal.addEventListener('click', ()=>exportModal.classList.add('hidden'));
exportModal.addEventListener('click', e=>{ if(e.target===exportModal) exportModal.classList.add('hidden'); });
copyCssBtn.addEventListener('click', ()=>navigator.clipboard.writeText(cssOutput.textContent).then(()=>showToast('CSS copied!')));

// --- Toast ---
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>toast.classList.add('hidden'), 2000);
}

// --- Image Color Extraction ---
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const browseBtn = document.getElementById('browseBtn');
const previewImg = document.getElementById('previewImg');
const dropContent = document.getElementById('dropContent');
const extractActions = document.getElementById('extractActions');
const extractBtn = document.getElementById('extractBtn');
const clearImgBtn = document.getElementById('clearImgBtn');
const extractCanvas = document.getElementById('extractCanvas');

browseBtn.addEventListener('click', (e) => { e.stopPropagation(); imageInput.click(); });
dropZone.addEventListener('click', () => { if(previewImg.classList.contains('hidden')) imageInput.click(); });

imageInput.addEventListener('change', e => { if(e.target.files[0]) loadImage(e.target.files[0]); });

dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if(file && file.type.startsWith('image/')) loadImage(file);
});

function loadImage(file) {
  const url = URL.createObjectURL(file);
  previewImg.src = url;
  previewImg.classList.remove('hidden');
  dropContent.style.display = 'none';
  extractActions.classList.remove('hidden');
}

function clearImage() {
  previewImg.src = '';
  previewImg.classList.add('hidden');
  dropContent.style.display = '';
  extractActions.classList.add('hidden');
  imageInput.value = '';
}

clearImgBtn.addEventListener('click', clearImage);

extractBtn.addEventListener('click', () => {
  const img = previewImg;
  if(!img.src) return;

  const canvas = extractCanvas;
  const ctx = canvas.getContext('2d');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  ctx.drawImage(img, 0, 0);

  const count = parseInt(countSlider.value);
  const colors = extractDominantColors(ctx, canvas.width, canvas.height, count);
  renderPalette(colors);
  showToast(`Extracted ${colors.length} colors from image!`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

function extractDominantColors(ctx, w, h, count) {
  // Sample pixels evenly across the image
  const pixels = [];
  const step = Math.max(1, Math.floor(Math.sqrt((w * h) / 2000)));

  for(let y = 0; y < h; y += step) {
    for(let x = 0; x < w; x += step) {
      const d = ctx.getImageData(x, y, 1, 1).data;
      // Skip near-white, near-black, and transparent pixels
      if(d[3] < 128) continue;
      const brightness = (d[0] + d[1] + d[2]) / 3;
      if(brightness < 20 || brightness > 240) continue;
      pixels.push([d[0], d[1], d[2]]);
    }
  }

  if(pixels.length === 0) {
    showToast('Could not extract colors — try another image');
    return currentPalette;
  }

  // Simple k-means clustering
  const clusters = kMeans(pixels, count);
  return clusters.map(c => rgbToHex(Math.round(c[0]), Math.round(c[1]), Math.round(c[2])));
}

function kMeans(pixels, k, iterations = 12) {
  // Initialize centroids from random pixels
  let centroids = [];
  const used = new Set();
  while(centroids.length < k) {
    const idx = Math.floor(Math.random() * pixels.length);
    if(!used.has(idx)) { used.add(idx); centroids.push([...pixels[idx]]); }
  }

  for(let iter = 0; iter < iterations; iter++) {
    const clusters = Array.from({length: k}, () => []);

    pixels.forEach(px => {
      let minDist = Infinity, closest = 0;
      centroids.forEach((c, i) => {
        const dist = (px[0]-c[0])**2 + (px[1]-c[1])**2 + (px[2]-c[2])**2;
        if(dist < minDist) { minDist = dist; closest = i; }
      });
      clusters[closest].push(px);
    });

    centroids = clusters.map((cl, i) => {
      if(cl.length === 0) return centroids[i];
      return [
        cl.reduce((s,p)=>s+p[0],0)/cl.length,
        cl.reduce((s,p)=>s+p[1],0)/cl.length,
        cl.reduce((s,p)=>s+p[2],0)/cl.length
      ];
    });
  }

  return centroids;
}

function rgbToHex(r, g, b) {
  return '#' + [r,g,b].map(v => Math.max(0,Math.min(255,v)).toString(16).padStart(2,'0')).join('');
}

// --- Init ---
updateFavCount();
renderFavorites();
generate();

// --- Light / Dark Mode ---
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

function applyTheme(theme) {
  if(theme === 'light') {
    document.body.classList.add('light');
    themeIcon.textContent = '☀️';
  } else {
    document.body.classList.remove('light');
    themeIcon.textContent = '🌙';
  }
  localStorage.setItem('paletteTheme', theme);
}

themeToggle.addEventListener('click', () => {
  const isLight = document.body.classList.contains('light');
  applyTheme(isLight ? 'dark' : 'light');
});

// Load saved theme
const savedTheme = localStorage.getItem('paletteTheme') || 'dark';
applyTheme(savedTheme);
