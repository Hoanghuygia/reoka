// Generates Reoka logo + banner concepts as SVG, then renders PNGs with headless Chrome.
// Usage: node design/src/generate.mjs
import { writeFileSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const C = { teal: "#087F8C", navy: "#17324D", mint: "#DDF4EF", white: "#FFFFFF" };
const WORD_FONT = "'Avenir Next', 'Helvetica Neue', Arial, sans-serif";
const UI_FONT = "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";

// ---------- primitives ----------
const paw = (cx, cy, s, fill) => `
  <g fill="${fill}" transform="translate(${cx} ${cy}) scale(${s / 100})">
    <path d="M0,4 C16,4 34,22 36,38 C38,52 28,58 16,56 C8,55 4,52 0,52 C-4,52 -8,55 -16,56 C-28,58 -38,52 -36,38 C-34,22 -16,4 0,4 Z"/>
    <ellipse cx="-37" cy="-6" rx="11" ry="14" transform="rotate(-24 -37 -6)"/>
    <ellipse cx="-14" cy="-28" rx="12" ry="16" transform="rotate(-8 -14 -28)"/>
    <ellipse cx="14" cy="-28" rx="12" ry="16" transform="rotate(8 14 -28)"/>
    <ellipse cx="37" cy="-6" rx="11" ry="14" transform="rotate(24 37 -6)"/>
  </g>`;

const check = (cx, cy, r, color, w) =>
  `<path d="M${cx - r * 0.42},${cy + r * 0.02} L${cx - r * 0.1},${cy + r * 0.34} L${cx + r * 0.46},${cy - r * 0.3}"
     fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

// Decorative (non-scannable) QR pattern.
function qr(x, y, size, color, seed = 7) {
  const n = 21, m = size / n;
  let s = seed;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const finder = (fx, fy) =>
    `<rect x="${x + fx * m}" y="${y + fy * m}" width="${7 * m}" height="${7 * m}" fill="${color}"/>
     <rect x="${x + (fx + 1) * m}" y="${y + (fy + 1) * m}" width="${5 * m}" height="${5 * m}" fill="#fff"/>
     <rect x="${x + (fx + 2) * m}" y="${y + (fy + 2) * m}" width="${3 * m}" height="${3 * m}" fill="${color}"/>`;
  const inFinder = (i, j) => (i < 8 && j < 8) || (i > n - 9 && j < 8) || (i < 8 && j > n - 9);
  let cells = "";
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++)
      if (!inFinder(i, j) && rnd() > 0.52)
        cells += `<rect x="${(x + i * m).toFixed(2)}" y="${(y + j * m).toFixed(2)}" width="${m + 0.3}" height="${m + 0.3}"/>`;
  return `<g fill="${color}">${cells}</g>${finder(0, 0)}${finder(n - 7, 0)}${finder(0, n - 7)}`;
}

const bell = (cx, cy, s, color) => `
  <g transform="translate(${cx} ${cy}) scale(${s / 50})" fill="${color}">
    <path d="M-17,10 C-17,-6 -13,-20 0,-20 C13,-20 17,-6 17,10 L23,16 H-23 Z"/>
    <circle cx="0" cy="22" r="6"/><circle cx="0" cy="-22" r="4"/>
  </g>`;

// ---------- icons (drawn in a 300x300 box) ----------
const icons = {
  card: () => `
    <defs><clipPath id="cardClip"><rect x="51" y="42" width="198" height="244" rx="28"/></clipPath></defs>
    <rect x="45" y="36" width="210" height="256" rx="34" fill="${C.teal}" stroke="${C.navy}" stroke-width="12"/>
    <g clip-path="url(#cardClip)">
      <g transform="translate(34 92) scale(1.85)">
        <path fill="${C.navy}" d="M14,120 L14,58 C14,32 34,14 58,14 C71,14 80,21 84,30 L95,36 C101,40 100,49 93,51 L81,54 C77,63 69,68 61,70 L66,120 Z"/>
        <path fill="none" stroke="${C.mint}" stroke-width="3.2" stroke-linecap="round" d="M40,26 C29,30 27,50 33,62 C37,69 45,64 46,54"/>
        <circle cx="66" cy="31" r="3.4" fill="${C.mint}"/>
      </g>
    </g>
    <rect x="160" y="190" width="80" height="80" rx="14" fill="${C.white}" stroke="${C.navy}" stroke-width="8"/>
    <g transform="translate(171 201)">${qr(0, 0, 58, C.navy, 11)}</g>
    <rect x="122" y="8" width="56" height="44" rx="12" fill="${C.mint}" stroke="${C.navy}" stroke-width="12"/>`,

  shield: () => `
    <path d="M150,18 L262,58 V140 C262,214 214,262 150,286 C86,262 38,214 38,140 V58 Z"
          fill="${C.teal}" stroke="${C.navy}" stroke-width="12" stroke-linejoin="round"/>
    ${paw(150, 140, 150, C.white)}
    <circle cx="236" cy="236" r="44" fill="${C.navy}" stroke="${C.white}" stroke-width="9"/>
    ${check(236, 236, 44, C.mint, 10)}`,

  scan: () => `
    <rect x="0" y="0" width="300" height="300" rx="72" fill="${C.navy}"/>
    <g fill="none" stroke="${C.teal}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round">
      <path d="M58,108 V78 C58,67 67,58 78,58 H108"/>
      <path d="M192,58 H222 C233,58 242,67 242,78 V108"/>
      <path d="M242,192 V222 C242,233 233,242 222,242 H192"/>
      <path d="M108,242 H78 C67,242 58,233 58,222 V192"/>
    </g>
    ${paw(150, 148, 128, C.mint)}`,

  bubble: () => `
    <path d="M90,36 H210 C243,36 270,63 270,96 V172 C270,205 243,232 210,232 H112 L62,272 C56,277 48,272 50,265 L58,228
             C40,218 30,197 30,172 V96 C30,63 57,36 90,36 Z" fill="${C.teal}"/>
    ${paw(150, 132, 130, C.white)}
    <circle cx="244" cy="64" r="46" fill="${C.navy}" stroke="${C.white}" stroke-width="10"/>
    ${bell(244, 63, 36, C.mint)}`,

  calendar: () => `
    <defs><clipPath id="calClip"><rect x="40" y="52" width="220" height="222" rx="36"/></clipPath></defs>
    <rect x="40" y="52" width="220" height="222" rx="36" fill="${C.mint}"/>
    <rect x="40" y="52" width="220" height="70" fill="${C.teal}" clip-path="url(#calClip)"/>
    <rect x="40" y="52" width="220" height="222" rx="36" fill="none" stroke="${C.navy}" stroke-width="12"/>
    <rect x="92" y="26" width="20" height="54" rx="10" fill="${C.navy}"/>
    <rect x="188" y="26" width="20" height="54" rx="10" fill="${C.navy}"/>
    ${paw(150, 192, 118, C.teal)}
    <circle cx="246" cy="252" r="40" fill="${C.navy}" stroke="${C.white}" stroke-width="9"/>
    ${check(246, 252, 40, C.mint, 9)}`,
};

// ---------- concepts ----------
const concepts = [
  { id: "01-pet-card", icon: "card", name: "Pet Card", note: "Pet ID card with dog profile and QR — closest to the reference.", bg: "light" },
  { id: "02-health-shield", icon: "shield", name: "Health Shield", note: "Shield + paw + check: protection, verified health records.", bg: "mint" },
  { id: "03-scan-paw", icon: "scan", name: "Scan Paw", note: "Paw inside QR scan corners on a navy tile: app-icon style.", bg: "navy" },
  { id: "04-reminder-bubble", icon: "bubble", name: "Reminder Bubble", note: "Chat bubble + paw + bell: Zalo reminders for pet care.", bg: "teal" },
  { id: "05-vaccine-calendar", icon: "calendar", name: "Vaccine Calendar", note: "Calendar + paw + check: vaccination schedule tracking.", bg: "light2" },
];

// ---------- logo 512x512 ----------
function logoSvg(c) {
  const k = 1.08, size = 300 * k;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${C.white}"/>
  <g transform="translate(${(512 - size) / 2} 34) scale(${k})">${icons[c.icon]()}</g>
  <text x="256" y="468" text-anchor="middle" font-family="${WORD_FONT}" font-weight="700" font-size="94"
        letter-spacing="-1" fill="${C.navy}">Reoka</text>
</svg>`;
}

