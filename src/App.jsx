import { useState, useEffect, useRef, useCallback } from “react”;

// ─────────────────────────────────────────────
// ÚNICA LLAMADA — Anthropic API con Web Search
// ─────────────────────────────────────────────
async function ask(userMsg) {
const res = await fetch(“https://api.anthropic.com/v1/messages”, {
method: “POST”,
headers: { “Content-Type”: “application/json” },
body: JSON.stringify({
model: “claude-sonnet-4-20250514”,
max_tokens: 1000,
system: `Eres RADAR G-7, sistema de inteligencia predictiva crypto de élite.  SIEMPRE usa web_search para obtener datos reales antes de responder. Responde en español. Sé directo y usa números reales obtenidos del search. BASE HISTÓRICA: RAVE DAO Abr2026 $0.25→$28(+6000%)→-95% en 48h por supply 90% insiders. Momentum MMT Nov2025 TGE +4000%→-86%. Luna Terra May2022 $119→$0.0003 en 4 días por stablecoin algorítmica insostenible. SEÑALES PUMP: Vol/MCap>15% súbito, precio lateral+vol bajo, +3% en 1H sin noticias, listing Binance/OKX, RSI<30 rebotando. SEÑALES DUMP: Vol/MCap>30% precio estancado, pump>200% sin catalizador, supply>70% pocas wallets, RSI>80+divergencia.`,
messages: [{ role: “user”, content: userMsg }],
tools: [{ type: “web_search_20250305”, name: “web_search” }],
}),
});
if (!res.ok) {
const t = await res.text().catch(() => “”);
throw new Error(`${res.status}: ${t.slice(0, 120)}`);
}
const d = await res.json();
if (d.error) throw new Error(d.error.message || JSON.stringify(d.error));
const text = (d.content || []).filter(b => b.type === “text”).map(b => b.text).join(”\n”).trim();
if (!text) throw new Error(“Respuesta vacía del servidor”);
return text;
}

// ─────────────────────────────────────────────
// PROMPTS — cortos y directos
// ─────────────────────────────────────────────
const FORMAT = ` Responde con este formato: ━━━━━━━━━━━━━━━━━━━━━━━ 🛰️ RADAR G-7 — ANÁLISIS ━━━━━━━━━━━━━━━━━━━━━━━ 📌 ACTIVO: [Nombre] ($SYM) 💰 PRECIO: $[real] | 24H: [%] | 7D: [%] ◈ SEÑAL: [PUMP INMINENTE 🟢 / DUMP INMINENTE 🔴 / ALERTA ALTA ⚠️ / VIGILANCIA 👁 / NEUTRO ⚪] ◈ SCORE: [X]/10 | PROB: [X%] [ALTA/MEDIA/BAJA] ◈ VENTANA: [tiempo estimado] ━━━ MÉTRICAS ━━━ MCap: $[real] | Vol24H: $[real] | Vol/MCap: [%] ATH: $[real] | Desde ATH: [%] ━━━ HISTÓRICO ━━━ 📁 Similar a: [caso más parecido de RAVE DAO / Momentum MMT / Luna Terra / otro] ━━━ SEÑALES ━━━ 🔺 BULLISH: → [señal] → [señal] 🔻 BEARISH: → [señal] → [señal] ━━━ ESTRATEGIA ━━━ 🎯 TARGET: $[precio] (+[%]) | 🛑 STOP: $[precio] (-[%]) ⚖️ R/R: [X:1] ━━━ VEREDICTO ━━━ [3 líneas concretas: qué hacer, cuándo, qué lo invalida] CONVICCIÓN: [X]/10 ⚠️ Informativo. DYOR.`;

const SCAN_MSG = `Busca en CoinGecko (coingecko.com/en/coins/trending) y CoinMarketCap los tokens con mayor actividad anómala AHORA MISMO. Identifica TOP 5 con mayor probabilidad de pump o dump próximo. Para cada uno incluye: nombre, precio actual, cambio 24H, vol/mcap estimado, señal y por qué. Termina con resumen del mercado general.${FORMAT}`;

const PUMP_MSG = `Busca en CoinGecko top gainers de hoy. ¿Qué cryptos tienen señales de PUMP más fuertes AHORA? Analiza las top 3 con mayor volumen anómalo y momentum alcista real.${FORMAT}`;

const DUMP_MSG = `Busca en CoinGecko top losers de hoy y monedas con caídas bruscas. ¿Qué cryptos están en mayor riesgo de DUMP o ya están en dump ahora mismo? Analiza las 3 más peligrosas.${FORMAT}`;

