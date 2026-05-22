const express = require('express');
const { createCanvas, GlobalFonts } = require('@napi-rs/canvas');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Register Bundled Fonts ───────────────────────────────────────────────────
// @napi-rs/canvas uses system fonts, but Vercel serverless has none.
// We bundle fonts inside the project and register them here.
const fontsDir = path.join(__dirname, 'fonts');
if (fs.existsSync(fontsDir)) {
  // DejaVu Sans (fallback / "Arial" alias)
  GlobalFonts.registerFromPath(path.join(fontsDir, 'DejaVuSans.ttf'), 'Arial');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'DejaVuSans-Bold.ttf'), 'Arial');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'DejaVuSans-Oblique.ttf'), 'Arial');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'DejaVuSans-BoldOblique.ttf'), 'Arial');
  // DejaVu Sans as its own family
  GlobalFonts.registerFromPath(path.join(fontsDir, 'DejaVuSans.ttf'), 'DejaVu Sans');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'DejaVuSans-Bold.ttf'), 'DejaVu Sans');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'DejaVuSans-Oblique.ttf'), 'DejaVu Sans');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'DejaVuSans-BoldOblique.ttf'), 'DejaVu Sans');
  // Poppins
  GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Regular.ttf'), 'Poppins');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Bold.ttf'), 'Poppins');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-Italic.ttf'), 'Poppins');
  GlobalFonts.registerFromPath(path.join(fontsDir, 'Poppins-BoldItalic.ttf'), 'Poppins');
  console.log('✅ Fonts registered from bundled fonts/');
} else {
  console.warn('⚠️  fonts/ directory not found — text may not render on serverless');
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Redirect Routes ──────────────────────────────────────────────────────────
app.get('/', (req, res) => res.redirect('/home'));

app.get('/home', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/docs/api', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'docs.html'));
});

// ─── Helper: Parse Color ──────────────────────────────────────────────────────
function parseColor(color) {
  if (!color) return null;
  if (color.startsWith('#')) return color;
  if (/^[0-9a-fA-F]{3,8}$/.test(color)) return '#' + color;
  return color;
}

