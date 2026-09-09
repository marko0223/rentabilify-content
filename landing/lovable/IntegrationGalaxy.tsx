import { useEffect, useRef } from "react";

/**
 * IntegrationGalaxy
 * -----------------------------------------------------------------------------
 * Campo de estrellas 3D con un núcleo luminoso y las integraciones orbitando en
 * anillos inclinados. Proyección en perspectiva propia sobre Canvas 2D: no usa
 * three.js ni ninguna librería, así que no agrega peso ni depende de un CDN.
 *
 * Se puede arrastrar para girar. Pausa sola cuando sale de pantalla y respeta
 * prefers-reduced-motion.
 */

export type GalaxyNode = {
  /** Nombre que se muestra bajo la baldosa */
  name: string;
  /** Iniciales de respaldo si todavía no hay logo (1 o 2 letras) */
  short: string;
  /** Color de marca para las iniciales y el resplandor */
  color: string;
  /** Logo importado. Si falta, se dibujan las iniciales */
  logo?: string;
  /** Índice del anillo en `rings` */
  ring: number;
  /** Posición inicial sobre el anillo, en radianes */
  phase: number;
};

export type GalaxyRing = {
  /** Radio en unidades de escena (1 ≈ el radio base) */
  r: number;
  /** Inclinación del anillo, en radianes */
  inc: number;
};

export type IntegrationGalaxyProps = {
  nodes: GalaxyNode[];
  rings: GalaxyRing[];
  core: { label: string; short: string; logo?: string };
  className?: string;
  /** Cantidad de estrellas del fondo */
  stars?: number;
  /** Inclinación de la escena: más bajo = elipses más planas */
  tilt?: number;
  /** Escala de los anillos respecto del ancho y de la banda */
  spreadW?: number;
  spreadH?: number;
  /** Alto en px de la banda donde deben caber los anillos */
  band?: number;
  /** Ancla del núcleo medida desde abajo, en px. Tiene prioridad sobre coreY */
  coreBottom?: number;
  /** Ancla del núcleo como fracción del alto (0-1) */
  coreY?: number;
  /** Tamaño del núcleo como fracción del lado menor */
  coreSize?: number;
  /** Lado de las baldosas de logo, en px a profundidad 1 */
  tileSize?: number;
  /** Permitir arrastrar para girar */
  interactive?: boolean;
};

type Star = { x: number; y: number; z: number; s: number; a: number; ph: number; c: string };
type Loaded = { img: HTMLImageElement | null };

