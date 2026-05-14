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

// --- Init ---
updateFavCount();
renderFavorites();
generate();
