import IntegrationGalaxy, { GalaxyNode, GalaxyRing } from "@/components/IntegrationGalaxy";

/* ─────────────────────────────────────────────────────────────────────────────
   Logos: usa los que ya están en el proyecto.
   Ajusta cada ruta al nombre real del archivo en src/assets.
   Si borras un import y dejas `logo` sin definir, se dibujan las iniciales.
   ───────────────────────────────────────────────────────────────────────────── */
import logoIcon    from "@/assets/logo-icon.png";
import metaLogo    from "@/assets/meta.png";
import tiktokLogo  from "@/assets/tiktokads.png";
import shopifyLogo from "@/assets/orb-shopify.png";
import whatsappLogo from "@/assets/whatsapp-logo.webp";
import instagramLogo from "@/assets/instagram.svg";
import sheetsLogo  from "@/assets/orb-sheets.png";
import shalomLogo  from "@/assets/shalom-pro.png";
import olvaLogo    from "@/assets/olva.png";
import fenixLogo   from "@/assets/fenixg.png";
import aliclikLogo from "@/assets/aliclik.png";
import boxfulLogo  from "@/assets/boxful-logo.svg";
import masterLogo  from "@/assets/mastershop-logo.png";
import swaypLogo   from "@/assets/swayp-logo.png";
import evaLogo     from "@/assets/eva-courier-logo.jpeg";

/* Cuatro anillos: adentro de dónde viene la venta, afuera por dónde sale el pedido */
const RINGS: GalaxyRing[] = [
  { r: 1.66, inc:  0.00 },  // publicidad y tienda
  { r: 2.02, inc:  0.36 },  // canales
  { r: 2.38, inc: -0.30 },  // logística
  { r: 2.72, inc:  0.24 },  // logística
];

const NODES: GalaxyNode[] = [
  // Publicidad y tienda
  { name: "Meta Ads",      short: "M",  color: "#4c9bff", logo: metaLogo,      ring: 0, phase: 0.00 },
  { name: "TikTok Ads",    short: "T",  color: "#e8edf5", logo: tiktokLogo,    ring: 0, phase: 2.09 },
  { name: "Shopify",       short: "S",  color: "#a9dc6a", logo: shopifyLogo,   ring: 0, phase: 4.19 },
  // Canales
  { name: "WhatsApp API",  short: "W",  color: "#4ce08a", logo: whatsappLogo,  ring: 1, phase: 0.70 },
  { name: "Instagram",     short: "I",  color: "#c79bff", logo: instagramLogo, ring: 1, phase: 2.79 },
  { name: "Google Sheets", short: "G",  color: "#4bd48e", logo: sheetsLogo,    ring: 1, phase: 4.89 },
  // Logística
  { name: "Shalom",        short: "Sh", color: "#f2705c", logo: shalomLogo,    ring: 2, phase: 0.30 },
  { name: "Olva",          short: "O",  color: "#ffc861", logo: olvaLogo,      ring: 2, phase: 1.87 },
  { name: "Fenix G",       short: "F",  color: "#b79bff", logo: fenixLogo,     ring: 2, phase: 3.44 },
  { name: "Aliclik",       short: "A",  color: "#9d8dff", logo: aliclikLogo,   ring: 2, phase: 5.01 },
  { name: "Boxful",        short: "B",  color: "#5fc9f8", logo: boxfulLogo,    ring: 3, phase: 0.95 },
  { name: "Mastershop",    short: "Ms", color: "#a78bfa", logo: masterLogo,    ring: 3, phase: 2.52 },
  { name: "Swayp",         short: "Sw", color: "#2dd4bf", logo: swaypLogo,     ring: 3, phase: 4.09 },
  { name: "Eva Courier",   short: "Ev", color: "#38bdf8", logo: evaLogo,       ring: 3, phase: 5.66 },
];

export default function HeroGalaxy() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(125%_105%_at_50%_12%,hsl(222_45%_11%)_0%,hsl(222_47%_7%)_58%,hsl(222_47%_5%)_100%)] text-slate-100">
      {/* La galaxia es el fondo de toda la sección, no una ventana */}
      <div className="absolute inset-0 z-0">
        <IntegrationGalaxy
          nodes={NODES}
          rings={RINGS}
          core={{ label: "Rentabilify", short: "R", logo: logoIcon }}
          stars={1500}
          tilt={0.28}
          spreadW={0.183}
          spreadH={0.46}
          band={470}
          coreBottom={258}
          coreSize={0.092}
          tileSize={46}
        />
      </div>

      {/* Velo para que el titular se lea sobre las estrellas */}
      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(76% 34% at 50% 16%, hsl(222 47% 6% / .88) 0%, hsl(222 47% 6% / 0) 72%)," +
            "linear-gradient(180deg, hsl(222 47% 6% / .62) 0%, hsl(222 47% 6% / .18) 34%, transparent 52%)",
        }}
      />

      <div className="relative z-[3] mx-auto max-w-7xl px-4 pt-28 text-center sm:px-6 lg:px-8 lg:pt-36">
        <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-white/5 px-4 py-1.5 text-xs font-semibold text-orange-300">
          El sistema N°1 para vendedores COD en Latinoamérica
        </span>
        <h1 className="text-3xl font-extrabold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
          ¿Cuántas aplicaciones tienes abiertas
          <br />
          <span className="bg-gradient-to-r from-primary to-amber-400 bg-clip-text text-transparent">
            para gestionar un pedido?
          </span>
        </h1>
        <p className="mt-4 text-xl font-bold sm:text-2xl">
          Conéctalas todas desde <span className="text-orange-400">Rentabilify</span>
        </p>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-400 sm:text-base">
          Centraliza pedidos, campañas, logística y finanzas para saber exactamente{" "}
          <b className="font-semibold text-slate-100">cuánto ganas por cada venta</b>.
        </p>

        {/* aquí van tus CTAs existentes */}
      </div>

      {/* Banda reservada para la galaxia: sin esto los anillos invaden el texto */}
      <div className="relative z-[2] h-[340px] md:h-[470px] xl:h-[520px]" />
    </section>
  );
}
