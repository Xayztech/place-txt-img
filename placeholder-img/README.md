# 🖼️ Placeholder Image Text API

A free, open-source API to generate custom placeholder images with text, neon effects, gradients, borders, and more — all via a simple URL.

## ✨ Features

- Generate images via URL (no auth required)
- Custom text with multi-line support (`\n`, `+`, `%20`)
- Neon glow, shadow, bold, italic, uppercase effects
- Gradient backgrounds
- Custom fonts, font size, alignment
- Border with custom color & width
- Rounded corners (radius)
- Opacity control
- PNG & JPEG output
- Named colors (dark, neonblue, gold, etc.)
- CORS enabled
- Download images directly

## 🚀 Quick Start

```bash
git clone https://github.com/YOUR_USERNAME/placeholder-image-text
cd placeholder-image-text
npm install
npm start
```

Open: http://localhost:3000/home

## 📡 API Examples

```
# Basic
/600x400

# Custom text & color
/600x400?bg=0d0d0d&text-colour=white&text=Hello+World

# Neon effect
/800x400?bg=07070f&text-colour=c084fc&text=NEON&neon=true&bold=true

# Multi-line
/600x400?text=Line+One\nLine+Two&bg=0f172a&text-colour=38bdf8

# Gradient background
/1200x628?gradient=0d1117&gradient-end=7c3aed&text=OG+Image&text-colour=white

# Your original format
/600x400/neon=false/dark?text-colour=white&text=halo
```

## 🌐 Deploy

### Vercel
```bash
npm i -g vercel
vercel --prod
```

### Railway
```bash
npm i -g @railway/cli
railway up
```

### Docker
```bash
docker build -t placeholder-api .
docker run -p 3000:3000 placeholder-api
```

## 📖 Routes

| Route | Description |
|-------|-------------|
| `/home` | Main generator UI |
| `/docs/api` | API Documentation |
| `/api` | Health check JSON |
| `/{W}x{H}` | Generate image |
| `/api/{W}x{H}` | API-prefixed image |

## 📋 All Parameters

| Param | Description | Default |
|-------|-------------|---------|
| `bg` | Background color (hex/name) | `1a1a2e` |
| `text-colour` | Text color | `ffffff` |
| `text` | Display text | `{W}x{H}` |
| `neon` | Neon glow effect | `false` |
| `bold` | Bold text | `false` |
| `italic` | Italic text | `false` |
| `shadow` | Drop shadow | `false` |
| `uppercase` | All caps | `false` |
| `font-size` | Font size px | auto |
| `font` | Font family | `Arial` |
| `align` | center/left/right | `center` |
| `border-color` | Border hex color | none |
| `border-width` | Border px | `0` |
| `radius` | Corner radius px | `0` |
| `opacity` | 0.0–1.0 | `1` |
| `gradient` | Gradient start color | none |
| `gradient-end` | Gradient end color | none |
| `format` | png or jpeg | `png` |

## 📄 License

MIT — Free to use, modify, and deploy.