const MEME_MSG = `Busca datos actuales de memecoins: DOGE, SHIB, PEPE, BONK, FLOKI y las trending ahora. ¿Cuáles tienen señal de pump o dump inminente? Busca precios y volúmenes reales.${FORMAT}`;

const MARKET_MSG = `Busca el estado actual del mercado crypto:

- Market cap total del mercado
- Dominancia de Bitcoin y Ethereum
- Fear & Greed Index actual
- Tendencia general: alcista, bajista o lateral
- Las 3 noticias más importantes del día que afectan al mercado
  Resumen ejecutivo para trader.`;

const DEX_MSG = `Busca en DexScreener (dexscreener.com/trending) los tokens más trending ahora mismo. Lista los TOP 8 con: nombre, símbolo, chain, precio, cambio 24H, volumen. Identifica cuáles tienen señal de pump o dump según sus métricas. Luego busca también en CoinGecko trending coins.${FORMAT}`;

function coinPrompt(name) {
return `Busca datos actuales de ${name} en CoinGecko y CoinMarketCap AHORA MISMO. Obtén: precio actual, cambio 1H, 24H y 7D, market cap, volumen 24H, ATH y % desde ATH. Luego genera análisis completo de señal pump/dump con comparación a casos históricos.${FORMAT}`;
}

