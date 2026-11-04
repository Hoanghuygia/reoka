// Shared mockup helpers for the Reoka UI templates.
// Injects an inline SVG icon sprite (use: <svg class="i"><use href="#i-bell"/></svg>)
// and draws decorative (non-scannable) QR codes into <svg data-qr="seed"></svg>.
(function () {
  const s = (d) => `<path d="${d}"/>`;
  const icons = {
    home: s("M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"),
    cal: '<rect x="3" y="5" width="18" height="16" rx="2.5"/>' + s("M3 10h18M8 3v4M16 3v4"),
    bell: s("M6 16v-5a6 6 0 1 1 12 0v5l2 2H4z") + s("M10 20.5a2 2 0 0 0 4 0"),
    user: '<circle cx="12" cy="8" r="4"/>' + s("M4 21c1-4 4.5-6 8-6s7 2 8 6"),
    pin: s("M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z") + '<circle cx="12" cy="9.5" r="2.5"/>',
    phone: s("M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"),
    chat: s("M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H10l-5 4v-4h0.5A1.5 1.5 0 0 1 4 14.5z"),
    clip: '<rect x="5" y="4" width="14" height="17" rx="2"/>' + s("M9 3h6v3H9zM9 11h6M9 15h6M9 18.5h3"),
    syringe: s("M15 3l6 6M18 6l-9.5 9.5L4 17l1.5-4.5L15 3M8 12l4 4M3 21l2.5-2.5"),
    steth: s("M6 3v6a5 5 0 0 0 10 0V3M11 14v2.5a4 4 0 0 0 8 0V14") + '<circle cx="19" cy="12" r="2"/>',
    plus: s("M12 5v14M5 12h14"),
    edit: s("M4 20h4L19 9l-4-4L4 16zM14 6l4 4"),
    trash: s("M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5"),
    qr: '<rect x="3.5" y="3.5" width="6" height="6" rx="1"/><rect x="14.5" y="3.5" width="6" height="6" rx="1"/><rect x="3.5" y="14.5" width="6" height="6" rx="1"/>' + s("M14 14h3v3h-3zM20.5 14v.5M17 20.5h3.5M20.5 17v3.5"),
    chev: s("M9 6l6 6-6 6"),
    down: s("M6 9l6 6 6-6"),
    back: s("M15 5l-7 7 7 7"),
    search: '<circle cx="11" cy="11" r="7"/>' + s("M20 20l-4-4"),
    clock: '<circle cx="12" cy="12" r="9"/>' + s("M12 7v5l3 2"),
    nav: s("M3 11l18-8-8 18-2-8z"),
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/>' + s("M8.2 11l7.6-3.8M8.2 13l7.6 3.8"),
    camera: s("M4 8h3l2-3h6l2 3h3v11H4z") + '<circle cx="12" cy="13" r="3.5"/>',
    check: s("M5 12.5l4.5 4.5L19 7"),
    download: s("M12 4v11M7 10l5 5 5-5M5 20h14"),
    info: '<circle cx="12" cy="12" r="9"/>' + s("M12 11v5M12 8h.01"),
    scan: s("M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M4 12h16"),
    shield: s("M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6z") + s("M8.5 12l2.5 2.5 4.5-5"),
    filter: s("M4 6h16M7 12h10M10 18h4"),
    lock: '<rect x="5" y="10" width="14" height="10" rx="2"/>' + s("M8 10V7a4 4 0 0 1 8 0v3"),
    file: s("M6 3h8l4 4v14H6zM14 3v4h4"),
    star: s("M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.3-4.1 5.9-.9z"),
    scale: '<rect x="3" y="4" width="18" height="16" rx="3"/>' + s("M8 9a5 5 0 0 1 8 0l-3 3"),
  };
  const filled = {
    paw: '<ellipse cx="5.8" cy="10.2" rx="2" ry="2.5"/><ellipse cx="9.8" cy="5.9" rx="2" ry="2.6"/><ellipse cx="14.2" cy="5.9" rx="2" ry="2.6"/><ellipse cx="18.2" cy="10.2" rx="2" ry="2.5"/><path d="M12 11c-3 0-6.2 4-6.2 6.6 0 2 1.7 2.9 3.3 2.4 1-.3 1.9-.7 2.9-.7s1.9.4 2.9.7c1.6.5 3.3-.4 3.3-2.4C18.2 15 15 11 12 11z"/>',
  };
  let sprite = '<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0" aria-hidden="true">';
  for (const [k, v] of Object.entries(icons))
    sprite += `<symbol id="i-${k}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${v}</symbol>`;
  for (const [k, v] of Object.entries(filled))
    sprite += `<symbol id="i-${k}" viewBox="0 0 24 24" fill="currentColor">${v}</symbol>`;
  // Pet silhouettes (dog from the Reoka logo, plus a matching cat) for photo placeholders.
  sprite += '<symbol id="pet-dog" viewBox="0 0 120 120"><g transform="translate(14 22)"><path fill="currentColor" d="M14,120 L14,58 C14,32 34,14 58,14 C71,14 80,21 84,30 L95,36 C101,40 100,49 93,51 L81,54 C77,63 69,68 61,70 L66,120 Z"/><path fill="none" stroke="var(--pet-ear,#DDF4EF)" stroke-width="3.2" stroke-linecap="round" d="M40,26 C29,30 27,50 33,62 C37,69 45,64 46,54"/><circle cx="66" cy="31" r="3.4" fill="var(--pet-ear,#DDF4EF)"/></g></symbol>';
  sprite += '<symbol id="pet-cat" viewBox="0 0 120 120"><path fill="currentColor" d="M26,142 L26,84 C26,66 34,56 44,51 L40,22 L60,40 C66,38 74,38 80,40 L100,22 L96,51 C106,57 112,67 112,82 C112,92 108,98 102,102 L100,142 Z"/><ellipse cx="62" cy="68" rx="3.4" ry="4.6" fill="var(--pet-ear,#DDF4EF)"/><ellipse cx="84" cy="68" rx="3.4" ry="4.6" fill="var(--pet-ear,#DDF4EF)"/></symbol>';
  sprite += "</svg>";
  document.body.insertAdjacentHTML("afterbegin", sprite);

  // ?shot=N renders only the N-th phone (1-based), used to export preview PNGs.
  const shot = Number(new URLSearchParams(location.search).get("shot"));
  if (shot) {
    const phone = document.querySelectorAll(".g-shot .phone")[shot - 1];
    if (phone) {
      document.body.replaceChildren(document.body.firstChild, phone);
      document.body.style.cssText = "margin:0;background:#E9EFF1";
    }
  }

  // Decorative QR codes.
  document.querySelectorAll("svg[data-qr]").forEach((el) => {
    const n = 25;
    let seed = [...(el.dataset.qr || "reoka")].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
    const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) / 4294967296);
    let d = "";
    const finder = (x, y) => (d += `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`);
    finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
    const inFinder = (x, y) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++)
        if (!inFinder(x, y) && rnd() < 0.47) d += `M${x} ${y}h1v1h-1z`;
    el.setAttribute("viewBox", `0 0 ${n} ${n}`);
    el.setAttribute("shape-rendering", "crispEdges");
    el.innerHTML = `<path fill="currentColor" fill-rule="evenodd" d="${d}"/>`;
  });
})();
