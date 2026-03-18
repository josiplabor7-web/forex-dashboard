import React, { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// FOREX MACRO INTELLIGENCE v5.0
// AUTO-REFRESH: CB kamatne stope + geopolitika pri svakom otvaranju
// ═══════════════════════════════════════════════════════════════

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"];

const MACRO_CONTEXT = {
  USD: {
    rate: 3.625, inflation: 2.4, core_inflation: 2.5, gdp: 2.8,
    trend: "on hold", cb_tone: "neutral", central_bank: "Fed", next_meeting: "18. ožujka",
    labor: { nfp: -92, nfp_prev: 126, adp: 63, unemployment: 4.4, u6: 7.9, wage_growth: 3.8, participation: 62.0, trend: "deteriorating", notes: "ŠOKANTNO: -92K Feb. UR na 4.4%, Fed rez pomaknut na srpanj. Participacija 62% — najniže od XII 2021." },
    pmi: { manufacturing: 52.4, services: 56.1, composite: 51.6, prices_index: 70.5, new_orders: 55.8, employment_pmi: 48.8, trend: "mixed", notes: "ISM Services na max od 2022. Prices index 70.5 = inflacijski pritisak dolazi!" },
    cycle: "peak_slowdown", cycle_note: "US na prekretnici: Services jaki, ali labor market se lomi. NFP -92K + UR 4.4% = Fed paraliziran."
  },
  EUR: {
    rate: 2.0, inflation: 2.2, core_inflation: 2.3, gdp: 0.4,
    trend: "on hold", cb_tone: "neutral", central_bank: "ECB", next_meeting: "19. ožujka",
    labor: { nfp: null, adp: null, unemployment: 6.1, u6: null, wage_growth: 4.1, participation: null, trend: "stable_improving", notes: "EUR labor market na rekordnom minimumu (6.1%)." },
    pmi: { manufacturing: 47.6, services: 50.6, composite: 50.2, prices_index: 58.0, new_orders: 48.5, employment_pmi: 49.9, trend: "weak_recovery", notes: "Eurozona jedva u ekspanziji. Njemačka vuče dolje." },
    cycle: "recovery_fragile", cycle_note: "EUR: slab oporavak osjetljiv na vanjske šokove. Iran = najveći downside rizik."
  },
  GBP: {
    rate: 3.75, inflation: 3.0, core_inflation: 3.2, gdp: 0.1,
    trend: "easing", cb_tone: "dovish", central_bank: "BoE", next_meeting: "19. ožujka",
    labor: { nfp: null, adp: null, unemployment: 4.4, u6: null, wage_growth: 5.9, participation: 62.5, trend: "deteriorating", notes: "UK tržište rada slabi, plaće 5.9% YoY — stagflacijska klopka za BoE." },
    pmi: { manufacturing: 46.9, services: 53.8, composite: 53.1, prices_index: 62.0, new_orders: 54.2, employment_pmi: 47.5, trend: "services_led_growth", notes: "UK paradoks: Composite PMI na 22-mj. visini, ali zapošljavanje pada. Stagflacija." },
    cycle: "stagflation", cycle_note: "GBP u klasičnoj stagflaciji. BoE u nemogućoj poziciji."
  },
  JPY: {
    rate: 0.75, inflation: 2.2, core_inflation: 2.0, gdp: 0.4,
    trend: "hawkish", cb_tone: "hawkish", central_bank: "BoJ", next_meeting: "Kraj ožujka",
    labor: { nfp: null, adp: null, unemployment: 2.6, u6: null, wage_growth: 3.1, participation: 63.8, trend: "tight_labor_market", notes: "Japan: UR 2.6% = puna zaposlenost. Plaće rastu — BoJ uvjet za hike ispunjen." },
    pmi: { manufacturing: 49.0, services: 53.7, composite: 52.8, prices_index: 55.0, new_orders: 52.5, employment_pmi: 51.8, trend: "strong_expansion", notes: "Japan na 33-mj. PMI visokoj! Carry trade unwind ubrzava." },
    cycle: "early_expansion", cycle_note: "JPY: Japan izlazi iz deflacije. BoJ se normalizira. Carry trade unwind = JPY jača."
  },
  CHF: {
    rate: 0.0, inflation: 0.4, core_inflation: 0.6, gdp: 0.8,
    trend: "on hold", cb_tone: "neutral", central_bank: "SNB", next_meeting: "26. ožujka",
    labor: { nfp: null, adp: null, unemployment: 2.8, u6: null, wage_growth: 1.2, participation: 68.5, trend: "stable", notes: "Švicarska: stabilno tržište rada, minimalna inflacija." },
    pmi: { manufacturing: 48.5, services: 51.5, composite: 50.8, prices_index: 45.0, new_orders: 49.5, employment_pmi: 50.2, trend: "neutral", notes: "CHF = safe haven play, ne fundamentalni play." },
    cycle: "neutral_haven", cycle_note: "CHF: jedini razlog za kupnju je geopolitika — safe haven tražnja."
  },
  AUD: {
    rate: 4.1, inflation: 3.2, core_inflation: 3.1, gdp: 1.5,
    trend: "uncertain", cb_tone: "hawkish", central_bank: "RBA", next_meeting: "Travanj",
    labor: { nfp: null, adp: null, unemployment: 4.0, u6: null, wage_growth: 3.3, participation: 67.1, trend: "stable", notes: "Australia tržište rada solidno (UR 4%). RBA hikao u veljači 2026." },
    pmi: { manufacturing: 50.5, services: 52.8, composite: 52.1, prices_index: 60.0, new_orders: 53.0, employment_pmi: 51.5, trend: "mild_expansion", notes: "Australia PMI ubrzava. Iran = uvozni inflacijski šok. Kina = downside rizik." },
    cycle: "late_expansion", cycle_note: "AUD: kasna ekspanzija s inflacijskim problemom. Kina = glavni rizik."
  },
  CAD: {
    rate: 2.25, inflation: 2.2, core_inflation: 2.1, gdp: 1.1,
    trend: "on hold", cb_tone: "neutral", central_bank: "BoC", next_meeting: "Travanj",
    labor: { nfp: null, adp: null, unemployment: 6.5, u6: null, wage_growth: 3.8, participation: 65.0, trend: "improving", notes: "Canada UR pala na 6.5%. USMCA tarife prijete. Iran = nafta gore = CAD bullish." },
    pmi: { manufacturing: 52.8, services: 51.5, composite: 52.2, prices_index: 58.0, new_orders: 54.0, employment_pmi: 50.8, trend: "improving", notes: "Canada Mfg PMI na 13-mj. visokoj! Iran = bullish CAD." },
    cycle: "mid_expansion", cycle_note: "CAD: PMI raste, nafta gore, ali USMCA tarife = structural downside."
  },
  NZD: {
    rate: 2.25, inflation: 2.8, core_inflation: 2.6, gdp: 0.6,
    trend: "on hold", cb_tone: "neutral", central_bank: "RBNZ", next_meeting: "Travanj",
    labor: { nfp: null, adp: null, unemployment: 5.1, u6: null, wage_growth: 3.2, participation: 71.5, trend: "deteriorating", notes: "NZ tržište rada slabi: UR 5.1% raste." },
    pmi: { manufacturing: 48.5, services: 49.8, composite: 49.2, prices_index: 55.0, new_orders: 48.0, employment_pmi: 48.2, trend: "contraction", notes: "NZD: PMI Composite u kontrakciji! Kina slabost = direktan udar." },
    cycle: "slowdown", cycle_note: "NZD: usporavanje prema kontrakciji. Jedan od najslabijih fundamentalnih profila."
  },
};

const BASE_GEOPOLITICAL_EVENTS = [
  { event: "US-Izrael napad na Iran — nafta $100+, inflacijski šok", bull: ["CAD", "USD"], bear: ["EUR", "NZD", "AUD", "GBP"], severity: "critical", weight: 20 },
  { event: "Iran: Fed rez pomaknut na srpanj", bull: ["USD"], bear: ["EUR", "GBP", "NZD"], severity: "high", weight: 15 },
  { event: "Trump tarife 10.5% + USMCA review", bull: ["USD"], bear: ["CAD", "EUR"], severity: "high", weight: 12 },
  { event: "Fed neovisnost pod pritiskom", bull: [], bear: ["USD"], severity: "medium", weight: 10 },
  { event: "BoJ hiking cycle — carry trade unwind", bull: ["JPY"], bear: ["AUD", "NZD"], severity: "medium", weight: 10 },
  { event: "ECB i BoE hike bets rastu zbog energije", bull: ["EUR", "GBP"], bear: [], severity: "medium", weight: 8 },
  { event: "Kina PMI ispod očekivanja", bull: [], bear: ["AUD", "NZD"], severity: "medium", weight: 8 },
];

const CYCLE_CONFIG = {
  "expansion": { label: "EKSPANZIJA", color: "#00e87a", icon: "▲" },
  "early_expansion": { label: "RANA EKSPANZIJA", color: "#00cc66", icon: "▲▲" },
  "late_expansion": { label: "KASNA EKSPANZIJA", color: "#88cc44", icon: "▲" },
  "mid_expansion": { label: "EKSPANZIJA", color: "#00e87a", icon: "▲" },
  "peak_slowdown": { label: "VRH → USPORAVANJE", color: "#ffaa22", icon: "→↓" },
  "slowdown": { label: "USPORAVANJE", color: "#ff8844", icon: "↓" },
  "stagflation": { label: "STAGFLACIJA", color: "#ff4422", icon: "⚠" },
  "contraction": { label: "KONTRAKCIJA", color: "#cc2222", icon: "↓↓" },
  "recovery_fragile": { label: "KRHKI OPORAVAK", color: "#44aacc", icon: "↗" },
  "neutral_haven": { label: "NEUTRALNO/SAFE HAVEN", color: "#7a9ab0", icon: "→" },
};

const AUTO_REFRESH_PROMPT = `Ti si forex analitičar. Pretraži web za ZADNJE vijesti o:
1. Centralnim bankama: Fed, ECB, BoE, BoJ, RBA, BoC, RBNZ, SNB — odluke o kamatnim stopama, govori guvernera zadnjih 72h
2. Geopolitika: Iran, US tarife, ratovi, geopolitički šokovi koji utječu na forex zadnjih 72h

OBAVEZNO vrati ISKLJUČIVO JSON, bez ikakvog teksta izvan JSON-a:
{
  "cb_updates": [
    {
      "currency": "AUD",
      "new_rate": 4.35,
      "cb_tone": "hawkish",
      "note": "RBA podigao stopu na 4.35%, guverner hawkish"
    }
  ],
  "geo_events": [
    {
      "event": "kratki opis",
      "bull": ["CAD"],
      "bear": ["EUR"],
      "severity": "high",
      "weight": 12
    }
  ],
  "score_adjustments": { "USD": 3, "EUR": -2 },
  "summary": "glavna tema dana u jednoj rečenici",
  "last_updated": "datum i vrijeme"
}

cb_updates: SAMO ako je bilo STVARNIH promjena u zadnjih 72h. Ako nije bilo promjena, vrati prazni array [].
geo_events: maksimalno 5 novih događaja koji NISU već u bazi.
Ako nema novih vijesti, vrati prazne arraye.`;

const SYSTEM_PROMPT = `Ti si senior forex analitičar (20 god iskustva). Koristiš AKTUALNE live podatke.
Format (UVIJEK HRVATSKI):
1. Ekonomski ciklus (PMI + labor + ciklus)
2. CB politika implikacije
3. Geopolitički kontekst
4. KONKRETAN ZAKLJUČAK: BUY/SELL/ČEKAJ + razlog
5. Ključni rizici
Budi koncizan i direktan.`;

const NEWS_SYSTEM_PROMPT = `Ti si forex analitičar. Pretraži web za ZADNJE vijesti (24-48h).
Vrati ISKLJUČIVO JSON:
{
  "news": [{"headline": "naslov", "summary": "2-3 rečenice", "impact": "bullish", "currencies_up": ["USD"], "currencies_down": ["EUR"], "severity": "high", "score_adjustments": {"USD": 5}, "source_hint": "Reuters"}],
  "overall_sentiment": "risk_off",
  "key_theme": "glavna tema",
  "last_updated": "HH:MM"
}`;

function computeCurrencyScore(currency, liveCtx = null, geoEvents = null) {
  const base = MACRO_CONTEXT[currency];
  const m = liveCtx?.[currency] ? { ...base, ...liveCtx[currency] } : base;
  const events = geoEvents || BASE_GEOPOLITICAL_EVENTS;
  let score = 50;

  score += Math.max(-14, Math.min(18, (m.rate - 2.1) * 2.2));
  const toneMap = { "hawkish": 14, "on hold": 0, "neutral": 0, "easing": -8, "dovish": -11, "uncertain": -2 };
  score += (toneMap[m.cb_tone] || 0);

  const pmi = m.pmi;
  const compPMI = pmi.composite || (pmi.manufacturing * 0.3 + pmi.services * 0.7);
  if (compPMI > 54) score += 12; else if (compPMI > 52) score += 7; else if (compPMI > 50) score += 3; else if (compPMI > 48) score -= 5; else score -= 10;
  if (pmi.trend === "strong_expansion") score += 5; else if (pmi.trend === "services_led_growth" || pmi.trend === "mild_expansion") score += 2; else if (pmi.trend === "contraction") score -= 8; else if (pmi.trend === "weak_recovery") score -= 2;

  const lab = m.labor;
  const ur = lab.unemployment;
  if (ur < 3.5) score += 10; else if (ur < 4.5) score += 5; else if (ur < 5.5) score += 1; else if (ur < 6.5) score -= 4; else score -= 8;
  if (lab.trend === "deteriorating") score -= 6; else if (lab.trend === "tight_labor_market") score += 5; else if (lab.trend === "improving") score += 3;
  if (currency === "USD" && m.labor.nfp < 0) score -= 5;

  const cycleScore = { "early_expansion": 10, "mid_expansion": 7, "expansion": 8, "late_expansion": 4, "peak_slowdown": -3, "recovery_fragile": 2, "slowdown": -6, "stagflation": -10, "contraction": -12, "neutral_haven": 0 };
  score += (cycleScore[m.cycle] || 0);

  if (m.inflation <= 2.0) score += 3; else if (m.inflation <= 2.5) score += 1; else if (m.inflation <= 3.5) score -= 3; else score -= 8;

  events.forEach(ev => {
    const mult = ev.severity === "critical" ? 1.5 : ev.severity === "high" ? 1.0 : 0.6;
    if (ev.bull?.includes(currency)) score += ev.weight * mult * 0.45;
    if (ev.bear?.includes(currency)) score -= ev.weight * mult * 0.45;
  });

  return Math.max(8, Math.min(95, Math.round(score)));
}

function getSignal(score) {
  if (score >= 70) return { label: "JAKO BULLISH", color: "#00e87a" };
  if (score >= 58) return { label: "BULLISH", color: "#44cc77" };
  if (score >= 42) return { label: "NEUTRALNO", color: "#7a9ab0" };
  if (score >= 30) return { label: "BEARISH", color: "#e85544" };
  return { label: "JAKO BEARISH", color: "#cc2222" };
}

function getPairSignal(base, quote, scores) {
  const b = scores[base] || 50, q = scores[quote] || 50, diff = b - q;
  if (diff > 18) return { label: "STRONG BUY", color: "#00e87a", confidence: Math.min(91, 54 + diff), diff };
  if (diff > 8) return { label: "BUY", color: "#44cc77", confidence: Math.min(76, 51 + diff), diff };
  if (diff < -18) return { label: "STRONG SELL", color: "#cc2222", confidence: Math.min(91, 54 + Math.abs(diff)), diff };
  if (diff < -8) return { label: "SELL", color: "#e85544", confidence: Math.min(76, 51 + Math.abs(diff)), diff };
  return { label: "ČEKAJ", color: "#7a9ab0", confidence: 35, diff };
}

const PMI_COLOR = (v) => v > 54 ? "#00e87a" : v > 52 ? "#44cc77" : v > 50 ? "#88bb55" : v > 48 ? "#ff8844" : "#cc2222";
const UR_COLOR = (v) => v < 3.5 ? "#00e87a" : v < 4.5 ? "#44cc77" : v < 5.5 ? "#ffaa22" : v < 6.5 ? "#ff8844" : "#cc2222";

const FOREX_PAIRS = [
  { pair: "EUR/USD", base: "EUR", quote: "USD" },
  { pair: "GBP/USD", base: "GBP", quote: "USD" },
  { pair: "USD/JPY", base: "USD", quote: "JPY" },
  { pair: "USD/CHF", base: "USD", quote: "CHF" },
  { pair: "AUD/USD", base: "AUD", quote: "USD" },
  { pair: "USD/CAD", base: "USD", quote: "CAD" },
  { pair: "NZD/USD", base: "NZD", quote: "USD" },
  { pair: "GBP/JPY", base: "GBP", quote: "JPY" },
];

export default function ForexDashboard() {
  const [scores, setScores] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsLastFetch, setNewsLastFetch] = useState(null);
  const [newsAnalysis, setNewsAnalysis] = useState(null);
  const [liveContext, setLiveContext] = useState(null);
  const [liveGeoEvents, setLiveGeoEvents] = useState(BASE_GEOPOLITICAL_EVENTS);
  const [autoRefreshStatus, setAutoRefreshStatus] = useState("loading");
  const [autoRefreshSummary, setAutoRefreshSummary] = useState("");
  const [autoRefreshTime, setAutoRefreshTime] = useState("");
  const [cbUpdates, setCbUpdates] = useState([]);

  useEffect(() => { autoRefresh(); }, []);

  const autoRefresh = async () => {
    setAutoRefreshStatus("loading");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: AUTO_REFRESH_PROMPT,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: `Danas je ${new Date().toLocaleDateString('hr-HR')}. Pretraži web za zadnje CB odluke i geopolitičke vijesti u zadnjih 72h. Vrati JSON.` }],
        }),
      });
      const data = await res.json();
      const textBlock = data.content?.find(b => b.type === "text");
      if (textBlock?.text) {
        const raw = textBlock.text.replace(/```json|```/g, "").trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const newCtx = {};
          if (parsed.cb_updates?.length > 0) {
            parsed.cb_updates.forEach(u => { newCtx[u.currency] = { rate: u.new_rate || MACRO_CONTEXT[u.currency]?.rate, cb_tone: u.cb_tone || MACRO_CONTEXT[u.currency]?.cb_tone }; });
            setCbUpdates(parsed.cb_updates);
          }
          setLiveContext(Object.keys(newCtx).length > 0 ? newCtx : null);

          const newGeo = [...BASE_GEOPOLITICAL_EVENTS];
          if (parsed.geo_events?.length > 0) {
            parsed.geo_events.forEach(ev => { if (!newGeo.find(e => e.event === ev.event)) newGeo.unshift(ev); });
          }
          setLiveGeoEvents(newGeo);

          const newScores = {};
          CURRENCIES.forEach(cur => {
            const base = computeCurrencyScore(cur, newCtx, newGeo);
            newScores[cur] = Math.max(8, Math.min(95, base + (parsed.score_adjustments?.[cur] || 0)));
          });
          setScores(newScores);
          setAutoRefreshSummary(parsed.summary || "");
          setAutoRefreshTime(parsed.last_updated || new Date().toLocaleTimeString('hr-HR'));
          setAutoRefreshStatus("done");
          return;
        }
      }
      throw new Error("No valid response");
    } catch (e) {
      console.error("Auto-refresh error:", e);
      const c = {};
      CURRENCIES.forEach(cur => { c[cur] = computeCurrencyScore(cur); });
      setScores(c);
      setAutoRefreshStatus("error");
    }
  };

  const fetchLiveNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 2000, system: NEWS_SYSTEM_PROMPT,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: `Pretraži web za zadnje forex vijesti danas ${new Date().toLocaleDateString('hr-HR')}.` }],
        }),
      });
      const data = await res.json();
      const textBlock = data.content?.find(b => b.type === "text");
      if (textBlock?.text) {
        const raw = textBlock.text.replace(/```json|```/g, "").trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setNewsItems(parsed.news || []);
          setNewsAnalysis(parsed);
          setNewsLastFetch(new Date());
          const adj = {};
          (parsed.news || []).forEach(item => { if (item.score_adjustments) Object.entries(item.score_adjustments).forEach(([cur, val]) => { adj[cur] = (adj[cur] || 0) + val; }); });
          const c = {};
          CURRENCIES.forEach(cur => { const base = computeCurrencyScore(cur, liveContext, liveGeoEvents); c[cur] = Math.max(8, Math.min(95, base + (adj[cur] || 0))); });
          setScores(c);
        }
      }
    } catch (e) { console.error("News error:", e); }
    setNewsLoading(false);
  }, [liveContext, liveGeoEvents]);

  const askAI = useCallback(async (question) => {
    setAiLoading(true); setAiResponse(""); setActiveTab("ai");
    const ctx = CURRENCIES.map(c => { const m = liveContext?.[c] ? { ...MACRO_CONTEXT[c], ...liveContext[c] } : MACRO_CONTEXT[c]; return `${c}: score=${scores[c] || 50}, rate=${m.rate}%, CPI=${m.inflation}%, PMI_svc=${m.pmi.services}, UR=${m.labor.unemployment}%, cb=${m.cb_tone}, cycle=${m.cycle}`; }).join("\n");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: SYSTEM_PROMPT, messages: [{ role: "user", content: `LIVE VALUTNI PROFILI:\n${ctx}\n\nPITANJE: ${question}` }] }),
      });
      const data = await res.json();
      setAiResponse(data.content?.map(b => b.text || "").join("") || "Greška.");
    } catch { setAiResponse("Greška pri pozivu AI."); }
    setAiLoading(false);
  }, [scores, liveContext]);

  const handlePairClick = (pair) => {
    const sig = getPairSignal(pair.base, pair.quote, scores);
    askAI(`Analiziraj ${pair.pair}. Signal: ${sig.label}, diff: ${sig.diff > 0 ? "+" : ""}${sig.diff}, confidence: ${sig.confidence}%. Koristi PMI, labor market, economic cycle i live CB podatke.`);
  };

  const getLiveM = (currency) => liveContext?.[currency] ? { ...MACRO_CONTEXT[currency], ...liveContext[currency] } : MACRO_CONTEXT[currency];
  const sorted = [...CURRENCIES].sort((a, b) => (scores[b] || 50) - (scores[a] || 50));

  const statusColor = autoRefreshStatus === "loading" ? "#ffaa22" : autoRefreshStatus === "done" ? "#00e87a" : "#ff4444";

  return (
    <div style={{ minHeight: "100vh", background: "#050910", color: "#dde8f0", fontFamily: "'IBM Plex Mono', 'Courier New', monospace", overflowX: "hidden" }}>

      {/* HEADER */}
      <div style={{ background: "#07101a", borderBottom: "1px solid #0c1c2c", padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: statusColor, boxShadow: `0 0 10px ${statusColor}`, animation: "pulse 2s infinite" }} />
          <span style={{ color: "#00e87a", fontSize: "22px", letterSpacing: "3px", fontWeight: "bold" }}>FOREX MACRO INTELLIGENCE</span>
          <span style={{ color: "#5a8aaa", fontSize: "12px" }}>v5.0 · AUTO-REFRESH · LIVE CB + GEO</span>
        </div>
        <div style={{ textAlign: "right" }}>
          {autoRefreshStatus === "loading" && <div style={{ color: "#ffaa22", fontSize: "12px" }}>⟳ Učitavam live CB i geopolitičke podatke...</div>}
          {autoRefreshStatus === "done" && <div style={{ color: "#00e87a", fontSize: "12px" }}>✓ LIVE · {autoRefreshTime} {autoRefreshSummary && `· ${autoRefreshSummary}`}</div>}
          {autoRefreshStatus === "error" && <div style={{ color: "#ff8844", fontSize: "12px" }}>⚠ Offline mode — statički podaci</div>}
          <button onClick={autoRefresh} disabled={autoRefreshStatus === "loading"} style={{ marginTop: "4px", background: "none", border: "1px solid #1a3a55", borderRadius: "2px", padding: "2px 8px", color: "#5a8aaa", fontSize: "11px", fontFamily: "inherit", cursor: "pointer" }}>↻ REFRESH</button>
        </div>
      </div>

      {/* CB UPDATES BANNER */}
      {cbUpdates.length > 0 && (
        <div style={{ background: "#0a1520", borderBottom: "1px solid #00e87a22", padding: "6px 28px", display: "flex", gap: "20px", overflowX: "auto" }}>
          <span style={{ color: "#00e87a", fontSize: "12px", flexShrink: 0 }}>🔴 LIVE CB UPDATE:</span>
          {cbUpdates.map((u, i) => (
            <span key={i} style={{ color: "#a8d8f0", fontSize: "12px", flexShrink: 0 }}>
              <span style={{ color: "#00e87a", fontWeight: "bold" }}>{u.currency}</span> {u.cb_tone?.toUpperCase()} {u.new_rate ? `${u.new_rate}%` : ""} — {u.note}
            </span>
          ))}
        </div>
      )}

      {/* TICKER */}
      <div style={{ background: "#030710", borderBottom: "1px solid #09182a", padding: "8px 28px", display: "flex", gap: "28px", overflowX: "auto" }}>
        {FOREX_PAIRS.map(p => {
          const sig = getPairSignal(p.base, p.quote, scores);
          return (
            <div key={p.pair} onClick={() => handlePairClick(p)} style={{ display: "flex", gap: "10px", alignItems: "center", flexShrink: 0, cursor: "pointer" }}>
              <span style={{ color: "#5a8aaa", fontSize: "13px" }}>{p.pair}</span>
              <span style={{ color: sig.color, fontSize: "13px", fontWeight: "bold" }}>{sig.label}</span>
              <span style={{ color: "#4a7a99", fontSize: "12px" }}>{sig.confidence}%</span>
            </div>
          );
        })}
      </div>

      {/* TABS */}
      <div style={{ display: "flex", borderBottom: "1px solid #09182a", padding: "0 20px", overflowX: "auto" }}>
        {[
          { id: "overview", label: "VALUTE" },
          { id: "cycle", label: "EKONOMSKI CIKLUS" },
          { id: "labor", label: "TRŽIŠTE RADA" },
          { id: "pmi", label: "PMI" },
          { id: "news", label: newsLoading ? "⟳ LIVE NEWS" : newsItems.length > 0 ? `● LIVE NEWS (${newsItems.length})` : "LIVE NEWS" },
          { id: "pairs", label: "PAROVI" },
          { id: "ai", label: "AI ANALIZA" },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "11px 16px", color: activeTab === t.id ? "#00e87a" : "#1e3a55", fontSize: "13px", letterSpacing: "2px", borderBottom: activeTab === t.id ? "2px solid #00e87a" : "2px solid transparent", fontFamily: "inherit", flexShrink: 0 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "22px 28px" }}>

        {/* ═══ OVERVIEW ═══ */}
        {activeTab === "overview" && (
          <div>
            <div style={{ color: "#5a8aaa", fontSize: "12px", marginBottom: "16px" }}>
              SCORE: kamate 18pt + CB ton 15pt + PMI 15pt + labor 12pt + ciklus 10pt + inflacija 8pt + geopolitika 40pt
              {autoRefreshStatus === "done" && <span style={{ color: "#00e87a", marginLeft: "14px" }}>● LIVE · {autoRefreshTime}</span>}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
              {sorted.map((currency, i) => {
                const score = scores[currency] || 50;
                const signal = getSignal(score);
                const m = getLiveM(currency);
                const cyc = CYCLE_CONFIG[m.cycle] || { label: m.cycle, color: "#7a9ab0", icon: "→" };
                const isUpdated = cbUpdates.find(u => u.currency === currency);
                return (
                  <div key={currency} style={{ background: "#070d16", border: `1px solid ${isUpdated ? "#00e87a55" : i === 0 ? signal.color + "44" : "#0c1c2c"}`, borderRadius: "4px", padding: "16px" }}>
                    {isUpdated && <div style={{ background: "#00e87a15", border: "1px solid #00e87a33", borderRadius: "2px", padding: "2px 8px", marginBottom: "8px", fontSize: "11px", color: "#00e87a" }}>🔴 LIVE: {isUpdated.note}</div>}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div>
                        <div style={{ fontSize: "26px", fontWeight: "bold" }}>{currency}</div>
                        <div style={{ fontSize: "13px", color: isUpdated ? "#00e87a" : "#5a8aaa" }}>{m.central_bank} · {m.rate}% · {m.cb_tone}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "24px", fontWeight: "bold", color: signal.color }}>{score}</div>
                        <div style={{ fontSize: "12px", color: signal.color }}>{signal.label}</div>
                      </div>
                    </div>
                    <div style={{ background: "#030710", height: "3px", borderRadius: "2px", marginBottom: "8px" }}>
                      <div style={{ height: "100%", width: `${score}%`, background: `linear-gradient(90deg, ${signal.color}55, ${signal.color})`, borderRadius: "2px", transition: "width 1.2s ease" }} />
                    </div>
                    <div style={{ background: cyc.color + "15", border: `1px solid ${cyc.color}33`, borderRadius: "2px", padding: "2px 8px", marginBottom: "8px", display: "inline-block" }}>
                      <span style={{ color: cyc.color, fontSize: "12px" }}>{cyc.icon} {cyc.label}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "6px", marginBottom: "7px" }}>
                      {[
                        ["RATE", `${m.rate}%`, isUpdated ? "#00e87a" : "#7aaabb"],
                        ["CPI", `${m.inflation}%`, "#7aaabb"],
                        ["PMI SVC", `${m.pmi.services}`, PMI_COLOR(m.pmi.services)],
                        ["PMI MFG", `${m.pmi.manufacturing}`, PMI_COLOR(m.pmi.manufacturing)],
                        ["UR", `${m.labor.unemployment}%`, UR_COLOR(m.labor.unemployment)],
                      ].map(([l, v, c]) => (
                        <div key={l} style={{ textAlign: "center", background: "#030710", padding: "4px 2px", borderRadius: "2px" }}>
                          <div style={{ fontSize: "10px", color: "#5a8aaa" }}>{l}</div>
                          <div style={{ fontSize: "13px", color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: "11px", color: "#5a8aaa", borderTop: "1px solid #09182a", paddingTop: "6px", lineHeight: "1.5" }}>{m.cycle_note}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ CYCLE ═══ */}
        {activeTab === "cycle" && (
          <div>
            <div style={{ background: "#040810", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {["early_expansion", "mid_expansion", "late_expansion", "peak_slowdown", "slowdown", "contraction", "recovery_fragile", "stagflation", "neutral_haven"].map(stage => {
                  const cfg = CYCLE_CONFIG[stage];
                  const currencies = CURRENCIES.filter(c => getLiveM(c).cycle === stage);
                  if (!currencies.length) return null;
                  return (
                    <div key={stage} style={{ background: "#070d16", border: `1px solid ${cfg.color}33`, borderRadius: "3px", padding: "8px 12px" }}>
                      <div style={{ color: cfg.color, fontSize: "12px", marginBottom: "4px" }}>{cfg.icon} {cfg.label}</div>
                      <div style={{ display: "flex", gap: "6px" }}>
                        {currencies.map(c => <span key={c} style={{ background: cfg.color + "20", border: `1px solid ${cfg.color}40`, borderRadius: "2px", padding: "1px 5px", fontSize: "13px", color: cfg.color, fontWeight: "bold" }}>{c}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "12px" }}>
              {sorted.map(currency => {
                const m = getLiveM(currency);
                const cyc = CYCLE_CONFIG[m.cycle] || { label: m.cycle, color: "#7a9ab0", icon: "→" };
                const score = scores[currency] || 50;
                return (
                  <div key={currency} style={{ background: "#070d16", border: `1px solid ${cyc.color}22`, borderRadius: "3px", padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontSize: "22px", fontWeight: "bold" }}>{currency}</span>
                        <span style={{ color: cyc.color, fontSize: "12px" }}>{cyc.icon} {cyc.label}</span>
                      </div>
                      <span style={{ color: getSignal(score).color, fontSize: "18px", fontWeight: "bold" }}>{score}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      <div style={{ background: "#040810", padding: "6px", borderRadius: "2px" }}>
                        <div style={{ fontSize: "11px", color: "#5a8aaa" }}>PMI COMPOSITE</div>
                        <div style={{ fontSize: "18px", color: PMI_COLOR(m.pmi.composite || (m.pmi.manufacturing * 0.3 + m.pmi.services * 0.7)) }}>{m.pmi.composite || ((m.pmi.manufacturing * 0.3 + m.pmi.services * 0.7)).toFixed(1)}</div>
                      </div>
                      <div style={{ background: "#040810", padding: "6px", borderRadius: "2px" }}>
                        <div style={{ fontSize: "11px", color: "#5a8aaa" }}>NEZAPOSLENOST</div>
                        <div style={{ fontSize: "18px", color: UR_COLOR(m.labor.unemployment) }}>{m.labor.unemployment}%</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "12px", color: "#8ab8cc", lineHeight: "1.6", borderTop: "1px solid #09182a", paddingTop: "7px" }}>{m.cycle_note}</div>
                    <button onClick={() => askAI(`Objasni ciklus za ${currency}: ${m.cycle}, rate ${m.rate}%, cb_tone ${m.cb_tone}. Što znači za forex?`)} style={{ marginTop: "8px", background: "none", border: "1px solid #1a3a55", borderRadius: "2px", padding: "5px 14px", color: "#5a9ab8", fontSize: "12px", fontFamily: "inherit", cursor: "pointer", width: "100%" }}>→ AI ANALIZA CIKLUSA</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ LABOR ═══ */}
        {activeTab === "labor" && (
          <div>
            <div style={{ color: "#5a8aaa", fontSize: "12px", marginBottom: "14px" }}>COINCIDENT INDICATORS — UR · Wage growth · NFP · Participation</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
              {sorted.map(currency => {
                const m = getLiveM(currency);
                const lab = m.labor;
                return (
                  <div key={currency} style={{ background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "20px", fontWeight: "bold" }}>{currency}</span>
                      <span style={{ fontSize: "11px", color: lab.trend === "deteriorating" ? "#cc2222" : lab.trend === "tight_labor_market" ? "#00e87a" : lab.trend === "improving" ? "#44cc77" : "#7a9ab0" }}>{lab.trend}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                      <div style={{ background: "#040810", padding: "6px", borderRadius: "2px", textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "#5a8aaa" }}>UR</div>
                        <div style={{ fontSize: "16px", color: UR_COLOR(lab.unemployment), fontWeight: "bold" }}>{lab.unemployment}%</div>
                      </div>
                      <div style={{ background: "#040810", padding: "6px", borderRadius: "2px", textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "#5a8aaa" }}>PLAĆE</div>
                        <div style={{ fontSize: "16px", color: lab.wage_growth > 4 ? "#ffaa22" : "#7aaabb" }}>{lab.wage_growth}%</div>
                      </div>
                      <div style={{ background: "#040810", padding: "6px", borderRadius: "2px", textAlign: "center" }}>
                        <div style={{ fontSize: "10px", color: "#5a8aaa" }}>PART.</div>
                        <div style={{ fontSize: "13px", color: "#7aaabb" }}>{lab.participation ? `${lab.participation}%` : "n/a"}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "11px", color: "#6a9ab0", lineHeight: "1.5" }}>{lab.notes}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PMI ═══ */}
        {activeTab === "pmi" && (
          <div>
            <div style={{ color: "#5a8aaa", fontSize: "12px", marginBottom: "14px" }}>LEADING INDICATORS — PMI {">"} 50 = ekspanzija · PMI {"<"} 50 = kontrakcija</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
              {sorted.map(currency => {
                const m = getLiveM(currency);
                const pmi = m.pmi;
                const comp = pmi.composite || ((pmi.manufacturing * 0.3 + pmi.services * 0.7));
                return (
                  <div key={currency} style={{ background: "#070d16", border: `1px solid ${PMI_COLOR(comp)}22`, borderRadius: "3px", padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "20px", fontWeight: "bold" }}>{currency}</span>
                      <span style={{ color: PMI_COLOR(comp), fontSize: "12px" }}>{pmi.trend.toUpperCase().replace(/_/g, " ")}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "8px" }}>
                      {[{ l: "COMPOSITE", v: comp.toFixed(1) }, { l: "SERVICES", v: pmi.services }, { l: "MFG", v: pmi.manufacturing }].map(({ l, v }) => (
                        <div key={l} style={{ background: "#040810", padding: "8px 4px", borderRadius: "2px", textAlign: "center" }}>
                          <div style={{ fontSize: "10px", color: "#5a8aaa", marginBottom: "2px" }}>{l}</div>
                          <div style={{ fontSize: "20px", fontWeight: "bold", color: PMI_COLOR(parseFloat(v)) }}>{v}</div>
                          <div style={{ fontSize: "10px", color: parseFloat(v) >= 50 ? "#00e87a" : "#cc2222" }}>{parseFloat(v) >= 50 ? "EXP" : "KONTR"}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: "11px", color: "#6a9ab0", lineHeight: "1.5", borderTop: "1px solid #09182a", paddingTop: "7px" }}>{pmi.notes}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ LIVE NEWS ═══ */}
        {activeTab === "news" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <div style={{ color: "#5a8aaa", fontSize: "12px" }}>LIVE NEWS {newsLastFetch && `· Zadnji: ${newsLastFetch.toLocaleTimeString('hr-HR')}`}</div>
              <button onClick={fetchLiveNews} disabled={newsLoading} style={{ background: newsLoading ? "#070d16" : "#00e87a18", border: `1px solid ${newsLoading ? "#0c1c2c" : "#00e87a44"}`, borderRadius: "3px", padding: "7px 14px", color: newsLoading ? "#1e3a55" : "#00e87a", fontFamily: "inherit", fontSize: "12px", cursor: newsLoading ? "wait" : "pointer" }}>
                {newsLoading ? "⟳ DOHVAĆAM..." : "↻ OSVJEŽI VIJESTI"}
              </button>
            </div>
            {newsAnalysis && <div style={{ background: "#070d16", border: "1px solid #1a3a5533", borderRadius: "3px", padding: "10px 14px", marginBottom: "14px", fontSize: "13px", color: newsAnalysis.overall_sentiment === "risk_off" ? "#ff4444" : "#00e87a" }}>{newsAnalysis.overall_sentiment === "risk_off" ? "⚠ RISK OFF" : "▲ RISK ON"} — {newsAnalysis.key_theme}</div>}
            {newsLoading && <div style={{ background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "40px", textAlign: "center", color: "#00e87a" }}>⟳ Claude pretražuje web...</div>}
            {!newsLoading && newsItems.length === 0 && (
              <div style={{ background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "40px", textAlign: "center" }}>
                <div style={{ color: "#5a8aaa", marginBottom: "16px" }}>Pritisni za live analizu vijesti</div>
                <button onClick={fetchLiveNews} style={{ background: "#00e87a18", border: "1px solid #00e87a44", borderRadius: "3px", padding: "10px 20px", color: "#00e87a", fontFamily: "inherit", cursor: "pointer" }}>↻ DOHVATI LIVE VIJESTI</button>
              </div>
            )}
            {!newsLoading && newsItems.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {newsItems.map((item, i) => {
                  const sc = item.severity === "critical" ? "#ff2244" : item.severity === "high" ? "#ff7733" : "#ffcc33";
                  const ic = item.impact === "bullish" ? "#00e87a" : item.impact === "bearish" ? "#ff4444" : "#7a9ab0";
                  return (
                    <div key={i} style={{ background: "#070d16", border: "1px solid #0c1c2c", borderLeft: `3px solid ${sc}`, borderRadius: "0 3px 3px 0", padding: "12px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                        <div style={{ fontSize: "13px", color: "#c0d8e8", fontWeight: "bold", flex: 1 }}>{item.headline}</div>
                        <span style={{ background: ic + "18", borderRadius: "2px", padding: "1px 5px", fontSize: "11px", color: ic, marginLeft: "10px" }}>{item.impact?.toUpperCase()}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#7ab0c8", lineHeight: "1.5", marginBottom: "6px" }}>{item.summary}</div>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {item.currencies_up?.map(c => <span key={c} style={{ background: "#00e87a15", borderRadius: "2px", padding: "1px 5px", fontSize: "11px", color: "#00e87a" }}>↑ {c}</span>)}
                        {item.currencies_down?.map(c => <span key={c} style={{ background: "#ff444415", borderRadius: "2px", padding: "1px 5px", fontSize: "11px", color: "#ff4444" }}>↓ {c}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ PAIRS ═══ */}
        {activeTab === "pairs" && (
          <div>
            <div style={{ color: "#5a8aaa", fontSize: "12px", marginBottom: "14px" }}>KLIKNI PAR → AI ANALIZA S LIVE CB PODACIMA</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "12px" }}>
              {FOREX_PAIRS.map(pair => {
                const sig = getPairSignal(pair.base, pair.quote, scores);
                const bm = getLiveM(pair.base);
                const qm = getLiveM(pair.quote);
                return (
                  <div key={pair.pair} onClick={() => handlePairClick(pair)}
                    style={{ background: "#070d16", border: `1px solid ${sig.color}22`, borderRadius: "3px", padding: "14px", cursor: "pointer" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = sig.color + "55"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = sig.color + "22"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "bold" }}>{pair.pair}</span>
                      <span style={{ color: sig.color, fontSize: "12px", fontWeight: "bold" }}>{sig.label}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: "#5a8aaa" }}>{pair.base} · {bm.rate}%</div>
                        <div style={{ fontSize: "22px", color: getSignal(scores[pair.base] || 50).color }}>{scores[pair.base] || 50}</div>
                      </div>
                      <div style={{ color: "#0a1c2c", alignSelf: "center" }}>↔</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "12px", color: "#5a8aaa" }}>{pair.quote} · {qm.rate}%</div>
                        <div style={{ fontSize: "22px", color: getSignal(scores[pair.quote] || 50).color }}>{scores[pair.quote] || 50}</div>
                      </div>
                    </div>
                    <div style={{ background: "#040810", borderRadius: "2px", padding: "5px", display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "#5a8aaa" }}>CONF: <span style={{ color: sig.color, fontWeight: "bold" }}>{sig.confidence}%</span></span>
                      <span style={{ fontSize: "12px", color: sig.diff >= 0 ? "#00e87a" : "#e85544" }}>{sig.diff >= 0 ? "+" : ""}{sig.diff}</span>
                    </div>
                    <div style={{ fontSize: "11px", color: "#4a7a99", textAlign: "center", marginTop: "7px" }}>→ klikni za AI analizu</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ AI ═══ */}
        {activeTab === "ai" && (
          <div>
            <div style={{ color: "#5a8aaa", fontSize: "12px", marginBottom: "12px" }}>AI ANALIZA · LIVE CB + CYCLE FRAMEWORK · {new Date().toLocaleDateString('hr-HR')}</div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
              <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && aiQuery.trim() && askAI(aiQuery)}
                placeholder="npr. Kako RBA hike utječe na AUD/NZD? Koji par je najjači signal danas?"
                style={{ flex: 1, background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "9px 12px", color: "#dde8f0", fontFamily: "inherit", fontSize: "14px", outline: "none" }} />
              <button onClick={() => aiQuery.trim() && askAI(aiQuery)} disabled={aiLoading}
                style={{ background: aiLoading ? "#070d16" : "#00e87a15", border: `1px solid ${aiLoading ? "#0c1c2c" : "#00e87a33"}`, borderRadius: "3px", padding: "9px 14px", color: aiLoading ? "#1e3a55" : "#00e87a", fontFamily: "inherit", fontSize: "13px", cursor: aiLoading ? "wait" : "pointer" }}>
                {aiLoading ? "ANALIZIRAM..." : "ANALIZIRAJ"}
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "7px", marginBottom: "14px" }}>
              {["Koja valuta ima najjači ciklus?", "Japan vs USD analiza", "GBP stagflacija — buy ili sell?", "CAD: nafta vs tarife?", "Safe haven: CHF ili JPY?", "AUD/NZD — koja je jača?"].map(q => (
                <button key={q} onClick={() => { setAiQuery(q); askAI(q); }} style={{ background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "2px", padding: "5px 10px", color: "#5a9ab8", fontSize: "12px", fontFamily: "inherit", cursor: "pointer" }}>{q}</button>
              ))}
            </div>
            {(aiLoading || aiResponse) && (
              <div style={{ background: "#070d16", border: "1px solid #00e87a18", borderLeft: "3px solid #00e87a", borderRadius: "0 3px 3px 0", padding: "16px" }}>
                <div style={{ fontSize: "11px", color: "#00e87a", marginBottom: "9px" }}>◆ AI ANALIZA · LIVE DATA · {new Date().toLocaleDateString('hr-HR')}</div>
                {aiLoading ? <div style={{ color: "#5a8aaa" }}>Analiziram... <span style={{ animation: "blink 1s infinite" }}>█</span></div>
                  : <div style={{ color: "#a8c8e0", fontSize: "14px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{aiResponse}</div>}
              </div>
            )}
            {!aiLoading && !aiResponse && (
              <div style={{ background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "40px", textAlign: "center", color: "#1a3a55", fontSize: "13px" }}>UNESI UPIT ILI KLIKNI PAR / BRZO PITANJE</div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        * { box-sizing: border-box; }
        input::placeholder { color: #1a3040; }
        ::-webkit-scrollbar { width: 3px; height: 3px; background: #030710; }
        ::-webkit-scrollbar-thumb { background: #0c1c2c; }
      `}</style>
    </div>
  );
}
