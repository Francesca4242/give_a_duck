/* Cartoon duck (and goose) SVG factory. Everything is drawn by hand in code,
   so there are no image assets to load. */
(function () {
  const App = (window.App = window.App || {});
  const OUT = "#3b2618";

  const PALETTE = [
    { body: "#FFD23F", head: null, name: "Classic" },
    { body: "#FFFFFF", head: null, name: "Snowy" },
    { body: "#FF9EC4", head: null, name: "Flamingo-curious" },
    { body: "#7FDBFF", head: null, name: "Blue Steel" },
    { body: "#9BE564", head: null, name: "Pond Weed" },
    { body: "#C9A7FF", head: null, name: "Grape" },
    { body: "#FFB347", head: null, name: "Tango" },
    { body: "#C8B08F", head: "#1E8A57", name: "Mallard" },
    { body: "#FF6B6B", head: null, name: "Hot Sauce" },
    { body: "#5E5E5E", head: null, name: "Goth" },
  ];
  const HATS = ["none", "party", "top", "crown", "shades", "bow", "beanie", "flower", "cap", "halo", "horns", "none"];
  const MOODS = ["normal", "happy", "sly", "normal", "wink"];

  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

  function eyes(mood, x, y, r, lid) {
    switch (mood) {
      case "happy":
        return `<path d="M${x - r} ${y + 2} Q${x} ${y - r * 1.4} ${x + r} ${y + 2}" fill="none" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>`;
      case "wink":
        return `<path d="M${x - r} ${y} L${x + r} ${y}" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>`;
      case "dead":
        return `<path d="M${x - 7} ${y - 7} L${x + 7} ${y + 7} M${x + 7} ${y - 7} L${x - 7} ${y + 7}" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>`;
      case "shock":
        return `<circle cx="${x}" cy="${y}" r="${r + 4}" fill="#fff" stroke="${OUT}" stroke-width="4"/><circle cx="${x + 1}" cy="${y}" r="3.5" fill="${OUT}"/>`;
      case "sly":
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${OUT}" stroke-width="4"/>
          <circle cx="${x + 3}" cy="${y + 2}" r="${r * 0.55}" fill="${OUT}"/>
          <path d="M${x - r - 3} ${y - 1} L${x + r + 3} ${y - 4} L${x + r + 3} ${y - r - 4} L${x - r - 3} ${y - r - 4}Z" fill="${lid || "#000"}" class="lid"/>
          <path d="M${x - r - 2} ${y - 1} L${x + r + 2} ${y - 4}" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>`;
      default:
        return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${OUT}" stroke-width="4"/>
          <circle cx="${x + 3}" cy="${y + 1}" r="${r * 0.55}" fill="${OUT}"/>
          <circle cx="${x + 5}" cy="${y - 2}" r="${r * 0.2}" fill="#fff"/>`;
    }
  }

  function hat(kind, cx, top) {
    // cx = centre of head, top = y of top of head
    switch (kind) {
      case "party":
        return `<g transform="rotate(12 ${cx} ${top})"><path d="M${cx - 20} ${top + 8} L${cx} ${top - 42} L${cx + 20} ${top + 8}Z" fill="#FF5FA2" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
          <path d="M${cx - 12} ${top - 12} L${cx + 12} ${top - 6} M${cx - 16} ${top} L${cx + 16} ${top + 6}" stroke="#FFE066" stroke-width="5"/>
          <circle cx="${cx}" cy="${top - 44}" r="7" fill="#7FDBFF" stroke="${OUT}" stroke-width="3"/></g>`;
      case "top":
        return `<g transform="rotate(-8 ${cx} ${top})"><rect x="${cx - 30}" y="${top - 2}" width="60" height="10" rx="4" fill="#222" stroke="${OUT}" stroke-width="3"/>
          <rect x="${cx - 19}" y="${top - 44}" width="38" height="44" rx="4" fill="#222" stroke="${OUT}" stroke-width="3"/>
          <rect x="${cx - 19}" y="${top - 12}" width="38" height="8" fill="#E63946"/></g>`;
      case "crown":
        return `<path d="M${cx - 24} ${top + 6} L${cx - 26} ${top - 26} L${cx - 12} ${top - 10} L${cx} ${top - 32} L${cx + 12} ${top - 10} L${cx + 26} ${top - 26} L${cx + 24} ${top + 6}Z" fill="#FFC300" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
          <circle cx="${cx}" cy="${top - 6}" r="5" fill="#E63946"/><circle cx="${cx - 14}" cy="${top - 2}" r="3.5" fill="#4CC9F0"/><circle cx="${cx + 14}" cy="${top - 2}" r="3.5" fill="#4CC9F0"/>`;
      case "beanie":
        return `<path d="M${cx - 34} ${top + 18} Q${cx - 34} ${top - 22} ${cx} ${top - 22} Q${cx + 34} ${top - 22} ${cx + 34} ${top + 18}Z" fill="#4361EE" stroke="${OUT}" stroke-width="4"/>
          <rect x="${cx - 36}" y="${top + 8}" width="72" height="13" rx="6" fill="#3A0CA3" stroke="${OUT}" stroke-width="4"/>
          <circle cx="${cx}" cy="${top - 26}" r="10" fill="#F72585" stroke="${OUT}" stroke-width="4"/>`;
      case "cap":
        return `<path d="M${cx - 32} ${top + 14} Q${cx - 30} ${top - 20} ${cx} ${top - 20} Q${cx + 30} ${top - 20} ${cx + 32} ${top + 14}Z" fill="#E63946" stroke="${OUT}" stroke-width="4"/>
          <path d="M${cx + 20} ${top + 12} Q${cx + 50} ${top + 6} ${cx + 62} ${top + 16} L${cx + 26} ${top + 18}Z" fill="#C1121F" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>`;
      case "flower":
        return `<g transform="translate(${cx - 18} ${top + 4})">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="7" ry="11" cy="-10" fill="#FF8FAB" stroke="${OUT}" stroke-width="3" transform="rotate(${a})"/>`).join("")}<circle r="7" fill="#FFD23F" stroke="${OUT}" stroke-width="3"/></g>`;
      case "halo":
        return `<ellipse cx="${cx}" cy="${top - 14}" rx="26" ry="8" fill="none" stroke="#FFE066" stroke-width="6"/>`;
      case "horns":
        return `<path d="M${cx - 22} ${top + 6} Q${cx - 34} ${top - 16} ${cx - 20} ${top - 26} Q${cx - 18} ${top - 8} ${cx - 8} ${top + 2}Z" fill="#E63946" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
          <path d="M${cx + 22} ${top + 6} Q${cx + 34} ${top - 16} ${cx + 20} ${top - 26} Q${cx + 18} ${top - 8} ${cx + 8} ${top + 2}Z" fill="#E63946" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>`;
      default:
        return "";
    }
  }

  /**
   * Build a duck.
   * opts: body, head, beak, mood, hat, quack (open beak), goose, flip, cls, title
   */
  function duck(opts = {}) {
    const o = Object.assign({ body: "#FFD23F", head: null, beak: "#FF8A1E", mood: "normal", hat: "none", quack: false, goose: false, flip: false, cls: "" }, opts);
    if (o.goose) return goose(o);
    const body = o.body, head = o.head || body, wing = shade(body, -28), beak = o.beak;
    const hx = 132, hy = 72, hr = 37;

    // silhouette shapes (drawn twice: once fat in outline colour, once filled)
    const sil = [
      [`<path d="M36 122 Q14 94 26 82 Q44 98 64 102Z"/>`, body], // tail
      [`<ellipse cx="96" cy="130" rx="64" ry="44"/>`, body],
      [`<circle cx="${hx}" cy="${hy}" r="${hr}"/>`, head],
    ];
    const beakShape = o.quack
      ? `<path d="M160 64 Q196 52 198 64 Q186 74 162 76Z" fill="${beak}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
         <path d="M160 82 Q190 90 194 100 Q176 104 158 92Z" fill="${shade(beak, -25)}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
         <path d="M162 76 Q170 80 160 84" fill="#7a1e1e"/>`
      : `<path d="M158 70 Q196 62 196 78 Q186 92 158 88Z" fill="${beak}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
         <path d="M162 80 Q178 82 192 79" fill="none" stroke="${OUT}" stroke-width="3" stroke-linecap="round" opacity=".5"/>`;

    const svg = `<svg class="duck ${o.cls}" viewBox="0 -30 210 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${o.title || "a cartoon duck"}"${o.flip ? ' style="transform:scaleX(-1)"' : ""}>
      <g class="feet" fill="${beak}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round">
        <path class="foot-l" d="M78 166 L62 186 Q74 182 80 188 Q86 182 98 186Z"/>
        <path class="foot-r" d="M114 166 L102 186 Q114 182 120 188 Q126 182 138 186Z"/>
      </g>
      <g class="bod">
        <g fill="${OUT}" stroke="${OUT}" stroke-width="9" stroke-linejoin="round">${sil.map((s) => s[0]).join("")}</g>
        ${sil.map((s) => s[0].replace("/>", ` fill="${s[1]}"/>`)).join("")}
        <path class="wing" d="M62 118 Q94 92 134 122 Q118 152 72 142 Q58 132 62 118Z" fill="${wing}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
        <path d="M80 126 Q96 122 112 130" fill="none" stroke="${OUT}" stroke-width="3" stroke-linecap="round" opacity=".35"/>
        ${o.head ? `<path d="M104 100 Q132 112 160 96" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round"/>` : ""}
        <ellipse cx="146" cy="88" rx="9" ry="6" fill="#FF7AA8" opacity=".55"/>
        ${beakShape}
        <g class="eyes">${eyes(o.mood, 140, 62, 9, head)}</g>
        ${hat(o.hat === "shades" || o.hat === "bow" ? "none" : o.hat, hx - 4, hy - hr + 2)}
        ${o.hat === "shades" ? `<g><rect x="122" y="52" width="30" height="18" rx="7" fill="#111" stroke="${OUT}" stroke-width="3"/><rect x="152" y="58" width="10" height="5" fill="#111"/><path d="M127 57 L136 57" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/></g>` : ""}
        ${o.hat === "bow" ? `<g transform="translate(118 108)"><path d="M0 0 L-18 -12 L-18 12Z M0 0 L18 -12 L18 12Z" fill="#E63946" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/><circle r="5" fill="#C1121F" stroke="${OUT}" stroke-width="3"/></g>` : ""}
      </g>
    </svg>`;
    return svg;
  }

  function goose(o) {
    // Canada-goose-ish: brown body, black neck & head, white chinstrap
    const body = "#A07C5B", wing = "#7B5B40", neck = "#2A2A2A";
    const mood = o.mood === "normal" ? "sly" : o.mood;
    return `<svg class="duck goose ${o.cls}" viewBox="0 -30 210 230" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${o.title || "a menacing goose"}"${o.flip ? ' style="transform:scaleX(-1)"' : ""}>
      <g class="feet" fill="#2A2A2A" stroke="${OUT}" stroke-width="4" stroke-linejoin="round">
        <path class="foot-l" d="M70 166 L54 186 Q66 182 72 188 Q78 182 90 186Z"/>
        <path class="foot-r" d="M104 166 L92 186 Q104 182 110 188 Q116 182 128 186Z"/>
      </g>
      <g class="bod">
        <g fill="${OUT}" stroke="${OUT}" stroke-width="9" stroke-linejoin="round">
          <path d="M28 128 Q8 108 18 98 Q36 110 54 112Z"/><ellipse cx="86" cy="134" rx="62" ry="40"/>
          <path d="M112 112 Q120 60 134 30 L160 36 Q142 76 146 118Z"/><ellipse cx="150" cy="22" rx="28" ry="22"/>
        </g>
        <path d="M28 128 Q8 108 18 98 Q36 110 54 112Z" fill="#F4F1EA"/>
        <ellipse cx="86" cy="134" rx="62" ry="40" fill="${body}"/>
        <ellipse cx="90" cy="150" rx="44" ry="20" fill="#E9E1D3"/>
        <path d="M112 112 Q120 60 134 30 L160 36 Q142 76 146 118Z" fill="${neck}"/>
        <ellipse cx="150" cy="22" rx="28" ry="22" fill="${neck}"/>
        <path d="M134 30 Q140 44 156 40 Q150 30 140 26Z" fill="#fff"/>
        <path d="M56 124 Q86 100 124 128 Q108 156 66 146Z" fill="${wing}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
        ${o.quack
          ? `<path d="M172 12 Q204 2 206 14 Q192 22 174 22Z" fill="#2A2A2A" stroke="${OUT}" stroke-width="3"/><path d="M174 28 Q198 34 200 44 Q186 44 172 34Z" fill="#2A2A2A" stroke="${OUT}" stroke-width="3"/><path d="M175 22 L182 28 L174 30Z" fill="#c0392b"/>`
          : `<path d="M172 16 Q206 10 204 24 Q192 34 172 30Z" fill="#2A2A2A" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>`}
        <g class="eyes">${eyes(mood, 160, 14, 7, neck)}</g>
        <path d="M150 0 L170 6" stroke="#E63946" stroke-width="5" stroke-linecap="round"/>
        ${hat(o.hat === "shades" || o.hat === "bow" ? "none" : o.hat, 150, 2)}
      </g>
    </svg>`;
  }

  /** Random look for a player, deterministic from a seed number. */
  function look(seed) {
    const r = (n) => Math.abs(Math.floor(Math.sin(seed * 9301 + n * 49297) * 233280)) ;
    const p = PALETTE[r(1) % PALETTE.length];
    return { body: p.body, head: p.head, hat: HATS[r(2) % HATS.length], mood: MOODS[r(3) % MOODS.length] };
  }

  App.duck = duck;
  App.duckLook = look;
  App.duckFor = (player, extra) => duck(Object.assign({}, player.look, extra || {}, { title: player.name + "'s duck" }));
})();