// ---------- banner 1920x1080 ----------
const themes = {
  light: { bg: `<rect width="1920" height="1080" fill="${C.white}"/><circle cx="1500" cy="520" r="620" fill="${C.mint}"/>`, text: C.navy, sub: C.teal, chipBg: C.mint, chipText: C.navy, deco: C.teal },
  mint: { bg: `<rect width="1920" height="1080" fill="${C.mint}"/><circle cx="1560" cy="560" r="560" fill="${C.white}" opacity="0.7"/>`, text: C.navy, sub: C.teal, chipBg: C.white, chipText: C.navy, deco: C.teal },
  navy: { bg: `<rect width="1920" height="1080" fill="${C.navy}"/><circle cx="1500" cy="540" r="600" fill="${C.teal}" opacity="0.25"/>`, text: C.white, sub: C.mint, chipBg: "rgba(221,244,239,0.14)", chipText: C.white, deco: C.mint },
  teal: { bg: `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.teal}"/><stop offset="1" stop-color="${C.navy}"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#g)"/>`, text: C.white, sub: C.mint, chipBg: "rgba(255,255,255,0.16)", chipText: C.white, deco: C.white },
  light2: { bg: `<rect width="1920" height="1080" fill="${C.white}"/><rect x="1056" y="0" width="864" height="1080" fill="${C.mint}"/><rect x="1056" y="0" width="10" height="1080" fill="${C.teal}"/>`, text: C.navy, sub: C.teal, chipBg: C.mint, chipText: C.navy, deco: C.teal },
};