export default function IntegrationGalaxy({
  nodes,
  rings,
  core,
  className,
  stars = 1500,
  tilt = 0.28,
  spreadW = 0.183,
  spreadH = 0.46,
  band,
  coreBottom,
  coreY = 0.5,
  coreSize = 0.092,
  tileSize = 46,
  interactive = true,
}: IntegrationGalaxyProps) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const TAU = Math.PI * 2;
    const FOV = 3.1;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

    let W = 0, H = 0, cx = 0, cy = 0, SC = 1, SCS = 1;
    let rot = 0, raf = 0;
    const drag = { on: false, x: 0, vx: 0 };

    /* ── Campo de estrellas: cáscara esférica, más densa en el borde ── */
    const STARS: Star[] = [];
    for (let i = 0; i < stars; i++) {
      const u = Math.random() * TAU;
      const v = Math.acos(2 * Math.random() - 1);
      const shell = Math.random() < 0.72;
      const rr = shell
        ? 2.0 + Math.pow(Math.random(), 0.55) * 0.72
        : Math.pow(Math.random(), 0.7) * 1.95;
      const tone = Math.random();
      STARS.push({
        x: Math.sin(v) * Math.cos(u) * rr,
        y: Math.cos(v) * rr * 0.86,
        z: Math.sin(v) * Math.sin(u) * rr,
        s: 0.6 + Math.random() * 1.55,
        a: 0.42 + Math.random() * 0.58,
        ph: Math.random() * TAU,
        c: tone > 0.93 ? "rgb(188,210,255)" : tone > 0.72 ? "rgb(255,255,255)" : "rgb(246,228,203)",
      });
    }

    /* ── Precarga de logos ── */
    const load = (src?: string): Loaded => {
      if (!src) return { img: null };
      const img = new Image();
      img.decoding = "async";
      img.src = src;
      return { img };
    };
    const coreImg = load(core.logo);
    const nodeImgs = nodes.map((n) => load(n.logo));
    const isReady = (l: Loaded) => !!l.img && l.img.complete && l.img.naturalWidth > 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = cv.getBoundingClientRect();
      W = r.width;
      H = r.height;
      if (!W || !H) return;
      cv.width = Math.round(W * dpr);
      cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = W / 2;
    };

    const scale = () => {
      const b = band ?? H;
      /* anillos y baldosas: acotados a la banda, para no invadir el texto */
      SC = Math.min(W * spreadW, b * spreadH);
      /* estrellas: ocupan todo el lienzo */
      SCS = Math.min(W * 0.42, H * 0.5);
      cy = coreBottom != null ? H - coreBottom : H * coreY;
    };

    const proj = (x: number, y: number, z: number, k: number, ox = cy) => {
      const s1 = Math.sin(rot), c1 = Math.cos(rot);
      const X = x * c1 - z * s1;
      const Z = x * s1 + z * c1;
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      const Y = y * ct - Z * st;
      const Z2 = y * st + Z * ct;
      const f = FOV / (FOV + Z2 + 2.4);
      return { x: cx + X * f * k, y: ox + Y * f * k, f, z: Z2 };
    };

    const onRing = (ring: GalaxyRing, ang: number) => ({
      x: Math.cos(ang) * ring.r,
      y: Math.sin(ang) * Math.sin(ring.inc) * ring.r * 0.9,
      z: Math.sin(ang) * ring.r * Math.cos(ring.inc),
    });

    const rrect = (x: number, y: number, w: number, h: number, r: number) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    };

    const draw = (now: number) => {
      if (!W || !H) {
        resize();
        raf = requestAnimationFrame(draw);
        return;
      }
      scale();
      ctx.clearRect(0, 0, W, H);

      if (!reduce && !drag.on) rot += 0.00085;
      rot += drag.vx;
      drag.vx *= 0.94;

      const coreP = proj(0, 0, 0, SC);

      /* ── Resplandor del núcleo ── */
      const gR = Math.min(W, H) * 0.42;
      const g = ctx.createRadialGradient(coreP.x, coreP.y, 0, coreP.x, coreP.y, gR);
      g.addColorStop(0, "rgba(255,196,128,0.42)");
      g.addColorStop(0.22, "rgba(255,138,54,0.16)");
      g.addColorStop(0.55, "rgba(150,90,180,0.07)");
      g.addColorStop(1, "rgba(90,60,120,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(coreP.x, coreP.y, gR, 0, TAU);
      ctx.fill();

      /* ── Estrellas ── */
      ctx.globalCompositeOperation = "lighter";
      for (const st of STARS) {
        const pt = proj(st.x, st.y, st.z, SCS, H * 0.5);
        if (pt.f <= 0.1) continue;
        const tw = reduce ? 1 : 0.62 + 0.38 * Math.sin(now * 0.0012 + st.ph);
        const dep = Math.max(0, Math.min(1, (pt.f - 0.24) / 0.8));
        ctx.globalAlpha = st.a * tw * (0.42 + 0.58 * dep);
        ctx.fillStyle = st.c;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, st.s * pt.f, 0, TAU);
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      /* ── Órbitas punteadas ── */
      ctx.setLineDash([4, 7]);
      ctx.lineDashOffset = -(now * 0.012) % 11;
      ctx.strokeStyle = "rgba(255,150,80,0.26)";
      ctx.lineWidth = 1;
      for (const rg of rings) {
        ctx.beginPath();
        for (let a = 0; a <= 72; a++) {
          const q = onRing(rg, (a / 72) * TAU);
          const pp = proj(q.x, q.y, q.z, SC);
          a === 0 ? ctx.moveTo(pp.x, pp.y) : ctx.lineTo(pp.x, pp.y);
        }
        ctx.stroke();
      }
      ctx.setLineDash([]);

      /* ── Puntos recorriendo las órbitas ── */
      rings.forEach((rg, k) => {
        for (let d = 0; d < 3; d++) {
          const ang = now * 0.00013 * (1 - k * 0.16) + d * (TAU / 3) + k * 0.7;
          const q = onRing(rg, ang);
          const dp = proj(q.x, q.y, q.z, SC);
          if (dp.f <= 0.14) continue;
          ctx.globalAlpha = Math.min(0.9, (dp.f - 0.14) * 1.9);
          ctx.fillStyle = "#ffc182";
          ctx.beginPath();
          ctx.arc(dp.x, dp.y, 2.4 * dp.f, 0, TAU);
          ctx.fill();
        }
      });
      ctx.globalAlpha = 1;

      /* ── Baldosas de logo, de atrás hacia adelante ── */
      const list = nodes.map((nd, i) => {
        const rg = rings[nd.ring] ?? rings[0];
        const ang = nd.phase + (reduce ? 0 : now * 0.000052 * (1 - nd.ring * 0.14));
        const q = onRing(rg, ang);
        return { nd, i, p: proj(q.x, q.y, q.z, SC) };
      });
      list.sort((a, b) => b.p.z - a.p.z);

      const occl = Math.max(46, Math.min(W, H) * coreSize) * 0.85;
      for (const { nd, i, p } of list) {
        if (p.f <= 0.14) continue;
        /* si pasa por detrás del núcleo, queda oculto */
        if (p.z > 0 && Math.hypot(p.x - coreP.x, p.y - coreP.y) < occl) continue;

        const sz = Math.max(tileSize * 0.55, tileSize * p.f);
        const x = p.x - sz / 2;
        const y = p.y - sz / 2;
        const ready = isReady(nodeImgs[i]);
        ctx.globalAlpha = Math.min(1, (p.f - 0.14) * 2.6);

        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,.55)";
        ctx.shadowBlur = 14 * p.f;
        ctx.shadowOffsetY = 3 * p.f;
        ctx.fillStyle = "rgba(15,21,34,.92)";
        rrect(x, y, sz, sz, sz * 0.3);
        ctx.fill();
        ctx.restore();
        ctx.strokeStyle = "rgba(255,255,255,.13)";
        ctx.lineWidth = 1;
        rrect(x, y, sz, sz, sz * 0.3);
        ctx.stroke();

        if (ready) {
          ctx.save();
          rrect(x, y, sz, sz, sz * 0.3);
          ctx.clip();
          const pad = sz * 0.2;
          ctx.drawImage(nodeImgs[i].img!, x + pad, y + pad, sz - pad * 2, sz - pad * 2);
          ctx.restore();
        } else {
          ctx.fillStyle = nd.color;
          ctx.font = `800 ${Math.round(sz * (nd.short.length > 1 ? 0.3 : 0.44))}px Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(nd.short, p.x, p.y + 0.5);
        }

        /* etiqueta en pastilla, siempre dentro del lienzo */
        if (p.f > 0.4) {
          ctx.globalAlpha = Math.min(1, (p.f - 0.4) * 3.2);
          const fs = Math.max(10, Math.round(12.5 * p.f));
          ctx.font = `600 ${fs}px Inter, system-ui, sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          const pw = ctx.measureText(nd.name).width + 16;
          const ph = fs + 10;
          const ly = p.y + sz / 2 + ph / 2 + 8;
          const lx = Math.max(pw / 2 + 6, Math.min(W - pw / 2 - 6, p.x));
          ctx.fillStyle = "rgba(10,16,28,.72)";
          rrect(lx - pw / 2, ly - ph / 2, pw, ph, ph / 2);
          ctx.fill();
          ctx.fillStyle = "rgba(238,244,255,.94)";
          ctx.fillText(nd.name, lx, ly + 0.5);
        }
        ctx.globalAlpha = 1;
      }

      /* ── Núcleo ── */
      const cs = Math.max(46, Math.min(W, H) * coreSize);
      const pulse = 1 + (reduce ? 0 : 0.02 * Math.sin(now * 0.0015));
      const cw = cs * pulse;
      const cxr = coreP.x - cw / 2;
      const cyr = coreP.y - cw / 2;

      ctx.save();
      ctx.shadowColor = "rgba(255,146,54,.85)";
      ctx.shadowBlur = 44;
      ctx.fillStyle = "rgba(15,21,34,.95)";
      rrect(cxr, cyr, cw, cw, cw * 0.3);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = "rgba(255,168,92,.45)";
      ctx.lineWidth = 1.5;
      rrect(cxr, cyr, cw, cw, cw * 0.3);
      ctx.stroke();

      if (isReady(coreImg)) {
        ctx.save();
        rrect(cxr, cyr, cw, cw, cw * 0.3);
        ctx.clip();
        const cp = cw * 0.2;
        ctx.drawImage(coreImg.img!, cxr + cp, cyr + cp, cw - cp * 2, cw - cp * 2);
        ctx.restore();
      } else {
        const lg = ctx.createLinearGradient(cxr, cyr, cxr + cw, cyr + cw);
        lg.addColorStop(0, "#ffcf9a");
        lg.addColorStop(1, "#ff7a1a");
        ctx.fillStyle = lg;
        ctx.font = `900 ${Math.round(cw * 0.46)}px Inter, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(core.short, coreP.x, coreP.y + 1);
      }

      /* etiqueta del núcleo, arriba: por delante siempre pasa un nodo */
      const cfs = 13;
      ctx.font = `700 ${cfs}px Inter, system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const cpw = ctx.measureText(core.label).width + 18;
      const cph = cfs + 11;
      const cly = coreP.y - cw / 2 - cph / 2 - 10;
      ctx.fillStyle = "rgba(10,16,28,.78)";
      rrect(coreP.x - cpw / 2, cly - cph / 2, cpw, cph, cph / 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(core.label, coreP.x, cly + 0.5);

      raf = requestAnimationFrame(draw);
    };

    /* ── Arrastrar para girar ── */
    const px = (e: MouseEvent | TouchEvent) =>
      "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
    const down = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      drag.on = true;
      drag.x = px(e);
    };
    const move = (e: MouseEvent | TouchEvent) => {
      if (!drag.on) return;
      const x = px(e);
      drag.vx = (x - drag.x) * 0.003;
      drag.x = x;
    };
    const up = () => { drag.on = false; };

    cv.addEventListener("mousedown", down);
    cv.addEventListener("touchstart", down, { passive: true });
    window.addEventListener("mousemove", move);
    cv.addEventListener("touchmove", move, { passive: true });
    window.addEventListener("mouseup", up);
    window.addEventListener("touchend", up);

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(cv);

    /* Pausa cuando sale de pantalla */
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting && !raf) raf = requestAnimationFrame(draw);
          else if (!en.isIntersecting && raf) { cancelAnimationFrame(raf); raf = 0; }
        }
      },
      { threshold: 0 },
    );
    io.observe(cv);

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      cv.removeEventListener("mousedown", down);
      cv.removeEventListener("touchstart", down);
      window.removeEventListener("mousemove", move);
      cv.removeEventListener("touchmove", move);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchend", up);
    };
  }, [
    nodes, rings, core, stars, tilt, spreadW, spreadH,
    band, coreBottom, coreY, coreSize, tileSize, interactive,
  ]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ display: "block", width: "100%", height: "100%", cursor: interactive ? "grab" : "default" }}
      role="img"
      aria-label={`Galaxia de integraciones: ${core.label} en el núcleo, con ${nodes
        .map((n) => n.name)
        .join(", ")} orbitando alrededor.`}
    />
  );
}