// ─────────────────────────────────────────────
// RADAR SCOPE
// ─────────────────────────────────────────────
function RadarScope({ size = 82 }) {
return (
<div style={{ position: “relative”, width: size, height: size, flexShrink: 0 }}>
{[1, 0.72, 0.46, 0.26].map((s, i) => (
<div key={i} style={{ position: “absolute”, top: “50%”, left: “50%”, width: size * s, height: size * s, transform: “translate(-50%,-50%)”, borderRadius: “50%”, border: `1px solid rgba(0,212,255,${0.07 + i * 0.05})`, animation: `rPulse ${2 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.25}s` }} />
))}
<div style={{ position: “absolute”, top: “50%”, left: 0, right: 0, height: 1, background: “rgba(0,212,255,0.06)”, transform: “translateY(-50%)” }} />
<div style={{ position: “absolute”, left: “50%”, top: 0, bottom: 0, width: 1, background: “rgba(0,212,255,0.06)”, transform: “translateX(-50%)” }} />
<div style={{ position: “absolute”, top: “50%”, left: “50%”, width: size / 2, height: size / 2, transformOrigin: “0 0”, animation: “rSweep 3s linear infinite”, background: “conic-gradient(from 0deg, rgba(0,212,255,0.25) 0deg, transparent 50deg)”, borderRadius: “0 100% 0 0” }} />
{[[“24%”, “64%”, “0.4s”, “#00ff88”], [“64%”, “34%”, “1.3s”, “#ff4444”], [“41%”, “26%”, “2.2s”, “#ffcc00”]].map(([t, l, d, c], i) => (
<div key={i} style={{ position: “absolute”, top: t, left: l, width: 5, height: 5, borderRadius: “50%”, background: c, boxShadow: `0 0 7px ${c}`, animation: “bPop 3s ease-in-out infinite”, animationDelay: d }} />
))}
<div style={{ position: “absolute”, top: “50%”, left: “50%”, width: 7, height: 7, borderRadius: “50%”, background: “#00d4ff”, boxShadow: “0 0 12px #00d4ff”, transform: “translate(-50%,-50%)” }} />
</div>
);
}

// ─────────────────────────────────────────────
// MESSAGE RENDERER
// ─────────────────────────────────────────────
function Msg({ m }) {
const isUser = m.role === “user”;
if (isUser) return (
<div style={{ display: “flex”, justifyContent: “flex-end”, marginBottom: 12, animation: “fadeUp .3s ease-out” }}>
<div style={{ maxWidth: “72%”, background: “linear-gradient(135deg,rgba(0,212,255,0.14),rgba(0,100,180,0.1))”, border: “1px solid rgba(0,212,255,0.3)”, borderRadius: “12px 2px 12px 12px”, padding: “10px 14px”, fontSize: 13, color: “#c8e8ff”, fontFamily: “‘Exo 2’,sans-serif” }}>{m.content}</div>
<div style={{ width: 30, height: 30, borderRadius: “50%”, background: “rgba(0,212,255,0.08)”, border: “1px solid rgba(0,212,255,0.22)”, display: “flex”, alignItems: “center”, justifyContent: “center”, fontSize: 13, flexShrink: 0, marginLeft: 7, marginTop: 2 }}>👤</div>
</div>
);

const lines = m.content.split(”\n”);
return (
<div style={{ display: “flex”, justifyContent: “flex-start”, marginBottom: 12, animation: “fadeUp .3s ease-out” }}>
<div style={{ width: 30, height: 30, borderRadius: “50%”, background: “linear-gradient(135deg,#001e2e,#003050)”, border: “1px solid rgba(0,212,255,0.4)”, display: “flex”, alignItems: “center”, justifyContent: “center”, fontFamily: “‘Orbitron’,monospace”, fontSize: 7, fontWeight: 700, color: “#00d4ff”, flexShrink: 0, marginRight: 7, marginTop: 2, boxShadow: “0 0 10px rgba(0,212,255,0.15)” }}>G7</div>
<div style={{ maxWidth: “88%”, background: “linear-gradient(180deg,rgba(0,15,25,0.93),rgba(0,8,18,0.97))”, border: “1px solid rgba(0,212,255,0.11)”, borderRadius: “2px 12px 12px 12px”, padding: “13px 15px”, lineHeight: 1.65 }}>
{lines.map((line, i) => {
if (!line.trim()) return <div key={i} style={{ height: 4 }} />;
if (line.includes(“RADAR G-7 —”) || line.includes(“🛰️ RADAR”))
return <div key={i} style={{ fontFamily: “‘Orbitron’,monospace”, fontSize: 11, fontWeight: 700, color: “#00d4ff”, letterSpacing: 1.5, margin: “4px 0 2px”, textShadow: “0 0 8px #00d4ff44” }}>{line}</div>;
if (line.startsWith(“━━━━”))
return <div key={i} style={{ height: 1, background: “linear-gradient(90deg,transparent,rgba(0,212,255,0.28),transparent)”, margin: “9px 0” }} />;
if (line.startsWith(“━━━”))
return <div key={i} style={{ fontFamily: “‘Share Tech Mono’,monospace”, fontSize: 9, color: “#4a8fa8”, letterSpacing: 1.5, margin: “9px 0 4px”, borderLeft: “2px solid rgba(0,212,255,0.35)”, paddingLeft: 7 }}>{line}</div>;
if (line.includes(“PUMP INMINENTE”))
return <div key={i} style={{ display: “inline-block”, background: “rgba(0,255,136,0.12)”, border: “1px solid rgba(0,255,136,0.55)”, color: “#00ff88”, padding: “3px 12px”, fontFamily: “‘Orbitron’,monospace”, fontSize: 10, fontWeight: 700, margin: “4px 0”, animation: “sPulse 2s infinite”, borderRadius: 2 }}>{line}</div>;
if (line.includes(“DUMP INMINENTE”))
return <div key={i} style={{ display: “inline-block”, background: “rgba(255,51,51,0.12)”, border: “1px solid rgba(255,51,51,0.55)”, color: “#ff4444”, padding: “3px 12px”, fontFamily: “‘Orbitron’,monospace”, fontSize: 10, fontWeight: 700, margin: “4px 0”, animation: “sPulse 2s infinite”, borderRadius: 2 }}>{line}</div>;
if (line.includes(“ALERTA ALTA”))
return <div key={i} style={{ display: “inline-block”, background: “rgba(255,204,0,0.1)”, border: “1px solid rgba(255,204,0,0.55)”, color: “#ffcc00”, padding: “3px 12px”, fontFamily: “‘Orbitron’,monospace”, fontSize: 10, fontWeight: 700, margin: “4px 0”, borderRadius: 2 }}>{line}</div>;
if (line.includes(“VIGILANCIA”))
return <div key={i} style={{ display: “inline-block”, background: “rgba(68,170,255,0.08)”, border: “1px solid rgba(68,170,255,0.45)”, color: “#44aaff”, padding: “3px 12px”, fontFamily: “‘Orbitron’,monospace”, fontSize: 10, fontWeight: 700, margin: “4px 0”, borderRadius: 2 }}>{line}</div>;
if (line.includes(“CONVICCIÓN”))
return <div key={i} style={{ fontFamily: “‘Orbitron’,monospace”, fontSize: 12, fontWeight: 700, color: “#ffcc00”, margin: “7px 0”, textShadow: “0 0 8px #ffcc0044” }}>{line}</div>;
if (line.startsWith(“🔺”)) return <div key={i} style={{ color: “#00ff88”, fontSize: 12, margin: “2px 0”, fontWeight: 600 }}>{line}</div>;
if (line.startsWith(“🔻”)) return <div key={i} style={{ color: “#ff5555”, fontSize: 12, margin: “2px 0”, fontWeight: 600 }}>{line}</div>;
if (line.trim().startsWith(“→”)) return <div key={i} style={{ color: “#8ab8cc”, fontSize: 12, paddingLeft: 11, margin: “2px 0”, borderLeft: “1px solid rgba(0,212,255,0.2)” }}>{line}</div>;
if (line.startsWith(“📁”)) return <div key={i} style={{ background: “rgba(0,212,255,0.04)”, border: “1px solid rgba(0,212,255,0.12)”, padding: “4px 9px”, margin: “3px 0”, fontSize: 12, color: “#a8d8e8”, borderRadius: 2 }}>{line}</div>;
if (line.startsWith(“⚠️”)) return <div key={i} style={{ color: “#336677”, fontSize: 10, marginTop: 8, fontFamily: “‘Share Tech Mono’,monospace” }}>{line}</div>;
if (line.startsWith(“◈”)) return <div key={i} style={{ fontFamily: “‘Share Tech Mono’,monospace”, fontSize: 11, color: “#88ccdd”, margin: “3px 0” }}>{line}</div>;
return <div key={i} style={{ fontSize: 13, color: “#b8d8e8”, margin: “1px 0” }}>{line}</div>;
})}
</div>
</div>
);
}

// ─────────────────────────────────────────────
// LOADING
// ─────────────────────────────────────────────
function Loading({ label }) {
const steps = [“Conectando con CoinGecko…”, “Buscando en CoinMarketCap…”, “Analizando DexScreener…”, “Calculando señales…”, “Comparando patrones históricos…”, “Generando predicción…”];
const [s, setS] = useState(0);
useEffect(() => { const t = setInterval(() => setS(x => (x + 1) % steps.length), 900); return () => clearInterval(t); }, []);
return (
<div style={{ display: “flex”, justifyContent: “flex-start”, marginBottom: 12 }}>
<div style={{ width: 30, height: 30, borderRadius: “50%”, background: “linear-gradient(135deg,#001e2e,#003050)”, border: “1px solid rgba(0,212,255,0.4)”, display: “flex”, alignItems: “center”, justifyContent: “center”, fontFamily: “‘Orbitron’,monospace”, fontSize: 7, color: “#00d4ff”, flexShrink: 0, marginRight: 7 }}>G7</div>
<div style={{ background: “linear-gradient(180deg,rgba(0,15,25,0.93),rgba(0,8,18,0.97))”, border: “1px solid rgba(0,212,255,0.11)”, borderRadius: “2px 12px 12px 12px”, padding: “12px 16px”, display: “flex”, alignItems: “center”, gap: 12 }}>
<div style={{ width: 26, height: 26, borderRadius: “50%”, border: “2px solid rgba(0,212,255,0.15)”, borderTop: “2px solid #00d4ff”, animation: “spin .8s linear infinite”, flexShrink: 0 }} />
<div>
<div style={{ fontFamily: “‘Share Tech Mono’,monospace”, fontSize: 10, color: “#00d4ff”, letterSpacing: 2 }}>{label || “ESCANEANDO…”}</div>
<div style={{ fontFamily: “‘Share Tech Mono’,monospace”, fontSize: 9, color: “#2a5a70”, marginTop: 3, animation: “fadeUp .3s” }}>{steps[s]}</div>
</div>
</div>
</div>
);
}

// ─────────────────────────────────────────────
// QUICK BUTTON
// ─────────────────────────────────────────────
function QBtn({ icon, label, color, onClick, disabled }) {
const [hover, setHover] = useState(false);
return (
<button
onClick={onClick}
disabled={disabled}
onMouseEnter={() => setHover(true)}
onMouseLeave={() => setHover(false)}
style={{
background: hover && !disabled ? “rgba(0,212,255,0.1)” : “rgba(0,212,255,0.04)”,
border: `1px solid ${hover && !disabled ? (color || "rgba(0,212,255,0.45)") : "rgba(0,212,255,0.14)"}`,
color: hover && !disabled ? (color || “#00d4ff”) : “#4a8fa8”,
fontFamily: “‘Exo 2’,sans-serif”, fontSize: 11, padding: “7px 13px”,
cursor: disabled ? “not-allowed” : “pointer”,
display: “flex”, alignItems: “center”, gap: 5,
opacity: disabled ? 0.45 : 1, transition: “all .2s”,
}}>
<span>{icon}</span>{label}
</button>
);
}

// ─────────────────────────────────────────────
// SEARCH INPUT
// ─────────────────────────────────────────────
function SearchBar({ onSearch, disabled }) {
const [val, setVal] = useState(””);
const submit = (e) => { e.preventDefault(); if (val.trim() && !disabled) { onSearch(val.trim()); setVal(””); } };
const quick = [“Bitcoin”, “Ethereum”, “Solana”, “PEPE”, “DOGE”, “BNB”, “XRP”, “AVAX”, “ARB”, “BONK”, “SUI”, “LINK”];
return (
<div style={{ padding: “10px 14px”, background: “rgba(0,6,18,0.96)”, borderBottom: “1px solid rgba(0,212,255,0.1)” }}>
<form onSubmit={submit} style={{ display: “flex”, gap: 8 }}>
<div style={{ flex: 1, background: “rgba(0,18,34,0.9)”, border: “1px solid rgba(0,212,255,0.25)”, display: “flex”, alignItems: “center”, gap: 8, padding: “0 12px” }}>
<span style={{ color: “#00d4ff”, fontSize: 14 }}>🔍</span>
<input
value={val}
onChange={e => setVal(e.target.value)}
placeholder=“Busca cualquier crypto: Bitcoin, PEPE, Solana, token address…”
disabled={disabled}
style={{ flex: 1, background: “transparent”, border: “none”, color: “#c8e8ff”, fontFamily: “‘Exo 2’,sans-serif”, fontSize: 13, padding: “9px 0” }}
/>
</div>
<button
type=“submit”
disabled={disabled || !val.trim()}
style={{
background: !disabled && val.trim() ? “linear-gradient(135deg,rgba(0,212,255,0.2),rgba(0,150,200,0.15))” : “rgba(0,212,255,0.03)”,
border: `1px solid ${!disabled && val.trim() ? "rgba(0,212,255,0.55)" : "rgba(0,212,255,0.1)"}`,
color: !disabled && val.trim() ? “#00d4ff” : “#1a4060”,
fontFamily: “‘Orbitron’,monospace”, fontSize: 10, fontWeight: 700,
padding: “0 18px”, height: 44, cursor: “pointer”, letterSpacing: 2, whiteSpace: “nowrap”,
}}>
ANALIZAR
</button>
</form>
<div style={{ display: “flex”, gap: 5, marginTop: 8, flexWrap: “wrap” }}>
<span style={{ fontFamily: “‘Share Tech Mono’,monospace”, fontSize: 8, color: “#1a4050”, alignSelf: “center” }}>RÁPIDO:</span>
{quick.map(s => (
<button key={s} onClick={() => !disabled && onSearch(s)} disabled={disabled} style={{ background: “rgba(0,212,255,0.03)”, border: “1px solid rgba(0,212,255,0.13)”, color: “#3a7090”, fontFamily: “‘Share Tech Mono’,monospace”, fontSize: 9, padding: “2px 8px”, cursor: disabled ? “not-allowed” : “pointer”, transition: “all .15s” }}
onMouseEnter={e => { if (!disabled) { e.target.style.color = “#00d4ff”; e.target.style.borderColor = “rgba(0,212,255,0.4)”; } }}
onMouseLeave={e => { e.target.style.color = “#3a7090”; e.target.style.borderColor = “rgba(0,212,255,0.13)”; }}>
{s}
</button>
))}
</div>
</div>
);
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function RadarG7() {
const [msgs, setMsgs] = useState([{
role: “assistant”,
content: `🛰️ RADAR G-7 — SISTEMA ACTIVO\n\nSistema operacional con datos en tiempo real.\n◈ CoinGecko + CoinMarketCap + DexScreener vía Web Search\n◈ Base histórica: RAVE DAO · Momentum MMT · Luna Terra\n\n━━━ USA EL BUSCADOR ━━━\n→ Escribe cualquier crypto arriba y presiona ANALIZAR\n→ O usa los botones de escaneo rápido\n→ El sistema busca datos reales antes de cada análisis\n\n¿Qué quieres analizar?`,
}]);
const [loading, setLoading] = useState(false);
const [loadLabel, setLoadLabel] = useState(””);
const [input, setInput] = useState(””);
const [tab, setTab] = useState(“scanner”);
const bottomRef = useRef(null);
const inputRef = useRef(null);

useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: “smooth” }); }, [msgs, loading]);

const send = useCallback(async (prompt, display, label) => {
if (loading) return;
setLoading(true);
setLoadLabel(label || “ANALIZANDO…”);
const show = display || prompt.slice(0, 60) + “…”;
const newMsgs = […msgs, { role: “user”, content: show }];
setMsgs(newMsgs);
try {
const reply = await ask(prompt);
setMsgs([…newMsgs, { role: “assistant”, content: reply }]);
} catch (e) {
setMsgs([…newMsgs, { role: “assistant”, content: `⚠️ ERROR: ${e.message}\n\nIntenta de nuevo en unos segundos.` }]);
} finally {
setLoading(false);
setLoadLabel(””);
setTimeout(() => inputRef.current?.focus(), 100);
}
}, [msgs, loading]);

const handleSearch = (coin) => send(coinPrompt(coin), `Analizar: ${coin}`, `BUSCANDO ${coin.toUpperCase()}...`);
const handleChat = () => { if (!input.trim() || loading) return; const q = input.trim(); setInput(””); send(`Analiza esto: ${q}. Usa web_search para datos reales. ${FORMAT}`, q, “ANALIZANDO…”); };

// Scanner buttons config
const SCANNERS = [
{ icon: “📡”, label: “Escanear mercado AHORA”, color: “#00d4ff”, prompt: SCAN_MSG, display: “📡 Escanear mercado ahora”, lbl: “ESCANEANDO MERCADO…” },
{ icon: “🟢”, label: “Top PUMPS hoy”, color: “#00ff88”, prompt: PUMP_MSG, display: “🟢 Top pumps hoy”, lbl: “BUSCANDO PUMPS…” },
{ icon: “🔴”, label: “Riesgo DUMP hoy”, color: “#ff4444”, prompt: DUMP_MSG, display: “🔴 Riesgo dump hoy”, lbl: “BUSCANDO DUMPS…” },
{ icon: “🔥”, label: “Memecoins calientes”, color: “#ff8800”, prompt: MEME_MSG, display: “🔥 Memecoins calientes”, lbl: “ESCANEANDO MEMECOINS…” },
{ icon: “📊”, label: “DexScreener trending”, color: “#aa88ff”, prompt: DEX_MSG, display: “📊 DexScreener trending”, lbl: “ESCANEANDO DEXSCREENER…” },
{ icon: “🌐”, label: “Estado del mercado”, color: “#ffcc00”, prompt: MARKET_MSG, display: “🌐 Estado del mercado”, lbl: “ANALIZANDO MERCADO…” },
{ icon: “₿”, label: “Bitcoin ahora”, color: “#f7931a”, prompt: coinPrompt(“Bitcoin”), display: “₿ Análisis Bitcoin”, lbl: “ANALIZANDO BTC…” },
{ icon: “Ξ”, label: “Ethereum ahora”, color: “#627eea”, prompt: coinPrompt(“Ethereum”), display: “Ξ Análisis Ethereum”, lbl: “ANALIZANDO ETH…” },
{ icon: “◎”, label: “Solana ahora”, color: “#9945ff”, prompt: coinPrompt(“Solana”), display: “◎ Análisis Solana”, lbl: “ANALIZANDO SOL…” },
{ icon: “🐸”, label: “PEPE ahora”, color: “#00cc44”, prompt: coinPrompt(“PEPE memecoin”), display: “🐸 Análisis PEPE”, lbl: “ANALIZANDO PEPE…” },
];

return (
<div style={{ minHeight: “100vh”, background: “#020b14”, color: “#c8e8ff”, fontFamily: “‘Exo 2’,sans-serif”, display: “flex”, flexDirection: “column”, overflow: “hidden” }}>
<style>{`@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600;700&display=swap'); *{box-sizing:border-box;margin:0;padding:0;} ::-webkit-scrollbar{width:3px;} ::-webkit-scrollbar-track{background:#010810;} ::-webkit-scrollbar-thumb{background:rgba(0,212,255,0.18);} input,textarea{outline:none;} input::placeholder,textarea::placeholder{color:#1a4060;} @keyframes rSweep{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes rPulse{0%,100%{opacity:.5}50%{opacity:.12}} @keyframes bPop{0%{opacity:0;transform:scale(0)}30%{opacity:1;transform:scale(1.5)}70%{opacity:.8;transform:scale(1)}100%{opacity:.25;transform:scale(.8)}} @keyframes hGlow{0%,100%{text-shadow:0 0 18px #00d4ffaa,0 0 35px #00d4ff22}50%{text-shadow:0 0 28px #00d4ffcc,0 0 55px #00d4ff44}} @keyframes sBlink{0%,100%{opacity:1}50%{opacity:.2}} @keyframes sPulse{0%,100%{box-shadow:0 0 5px currentColor}50%{box-shadow:0 0 18px currentColor,0 0 35px currentColor}} @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} @keyframes gridF{0%,100%{opacity:.03}50%{opacity:.055}}`}</style>

```
  {/* Grid BG */}
  <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(0,212,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.04) 1px,transparent 1px)", backgroundSize: "40px 40px", animation: "gridF 4s ease-in-out infinite", pointerEvents: "none", zIndex: 0 }} />
  {[[0, 0, 1, 0, 1, 0], [0, 0, 0, 1, 1, 0], [0, 0, 1, 0, 0, 1], [0, 0, 0, 1, 0, 1]].map(([t, b, l, r, bT, bL], i) => (
    <div key={i} style={{ position: "fixed", width: 18, height: 18, zIndex: 200, pointerEvents: "none", ...(i === 0 ? { top: 0, left: 0, borderTop: "2px solid rgba(0,212,255,0.2)", borderLeft: "2px solid rgba(0,212,255,0.2)" } : i === 1 ? { top: 0, right: 0, borderTop: "2px solid rgba(0,212,255,0.2)", borderRight: "2px solid rgba(0,212,255,0.2)" } : i === 2 ? { bottom: 0, left: 0, borderBottom: "2px solid rgba(0,212,255,0.2)", borderLeft: "2px solid rgba(0,212,255,0.2)" } : { bottom: 0, right: 0, borderBottom: "2px solid rgba(0,212,255,0.2)", borderRight: "2px solid rgba(0,212,255,0.2)" }) }} />
  ))}

  {/* HEADER */}
  <div style={{ position: "relative", zIndex: 20, background: "linear-gradient(180deg,#030f1c,rgba(2,11,20,0.97))", borderBottom: "1px solid rgba(0,212,255,0.12)", padding: "10px 15px", display: "flex", alignItems: "center", gap: 12, backdropFilter: "blur(8px)", flexShrink: 0 }}>
    <RadarScope size={80} />
    <div style={{ flex: 1 }}>
      <div style={{ fontFamily: "'Orbitron',monospace", fontWeight: 900, fontSize: 20, letterSpacing: 4, color: "#00d4ff", animation: "hGlow 3s ease-in-out infinite" }}>RADAR G-7</div>
      <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#2a6080", letterSpacing: 2, marginTop: 3 }}>CRYPTO INTELLIGENCE · PREDICTIVE ANALYTICS · REAL-TIME</div>
      <div style={{ display: "flex", gap: 4, marginTop: 6, flexWrap: "wrap" }}>
        {[
          ["● EN VIVO", "#00ff88", "rgba(0,255,136,0.22)", true],
          ["◈ COINGECKO", "#00d4ff", "rgba(0,212,255,0.18)", false],
          ["◈ CMC", "#00d4ff", "rgba(0,212,255,0.18)", false],
          ["◈ DEXSCREENER", "#ff8800", "rgba(255,136,0,0.22)", false],
          ["⚡ WEB SEARCH", "#aa88ff", "rgba(170,136,255,0.2)", false],
        ].map(([l, c, b, blink], i) => (
          <div key={i} style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, padding: "2px 7px", background: "rgba(0,0,0,0.3)", border: `1px solid ${b}`, color: c, letterSpacing: 1, animation: blink ? "sBlink 1.8s ease-in-out infinite" : "none" }}>{l}</div>
        ))}
      </div>
    </div>
  </div>

  {/* TABS */}
  <div style={{ display: "flex", background: "rgba(0,4,10,0.95)", borderBottom: "1px solid rgba(0,212,255,0.1)", zIndex: 10, position: "relative", flexShrink: 0 }}>
    {[["scanner", "📡 SCANNER"], ["chat", "🛰 ANÁLISIS IA"]].map(([id, l]) => (
      <button key={id} onClick={() => setTab(id)} style={{ flex: 1, padding: "11px 0", background: tab === id ? "rgba(0,212,255,0.08)" : "transparent", border: "none", borderBottom: tab === id ? "2px solid #00d4ff" : "2px solid transparent", color: tab === id ? "#00d4ff" : "#2a5a70", fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 2, cursor: "pointer", transition: "all .2s" }}>{l}</button>
    ))}
  </div>

  {/* ── SCANNER TAB ── */}
  {tab === "scanner" && (
    <div style={{ flex: 1, overflow: "auto", position: "relative", zIndex: 5 }}>
      <SearchBar onSearch={handleSearch} disabled={loading} />
      <div style={{ padding: "14px 14px 10px" }}>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#3a7090", letterSpacing: 2, marginBottom: 10 }}>◈ ESCANEOS AUTOMÁTICOS — HAZ CLIC PARA ANALIZAR EN TIEMPO REAL</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {SCANNERS.map((s, i) => (
            <button key={i} onClick={() => send(s.prompt, s.display, s.lbl)} disabled={loading}
              style={{ background: "rgba(0,10,22,0.8)", border: "1px solid rgba(0,212,255,0.14)", padding: "12px 14px", cursor: loading ? "not-allowed" : "pointer", textAlign: "left", transition: "all .2s", opacity: loading ? 0.5 : 1, display: "flex", alignItems: "center", gap: 10 }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "rgba(0,212,255,0.07)"; }}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(0,10,22,0.8)"}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{s.icon}</span>
              <div>
                <div style={{ fontFamily: "'Exo 2',sans-serif", fontSize: 12, fontWeight: 600, color: s.color }}>{s.label}</div>
                <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#2a5a70", marginTop: 2, letterSpacing: 0.5 }}>CLICK → ANÁLISIS IA EN TIEMPO REAL</div>
              </div>
            </button>
          ))}
        </div>
      </div>
      {/* Last results preview if any in messages */}
      {msgs.length > 1 && (
        <div style={{ padding: "0 14px 16px" }}>
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#3a7090", letterSpacing: 2, marginBottom: 8 }}>◈ ÚLTIMO ANÁLISIS</div>
          <div style={{ background: "rgba(0,10,20,0.8)", border: "1px solid rgba(0,212,255,0.1)", padding: "12px 14px", cursor: "pointer", fontSize: 12, color: "#7ab8cc", fontFamily: "'Exo 2',sans-serif" }}
            onClick={() => setTab("chat")}>
            {msgs[msgs.length - 1]?.content?.slice(0, 200)}...
            <div style={{ marginTop: 8, fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: "#00d4ff" }}>→ VER ANÁLISIS COMPLETO EN ANÁLISIS IA</div>
          </div>
        </div>
      )}
    </div>
  )}

  {/* ── ANÁLISIS IA TAB ── */}
  {tab === "chat" && (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative", zIndex: 5 }}>
      <SearchBar onSearch={handleSearch} disabled={loading} />
      {/* Quick action buttons */}
      <div style={{ padding: "8px 12px", background: "rgba(0,4,10,0.8)", borderBottom: "1px solid rgba(0,212,255,0.07)", display: "flex", gap: 5, flexWrap: "wrap", flexShrink: 0 }}>
        {SCANNERS.slice(0, 6).map((s, i) => (
          <QBtn key={i} icon={s.icon} label={s.label.split(" ").slice(0, 2).join(" ")} color={s.color} disabled={loading} onClick={() => send(s.prompt, s.display, s.lbl)} />
        ))}
      </div>
      {/* Messages */}
      <div style={{ flex: 1, overflow: "auto", padding: "14px 12px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          {msgs.map((m, i) => <Msg key={i} m={m} />)}
          {loading && <Loading label={loadLabel} />}
          <div ref={bottomRef} />
        </div>
      </div>
      {/* Chat input */}
      <div style={{ background: "linear-gradient(0deg,#010810,rgba(1,8,16,0.97))", borderTop: "1px solid rgba(0,212,255,0.12)", padding: "10px 12px", flexShrink: 0 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", gap: 8, alignItems: "flex-end" }}>
          <div style={{ flex: 1, background: "rgba(0,18,34,0.9)", border: "1px solid rgba(0,212,255,0.2)" }}>
            <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: "#1a4a60", letterSpacing: 2, padding: "4px 10px 0" }}>◈ PREGUNTA LIBRE</div>
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
              placeholder="Escribe cualquier pregunta: ¿Qué va a pumpear esta semana? / Compara BTC y ETH / Señales de dump en altcoins..."
              rows={2}
              disabled={loading}
              style={{ background: "transparent", border: "none", color: "#c8e8ff", fontFamily: "'Exo 2',sans-serif", fontSize: 13, padding: "6px 10px 8px", width: "100%", opacity: loading ? 0.5 : 1, resize: "none" }}
            />
          </div>
          <button
            onClick={handleChat}
            disabled={loading || !input.trim()}
            style={{ background: !loading && input.trim() ? "linear-gradient(135deg,rgba(0,212,255,0.18),rgba(0,150,200,0.12))" : "rgba(0,212,255,0.03)", border: `1px solid ${!loading && input.trim() ? "rgba(0,212,255,0.45)" : "rgba(0,212,255,0.08)"}`, color: !loading && input.trim() ? "#00d4ff" : "#1a4a60", fontFamily: "'Orbitron',monospace", fontSize: 9, fontWeight: 700, padding: "0 14px", height: 60, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, minWidth: 64, flexShrink: 0 }}>
            <span style={{ fontSize: 16 }}>🛰️</span>
            <span style={{ letterSpacing: 1 }}>SCAN</span>
          </button>
        </div>
        <div style={{ maxWidth: 900, margin: "5px auto 0", fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: "#1a3050", textAlign: "right" }}>
          ENTER enviar · SHIFT+ENTER nueva línea · RADAR G-7 · CoinGecko · CMC · DexScreener
        </div>
      </div>
    </div>
  )}
</div>
```

);
}