function chip(x, y, label, t) {
  const w = label.length * 15.5 + 64;
  return { w, svg: `<rect x="${x}" y="${y}" width="${w}" height="60" rx="30" fill="${t.chipBg}"/>
    <circle cx="${x + 30}" cy="${y + 30}" r="7" fill="${t.sub}"/>
    <text x="${x + 46}" y="${y + 40}" font-family="${UI_FONT}" font-size="27" font-weight="600" fill="${t.chipText}">${label}</text>` };
}

function petCard(x, y, seed) {
  const w = 660, h = 410;
  const row = (i, label, value) => `
    <text x="${x + 240}" y="${y + 142 + i * 64}" font-family="${UI_FONT}" font-size="20" fill="#6B7C8C">${label}</text>
    <text x="${x + 240}" y="${y + 172 + i * 64}" font-family="${UI_FONT}" font-size="28" font-weight="700" fill="${C.navy}">${value}</text>`;
  return `
  <g filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="32" fill="${C.white}"/>
  </g>
  <path d="M${x},${y + 32} C${x},${y + 14} ${x + 14},${y} ${x + 32},${y} H${x + w - 32} C${x + w - 14},${y} ${x + w},${y + 14} ${x + w},${y + 32} V${y + 88} H${x} Z" fill="${C.teal}"/>
  <text x="${x + 40}" y="${y + 56}" font-family="${UI_FONT}" font-size="28" font-weight="700" letter-spacing="2" fill="${C.white}">THẺ THÚ CƯNG</text>
  <text x="${x + w - 40}" y="${y + 56}" text-anchor="end" font-family="${WORD_FONT}" font-size="28" font-weight="700" fill="${C.mint}">Reoka</text>
  <circle cx="${x + 125}" cy="${y + 220}" r="82" fill="${C.mint}"/>
  ${paw(x + 125, y + 216, 96, C.teal)}
  <rect x="${x + 50}" y="${y + 322}" width="150" height="40" rx="20" fill="${C.mint}"/>
  <text x="${x + 125}" y="${y + 349}" text-anchor="middle" font-family="${UI_FONT}" font-size="20" font-weight="700" fill="${C.teal}">#RK-0215</text>
  ${row(0, "Tên", "Mochi")}
  ${row(1, "Giống", "Corgi · Đực")}
  ${row(2, "Ngày sinh", "12/03/2023")}
  ${row(3, "Chủ nuôi", "Nguyễn Văn An")}
  <rect x="${x + 474}" y="${y + 134}" width="150" height="150" rx="16" fill="${C.white}" stroke="${C.mint}" stroke-width="4"/>
  <g transform="translate(${x + 486} ${y + 146})">${qr(0, 0, 126, C.navy, seed)}</g>
  <text x="${x + 549}" y="${y + 316}" text-anchor="middle" font-family="${UI_FONT}" font-size="18" fill="#6B7C8C">Quét để xem tiêm chủng</text>`;
}