// ─── Helper: Draw Neon Text ───────────────────────────────────────────────────
function drawNeonText(ctx, text, x, y, color, blur = 20) {
  ctx.shadowColor = color;
  ctx.shadowBlur = blur;
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = blur * 2;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

// ─── Core Image Generator ─────────────────────────────────────────────────────
function generateImage(params) {
  const {
    width = 600,
    height = 400,
    bg = '000000',
    textColor = 'white',
    text = '',
    neon = false,
    fontSize,
    fontFamily = 'Arial',
    bold = false,
    italic = false,
    align = 'center',
    borderColor,
    borderWidth = 0,
    opacity = 1,
    gradient,
    gradientEnd,
    shadow = false,
    shadowColor = 'rgba(0,0,0,0.5)',
    uppercase = false,
    radius = 0,
  } = params;

  const w = Math.min(Math.max(parseInt(width) || 600, 10), 4096);
  const h = Math.min(Math.max(parseInt(height) || 400, 10), 4096);

  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Background
  const bgColor = parseColor(bg) || '#000000';
  if (gradient && gradientEnd) {
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, parseColor(gradient) || bgColor);
    grd.addColorStop(1, parseColor(gradientEnd) || '#ffffff');
    ctx.fillStyle = grd;
  } else {
    ctx.fillStyle = bgColor;
  }

  // Rounded corners
  const r = Math.min(parseInt(radius) || 0, Math.min(w, h) / 2);
  if (r > 0) {
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(w - r, 0);
    ctx.quadraticCurveTo(w, 0, w, r);
    ctx.lineTo(w, h - r);
    ctx.quadraticCurveTo(w, h, w - r, h);
    ctx.lineTo(r, h);
    ctx.quadraticCurveTo(0, h, 0, h - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();
    ctx.clip();
  } else {
    ctx.fillRect(0, 0, w, h);
  }

  // Border
  const bw = parseInt(borderWidth) || 0;
  if (bw > 0 && borderColor) {
    ctx.strokeStyle = parseColor(borderColor) || '#ffffff';
    ctx.lineWidth = bw;
    ctx.strokeRect(bw / 2, bw / 2, w - bw, h - bw);
  }

  // Opacity overlay
  const op = parseFloat(opacity);
  if (op < 1 && op >= 0) {
    ctx.fillStyle = `rgba(0,0,0,${1 - op})`;
    ctx.fillRect(0, 0, w, h);
  }

  // Text — handle \n from URL both as literal backslash-n and actual newline
  const rawText = (text || '')
    .replace(/\+/g, ' ')
    .replace(/%20/g, ' ')
    .replace(/\\n/g, '\n')   // literal \n from URL (e.g. text=Hello\nWorld)
    .replace(/\r/g, '');     // strip stray CR

  const displayText = uppercase ? rawText.toUpperCase() : rawText;
  const lines = displayText ? displayText.split('\n') : [`${w}x${h}`];

  const autoFontSize = fontSize
    ? parseInt(fontSize)
    : Math.max(12, Math.min(w / 8, h / (lines.length * 2 + 1), 80));

  const style = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}`;
  ctx.font = `${style}${autoFontSize}px ${fontFamily}`;
  ctx.textAlign = align === 'left' ? 'left' : align === 'right' ? 'right' : 'center';
  ctx.textBaseline = 'middle';

  const resolvedColor = parseColor(textColor) || '#ffffff';
  const lineH = autoFontSize * 1.4;
  const totalH = lines.length * lineH;
  const startY = (h - totalH) / 2 + lineH / 2;

  let xPos;
  if (align === 'left') xPos = bw + 20;
  else if (align === 'right') xPos = w - bw - 20;
  else xPos = w / 2;

  lines.forEach((line, i) => {
    const y = startY + i * lineH;
    if (neon === true || neon === 'true') {
      drawNeonText(ctx, line, xPos, y, resolvedColor);
    } else {
      if (shadow === true || shadow === 'true') {
        ctx.shadowColor = parseColor(shadowColor) || 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
      }
      ctx.fillStyle = resolvedColor;
      ctx.fillText(line, xPos, y);
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }
  });

  // Watermark
  ctx.font = `11px Arial`;
  ctx.textAlign = 'right';
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillText(`${w}×${h}`, w - 8, h - 8);

  return canvas;
}

// ─── API Route: /api/:WxH ─────────────────────────────────────────────────────
app.get(['/api/:size', '/api/:size/*'], (req, res) => {
  handleImageRequest(req, res);
});

// Legacy URL style: /600x400/neon=false/dark
app.get('/:size([0-9]+x[0-9]+)/:opts(*)', (req, res) => {
  handleImageRequest(req, res);
});

app.get('/:size([0-9]+x[0-9]+)', (req, res) => {
  handleImageRequest(req, res);
});

async function handleImageRequest(req, res) {
  try {
    // Parse size
    const sizeStr = (req.params.size || '600x400').toLowerCase();
    const sizeMatch = sizeStr.match(/^(\d+)x(\d+)$/);
    const width = sizeMatch ? parseInt(sizeMatch[1]) : 600;
    const height = sizeMatch ? parseInt(sizeMatch[2]) : 400;

    // Parse path options (e.g., /neon=false/dark)
    const opts = req.params.opts || req.params[0] || '';
    const pathParts = opts.split('/').filter(Boolean);
    const pathParams = {};
    pathParts.forEach(part => {
      if (part.includes('=')) {
        const [k, v] = part.split('=');
        pathParams[k.toLowerCase()] = v;
      } else {
        if (['dark', 'light', 'black', 'white', 'red', 'blue', 'green', 'purple', 'yellow', 'orange', 'pink', 'gray'].includes(part.toLowerCase())) {
          pathParams.bg = part;
        }
      }
    });

    // Merge all params (query > path > defaults)
    const q = req.query;
    const params = {
      width,
      height,
      bg: q.bg || q.background || q['bg-color'] || pathParams.bg || '1a1a2e',
      textColor: q['text-colour'] || q['text-color'] || q.color || q.colour || pathParams['text-colour'] || pathParams.color || 'ffffff',
      text: q.text || pathParams.text || '',
      neon: q.neon !== undefined ? q.neon : pathParams.neon,
      fontSize: q['font-size'] || q.fontsize || q.size || pathParams['font-size'],
      fontFamily: q.font || q['font-family'] || pathParams.font || 'Arial',
      bold: q.bold === 'true' || pathParams.bold === 'true',
      italic: q.italic === 'true' || pathParams.italic === 'true',
      align: q.align || pathParams.align || 'center',
      borderColor: q['border-color'] || q.border || pathParams.border,
      borderWidth: q['border-width'] || q['border-size'] || pathParams['border-width'] || 0,
      opacity: q.opacity || pathParams.opacity || 1,
      gradient: q.gradient || q['gradient-start'] || pathParams.gradient,
      gradientEnd: q['gradient-end'] || pathParams['gradient-end'],
      shadow: q.shadow || pathParams.shadow,
      shadowColor: q['shadow-color'] || pathParams['shadow-color'] || 'rgba(0,0,0,0.5)',
      uppercase: q.uppercase === 'true' || pathParams.uppercase === 'true',
      radius: q.radius || pathParams.radius || 0,
      format: q.format || 'png',
    };

    // Named colors
    const namedColors = {
      dark: '0d0d0d', black: '000000', white: 'ffffff', light: 'f5f5f5',
      red: 'e63946', blue: '457b9d', green: '2d6a4f', purple: '7209b7',
      yellow: 'f4a261', orange: 'e76f51', pink: 'f72585', gray: '555555',
      navy: '1d3557', cyan: '48cae4', teal: '0f4c75', neongreen: '39ff14',
      neonblue: '00f5ff', neonpink: 'ff006e', gold: 'ffd700',
    };
    if (namedColors[params.bg?.toLowerCase()]) params.bg = namedColors[params.bg.toLowerCase()];
    if (namedColors[params.textColor?.toLowerCase()]) params.textColor = namedColors[params.textColor.toLowerCase()];

    const canvas = generateImage(params);
    const fmt = params.format === 'jpeg' || params.format === 'jpg' ? 'jpeg' : 'png';
    const mime = fmt === 'jpeg' ? 'image/jpeg' : 'image/png';

    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // @napi-rs/canvas: toBuffer() is async
    if (fmt === 'jpeg') {
      const buffer = await canvas.toBuffer('image/jpeg', 92);
      res.send(buffer);
    } else {
      const buffer = await canvas.toBuffer('image/png');
      res.send(buffer);
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

// ─── API Health ───────────────────────────────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({
    name: 'Placeholder Image Text API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      generate: '/:WxH?params',
      api: '/api/:WxH?params',
      docs: '/docs/api',
      home: '/home',
    },
    example: '/600x400?bg=0d0d0d&text-colour=white&text=Hello+World&neon=true',
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).redirect('/home');
});

app.listen(PORT, () => {
  console.log(`\n🚀 Placeholder Image Text API running`);
  console.log(`   Local: http://localhost:${PORT}/home`);
  console.log(`   API:   http://localhost:${PORT}/api`);
  console.log(`   Docs:  http://localhost:${PORT}/docs/api\n`);
});

module.exports = app;
