# 🎨 Color Palette Generator

A beautiful, minimal web app for generating color palettes based on color theory. Pick a base color, choose a harmony mode, and instantly get palettes you can copy as hex codes or export as CSS variables.

## ✨ Features

- **5 Harmony Modes** — Analogous, Complementary, Triadic, Split-Complementary, Tetradic
- **Random Mode** — generate a surprise palette with one click
- **Adjustable count** — 3 to 8 colors per palette
- **🖼️ Image Color Extraction** — drag & drop any image to extract dominant colors using k-means clustering
- **💾 Save Favorites** — save palettes and access them anytime (stored in localStorage)
- **Click to copy** — click any swatch to copy its hex code
- **Copy all** — grab all hex codes at once
- **Export as CSS** — generates ready-to-use CSS custom properties

## 🚀 Live Demo

[View Demo](https://your-username.github.io/color-palette-generator)

## 📂 Project Structure

```
color-palette-generator/
├── index.html    # App structure
├── style.css     # Styles & dark theme
├── script.js     # Color logic & interactions
└── README.md     # You're here
```

## 🛠️ How to Run Locally

```bash
git clone https://github.com/your-username/color-palette-generator.git
cd color-palette-generator
# Open index.html in your browser — no build step needed!
```

Or use a local server:
```bash
npx serve .
# or
python -m http.server 8080
```

## 🌐 Deploy to GitHub Pages

1. Push to GitHub
2. Go to **Settings → Pages**
3. Set source to `main` branch, `/ (root)`
4. Your site is live at `https://your-username.github.io/color-palette-generator`

## 🎨 Color Theory Modes

| Mode | Description |
|------|-------------|
| Analogous | Colors adjacent on the color wheel |
| Complementary | Base + opposite colors |
| Triadic | Three evenly spaced hues |
| Split-Complementary | Base + two colors near its complement |
| Tetradic | Four colors forming a rectangle |
| Random | Surprise me! |

## 📄 License

MIT — free to use and modify.

## 👨‍💻 Author
**Pujan Rasaili**