function toast(x, y) {
  return `
  <g filter="url(#shadow)"><rect x="${x}" y="${y}" width="560" height="104" rx="26" fill="${C.white}"/></g>
  <circle cx="${x + 56}" cy="${y + 52}" r="32" fill="${C.teal}"/>
  ${bell(x + 56, y + 51, 26, C.white)}
  <text x="${x + 106}" y="${y + 44}" font-family="${UI_FONT}" font-size="25" font-weight="700" fill="${C.navy}">Nhắc lịch tái chủng</text>
  <text x="${x + 106}" y="${y + 78}" font-family="${UI_FONT}" font-size="21" fill="#6B7C8C">Mochi · Vắc-xin 7 bệnh · 15/11/2026</text>`;
}

function bannerSvg(c, idx) {
  const t = themes[c.bg];
  const chips = ["Lịch sử khám", "Nhắc tái chủng qua Zalo", "Thẻ QR"];
  let cx = 160, chipSvg = "";
  for (const l of chips) { const ch = chip(cx, 690, l, t); chipSvg += ch.svg; cx += ch.w + 18; }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
  <defs><filter id="shadow" x="-20%" y="-20%" width="140%" height="160%">
    <feDropShadow dx="0" dy="18" stdDeviation="22" flood-color="#17324D" flood-opacity="0.18"/></filter></defs>
  ${t.bg}
  <g transform="translate(0 24)">
  <g opacity="0.08">${paw(1820, 120, 150, t.deco)}${paw(120, 980, 120, t.deco)}${paw(960, 140, 80, t.deco)}</g>
  <g transform="translate(160 300) scale(0.62)">${icons[c.icon]()}${c.bg === "navy" ? `<rect x="2" y="2" width="296" height="296" rx="72" fill="none" stroke="${C.mint}" stroke-opacity="0.5" stroke-width="5"/>` : ""}</g>
  <text x="378" y="450" font-family="${WORD_FONT}" font-weight="700" font-size="168" letter-spacing="-3" fill="${t.text}">Reoka</text>
  <text x="164" y="572" font-family="${UI_FONT}" font-weight="700" font-size="56" fill="${t.text}">Sổ sức khỏe &amp; thẻ thú cưng online</text>
  <text x="164" y="636" font-family="${UI_FONT}" font-size="34" fill="${t.sub}">Lưu hồ sơ khám, nhắc lịch tái chủng ngay trên Zalo</text>
  ${chipSvg}
  ${petCard(1100, 390, 3 + idx * 5)}
  ${toast(1190, 236)}
  </g>
</svg>`;
}

// ---------- render ----------
function render(svgPath, pngPath, w, h) {
  execFileSync(CHROME, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    `--window-size=${w},${h}`, `--screenshot=${pngPath}`, `file://${svgPath}`,
  ], { stdio: "ignore" });
}

concepts.forEach((c, i) => {
  const dir = join(ROOT, "brand", "concepts", c.id);
  mkdirSync(dir, { recursive: true });
  const files = [["logo", logoSvg(c), 512, 512], ["banner", bannerSvg(c, i), 1920, 1080]];
  for (const [name, svg, w, h] of files) {
    const svgPath = join(dir, `${name}.svg`);
    writeFileSync(svgPath, svg);
    render(svgPath, join(dir, `${name}-${w}x${h}.png`), w, h);
  }
  console.log(`✓ ${c.id} — ${c.note}`);
});
