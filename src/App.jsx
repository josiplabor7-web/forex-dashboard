import React, { useState, useEffect, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// FOREX MACRO INTELLIGENCE v3.0 — 12. OŽUJKA 2026.
// Dodani: PMI (leading), labor market (coincident), economic cycle
// ═══════════════════════════════════════════════════════════════

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "CHF", "AUD", "CAD", "NZD"];

// ECONOMIC CYCLE STAGES
// Expansion: PMI>50, UR padajuća, rast plača snažan
// Peak: PMI visok ali pada, UR na minimumu, inflacija raste
// Slowdown: PMI pada, UR raste, rast usporava
// Contraction: PMI<50, UR naglo raste, deflatorni pritisci
// Recovery: PMI raste iz dna, UR stabilizira

const MACRO_CONTEXT = {
  USD: {
    // CB & Macro
    rate: 3.625, inflation: 2.4, core_inflation: 2.5, gdp: 2.8,
    trend: "on hold", cb_tone: "neutral", central_bank: "Fed", next_meeting: "18. ožujka",
    // LABOR MARKET — Feb 2026 (BLS, 6.3.2026.)
    labor: {
      nfp: -92,           // NFP Feb 2026: -92K (šok! očekivano +50K)
      nfp_prev: 126,      // Jan 2026: 126K (revidirano dolje sa 130K)
      adp: 63,            // ADP Feb: +63K (beat, očekivano 50K)
      unemployment: 4.4,  // UR Feb: 4.4% (↑ od 4.3% u jan)
      u6: 7.9,            // U-6 šira mjera nezaposlenosti
      wage_growth: 3.8,   // Prosječna satnica YoY Feb
      participation: 62.0, // Labor force participation rate (najniže od prosinca 2021!)
      trend: "deteriorating", // Opći trend: pogoršanje
      notes: "ŠOKANTNO: -92K Feb (3. pad u 5 mj.). UR na 4.4%, najblize 4-god. vrhu. Fed rez pomaknut na srpanj. Participacija 62% — najniže od XII 2021."
    },
    // PMI — Feb 2026
    pmi: {
      manufacturing: 52.4,  // ISM Mfg: 52.4 (2. mj. ekspanzije, 3. u 40 mj.!)
      services: 56.1,       // ISM Services: 56.1 — NAJVIŠE od VII 2022!
      composite: 51.6,      // S&P Global Composite: pao (tarife, vremenske prilike)
      prices_index: 70.5,   // ISM Mfg Prices: 70.5 — EKSPLOZIJA! Najviše od VI 2022
      new_orders: 55.8,     // New orders u ekspanziji
      employment_pmi: 48.8, // PMI Employment: još u kontrakciji
      trend: "mixed",       // Rast usporava u comp, ali ISM services jaki
      notes: "Dihotomija: ISM Services na max od 2022, ali S&P Composite pao zbog tarifa i vremena. CRVENA ZASTAVICA: Prices index 70.5 = inflacijski pritisak dolazi!"
    },
    // ECONOMIC CYCLE
    cycle: "peak_slowdown", // Usporavanje s vrha, labor market slabi
    cycle_note: "US na prekretnici: Services jaki, Manufacturing oporavak, ali labor market se lomi. NFP -92K + UR 4.4% = Fed ne može hike, ali ni rezati dok Iran drži inflaciju."
  },
  EUR: {
    rate: 2.0, inflation: 2.2, core_inflation: 2.3, gdp: 0.4,
    trend: "on hold", cb_tone: "neutral", central_bank: "ECB", next_meeting: "19. ožujka",
    labor: {
      nfp: null,
      adp: null,
      unemployment: 6.1,   // Eurozone UR Jan 2026: 6.1% — REKORDNI MINIMUM! (↓ od 6.2%)
      u6: null,
      wage_growth: 4.1,    // EA wage growth Q4 2025
      participation: null,
      trend: "stable_improving",
      notes: "EUR labor market na rekordnom minimumu (6.1% Jan, Eurostat 4.3.2026). Tržište rada podupire potrošnju ali PMI zapošljavanje slabo (49.9 u jan)."
    },
    pmi: {
      manufacturing: 47.6,  // HCOB EA Mfg Feb: kontrakcija (Njemačka vuče dolje)
      services: 50.6,       // EA Services: tek iznad 50
      composite: 50.2,      // Kompozit: jedva u ekspanziji
      prices_index: 58.0,   // Cijene rastu (Iran efekt)
      new_orders: 48.5,
      employment_pmi: 49.9, // Zapošljavanje blago pada
      trend: "weak_recovery",
      notes: "Eurozona jedva u ekspanziji. Njemačka vleče dolje (Mfg 46.5). Francuska i Italija bolje. Iran = energetski šok koji može ubiti ionako slabi rast."
    },
    cycle: "recovery_fragile",
    cycle_note: "EUR: slab oporavak koji je osjetljiv na vanjske šokove. Rekordno niska nezaposlenost je stub, ali PMI jedva iznad 50. Iran = najveći downside rizik."
  },
  GBP: {
    rate: 3.75, inflation: 3.0, core_inflation: 3.2, gdp: 0.1,
    trend: "easing", cb_tone: "dovish", central_bank: "BoE", next_meeting: "19. ožujka",
    labor: {
      nfp: null,
      adp: null,
      unemployment: 4.4,   // UK UR Dec 2025: 4.4% (raste)
      u6: null,
      wage_growth: 5.9,    // UK wages ex bonus YoY (još visoke!)
      participation: 62.5,
      trend: "deteriorating",
      notes: "UK tržište rada slabi: UR raste, firme smanjuju zapošljavanje (PMI Employment negativan). Ali plaće 5.9% YoY — stagflacijska klopka za BoE."
    },
    pmi: {
      manufacturing: 46.9, // UK Mfg Feb: kontrakcija
      services: 53.8,      // UK Services: solidno! 22-mj. visina
      composite: 53.1,     // Composite: Feb na 22-mj. VISOKOJ!
      prices_index: 62.0,
      new_orders: 54.2,
      employment_pmi: 47.5, // Zapošljavanje pada!
      trend: "services_led_growth",
      notes: "UK paradoks: Composite PMI na 22-mj. visini (services!), ali manufacturing u kontrakciji i zapošljavanje pada. Inflacija 3% + UR raste = stagflacija."
    },
    cycle: "stagflation",
    cycle_note: "GBP u klasičnoj stagflaciji: rast usluga jak ali nije dovoljan, manufacturing slabi, plaće visoke ali zapošljavanje pada. BoE u nemogućoj poziciji — Iran odgodio sve rezove."
  },
  JPY: {
    rate: 0.75, inflation: 2.2, core_inflation: 2.0, gdp: 0.4,
    trend: "hawkish", cb_tone: "hawkish", central_bank: "BoJ", next_meeting: "Kraj ožujka",
    labor: {
      nfp: null,
      adp: null,
      unemployment: 2.6,  // Japan UR: 2.6% (praktički puna zaposlenost!)
      u6: null,
      wage_growth: 3.1,   // Japan plaće rastu (BoJ uvjet za hike ispunjen)
      participation: 63.8,
      trend: "tight_labor_market",
      notes: "Japan: UR 2.6% = praktički puna zaposlenost. Plaće rastu 3.1% — BoJ uvjet za normalizaciju politike ispunjen. Snažno tržište rada podupire hiking cycle."
    },
    pmi: {
      manufacturing: 49.0, // Japan Mfg Feb: blago u kontrakciji
      services: 53.7,      // Japan Services: 21-mj. visina!
      composite: 52.8,     // Composite: 33-mj. VISINA u veljači!
      prices_index: 55.0,
      new_orders: 52.5,
      employment_pmi: 51.8, // Zapošljavanje raste!
      trend: "strong_expansion",
      notes: "Japan na 33-mj. PMI visokoj! Services na 21-mj. max. Puna zaposlenost + plaće rastu + PMI jak = BoJ hike preduvjeti ispunjeni. Carry trade unwind ubrzava."
    },
    cycle: "early_expansion",
    cycle_note: "JPY: Japan izlazi iz deflacije. Puna zaposlenost, rast plača, jak PMI Services — BoJ se normalizira. Tržišta: +52bp hikea do XII 2026. Carry trade unwind = JPY jača."
  },
  CHF: {
    rate: 0.0, inflation: 0.4, core_inflation: 0.6, gdp: 0.8,
    trend: "on hold", cb_tone: "neutral", central_bank: "SNB", next_meeting: "26. ožujka",
    labor: {
      nfp: null, adp: null,
      unemployment: 2.8,   // CH UR: stabilna i niska
      u6: null,
      wage_growth: 1.2,    // Niske inflacije = niske plaće
      participation: 68.5,
      trend: "stable",
      notes: "Švicarska: stabilno tržište rada, niska UR, minimalna inflacija. SNB bez potrebe za akcijom. CHF snaga dolazi isključivo od safe-haven tražnje."
    },
    pmi: {
      manufacturing: 48.5, // CH Mfg: blago u kontrakciji
      services: 51.5,
      composite: 50.8,
      prices_index: 45.0,  // Deflatorni pritisci!
      new_orders: 49.5,
      employment_pmi: 50.2,
      trend: "neutral",
      notes: "Švicarska PMI neutralna. Manufacturing blago u kontrakciji, services stabil. Nema inflacijskih pritisaka. CHF = safe haven play, ne fundamentalni play."
    },
    cycle: "neutral_haven",
    cycle_note: "CHF: ekonomija stabilna ali bez snažne dinamike. Jedini razlog za CHF kupnju je geopolitika (Iran) — safe haven tražnja. Fundamentalno neutralno, geopolitički bullish."
  },
  AUD: {
    rate: 4.1, inflation: 3.2, core_inflation: 3.1, gdp: 1.5,
    trend: "uncertain", cb_tone: "hawkish", central_bank: "RBA", next_meeting: "Travanj",
    labor: {
      nfp: null, adp: null,
      unemployment: 4.0,    // AU UR: 4.0% (relativno niska)
      u6: null,
      wage_growth: 3.3,     // Wage growth usporava
      participation: 67.1,
      trend: "stable",
      notes: "Australia tržište rada solidno (UR 4%), ali inflacija 3.2% iznad cilja. RBA hikao u veljači 2026 — tržišta expectaju +39bp više do kraja 2026."
    },
    pmi: {
      manufacturing: 50.5,  // AU Mfg: jedva u ekspanziji
      services: 52.8,       // AU Services: solidno
      composite: 52.1,      // Feb: ubrzanje (S&P Global: growth accelerated)
      prices_index: 60.0,
      new_orders: 53.0,
      employment_pmi: 51.5,
      trend: "mild_expansion",
      notes: "Australia PMI ubrzava u februaru (S&P Global). Ali: Iran = nafta gore = uvozni inflacijski šok (Australija uvozi naftu!). Kina slaba = downside za rudne sirovine."
    },
    cycle: "late_expansion",
    cycle_note: "AUD: kasna ekspanzija s inflacijskim problemom. RBA hika dok ostali stoje. Konflikt: Iran hurt AUD (uvoznik nafte) ali +nafta je neutralno za AUD (Au ne exportira naftu). Kina = glavni rizik."
  },
  CAD: {
    rate: 2.25, inflation: 2.2, core_inflation: 2.1, gdp: 1.1,
    trend: "on hold", cb_tone: "neutral", central_bank: "BoC", next_meeting: "Travanj",
    labor: {
      nfp: null, adp: null,
      unemployment: 6.5,    // CA UR Jan 2026: 6.5% (palo s 6.7% u prosincu!)
      u6: null,
      wage_growth: 3.8,
      participation: 65.0,
      trend: "improving",
      notes: "Canada labor market iznenađenje: UR pala na 6.5% u jan (OECD). Ali USMCA tarife prijete gubicima radnih mjesta u industriji. Iran = nafta gore = CAD bullish."
    },
    pmi: {
      manufacturing: 52.8,  // Canada Mfg Feb: RASTE — najviše od jan 2025!
      services: 51.5,
      composite: 52.2,
      prices_index: 58.0,
      new_orders: 54.0,
      employment_pmi: 50.8,
      trend: "improving",
      notes: "Canada Mfg PMI na 13-mj. visokoj! (S&P Global: 'positive month for Canada's manufacturing'). Kontradikcija: jak PMI ali USMCA tarife prijete. Iran = bullish CAD."
    },
    cycle: "mid_expansion",
    cycle_note: "CAD složena slika: PMI raste, nafta gore (Iran = bullish), ali USMCA tarife = structural downside. BoC čeka što će biti s tarifama prije iduće odluke."
  },
  NZD: {
    rate: 2.25, inflation: 2.8, core_inflation: 2.6, gdp: 0.6,
    trend: "on hold", cb_tone: "neutral", central_bank: "RBNZ", next_meeting: "Travanj",
    labor: {
      nfp: null, adp: null,
      unemployment: 5.1,    // NZ UR Q4 2025: 5.1% (raste)
      u6: null,
      wage_growth: 3.2,
      participation: 71.5,
      trend: "deteriorating",
      notes: "NZ tržište rada slabi: UR 5.1% u Q4 2025 (raste). Inflacija 2.8% iznad cilja. RBNZ drži — tržišta expectaju +27bp do XII 2026 ali bez jasnog smjera."
    },
    pmi: {
      manufacturing: 48.5, // NZ Mfg: kontrakcija
      services: 49.8,      // NZ Services: na rubu kontrakcije
      composite: 49.2,     // Kompozit u kontrakciji!
      prices_index: 55.0,
      new_orders: 48.0,
      employment_pmi: 48.2,
      trend: "contraction",
      notes: "NZD crvene zastavice: PMI Composite u kontrakciji! Slab rast + inflacija iznad cilja + rast UR. Kina slabost = direktan udar. Iran = uvoznik nafte → inflacijski šok."
    },
    cycle: "slowdown",
    cycle_note: "NZD: gospodarski ciklus u usporavanju prema kontrakciji. PMI kompozit < 50, UR raste, Kina slaba, Iran = inflacijski udar. Jedan od najslabijih fundamentalnih profila."
  },
};

// GEOPOLITICAL EVENTS
const GEOPOLITICAL_EVENTS = [
  { event: "US-Izrael napad na Iran — nafta $100+, inflacijski šok u ožujku", bull: ["CAD", "USD"], bear: ["EUR", "NZD", "AUD", "GBP"], severity: "critical", weight: 20 },
  { event: "Iran: CB rezovi odgođeni — Fed rez pomaknut na srpanj (CME FedWatch)", bull: ["USD"], bear: ["EUR", "GBP", "NZD"], severity: "high", weight: 15 },
  { event: "Trump tarife 10.5% + USMCA review", bull: ["USD"], bear: ["CAD", "EUR"], severity: "high", weight: 12 },
  { event: "Fed neovisnost pod pritiskom (Trump/DOJ vs Powell)", bull: [], bear: ["USD"], severity: "medium", weight: 10 },
  { event: "BoJ hiking cycle — carry trade unwind ubrzava", bull: ["JPY"], bear: ["AUD", "NZD"], severity: "medium", weight: 10 },
  { event: "Bloomberg: ECB i BoE hike bets rastu zbog energije (9.3.)", bull: ["EUR", "GBP"], bear: [], severity: "medium", weight: 8 },
  { event: "Kina PMI ispod očekivanja — slabost traje", bull: [], bear: ["AUD", "NZD"], severity: "medium", weight: 8 },
];

// CYCLE PHASE DISPLAY CONFIG
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

function computeCurrencyScore(currency) {
  const m = MACRO_CONTEXT[currency];
  let score = 50;

  // 1. KAMATNE STOPE — 18pt
  const avgRate = 2.1;
  score += Math.max(-14, Math.min(18, (m.rate - avgRate) * 2.2));

  // 2. CB TON — 15pt
  const toneMap = { "hawkish": 14, "on hold": 0, "neutral": 0, "easing": -8, "dovish": -11, "uncertain": -2 };
  score += (toneMap[m.cb_tone] || 0);

  // 3. PMI — LEADING INDICATOR — 15pt
  const pmi = m.pmi;
  const compPMI = pmi.composite || (pmi.manufacturing * 0.3 + pmi.services * 0.7);
  if (compPMI > 54) score += 12;
  else if (compPMI > 52) score += 7;
  else if (compPMI > 50) score += 3;
  else if (compPMI > 48) score -= 5;
  else score -= 10;
  // PMI trend signal
  if (pmi.trend === "strong_expansion") score += 5;
  else if (pmi.trend === "services_led_growth" || pmi.trend === "mild_expansion") score += 2;
  else if (pmi.trend === "contraction") score -= 8;
  else if (pmi.trend === "weak_recovery") score -= 2;

  // 4. LABOR MARKET — COINCIDENT INDICATOR — 12pt
  const lab = m.labor;
  const ur = lab.unemployment;
  if (ur < 3.5) score += 10;
  else if (ur < 4.5) score += 5;
  else if (ur < 5.5) score += 1;
  else if (ur < 6.5) score -= 4;
  else score -= 8;
  if (lab.trend === "deteriorating") score -= 6;
  else if (lab.trend === "tight_labor_market") score += 5;
  else if (lab.trend === "improving") score += 3;
  // US-specific: NFP šok
  if (currency === "USD" && m.labor.nfp < 0) score -= 5;
  // Wage growth signal
  if (lab.wage_growth > 4 && m.cb_tone === "hawkish") score += 3;

  // 5. ECONOMIC CYCLE — 10pt
  const cycleScore = {
    "early_expansion": 10, "mid_expansion": 7, "expansion": 8, "late_expansion": 4,
    "peak_slowdown": -3, "recovery_fragile": 2, "slowdown": -6,
    "stagflation": -10, "contraction": -12, "neutral_haven": 0
  };
  score += (cycleScore[m.cycle] || 0);

  // 6. INFLACIJA — 8pt
  if (m.inflation <= 2.0) score += 3;
  else if (m.inflation <= 2.5) score += 1;
  else if (m.inflation <= 3.5) score -= 3;
  else score -= 8;

  // 7. GEOPOLITIKA — 40pt dominantan faktor
  GEOPOLITICAL_EVENTS.forEach(ev => {
    const m = ev.severity === "critical" ? 1.5 : ev.severity === "high" ? 1.0 : 0.6;
    if (ev.bull?.includes(currency)) score += ev.weight * m * 0.45;
    if (ev.bear?.includes(currency)) score -= ev.weight * m * 0.45;
  });

  return Math.max(8, Math.min(95, Math.round(score)));
}

function getSignal(score) {
  if (score >= 70) return { label: "JAKO BULLISH", color: "#00e87a", bg: "#00e87a15" };
  if (score >= 58) return { label: "BULLISH", color: "#44cc77", bg: "#44cc7715" };
  if (score >= 42) return { label: "NEUTRALNO", color: "#7a9ab0", bg: "#7a9ab015" };
  if (score >= 30) return { label: "BEARISH", color: "#e85544", bg: "#e8554415" };
  return { label: "JAKO BEARISH", color: "#cc2222", bg: "#cc222215" };
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

const SYSTEM_PROMPT = `Ti si senior forex analitičar (20 god iskustva). Koristiš AKTUALNE podatke za 12. OŽUJKA 2026.

FRAMEWORK: GDP je lagging indicator. PMI (leading) + Labor market (coincident) daju stvarno stanje ciklusa.

KEY DATA:
KAMATE: Fed 3.625% (rez u srpnju, CME FedWatch), ECB 2.0%, BoE 3.75% (stagflacija, March rez 30%), BoJ 0.75% (HIKA, +52bp do XII), RBA 4.1% (hika!), BoC/RBNZ 2.25%, SNB 0%
US LABOR (6.3.2026): NFP Feb -92K (ŠOKANTNO! vs +50K exp), ADP +63K, UR 4.4%↑, participacija 62% (4-god. minimum), plaće +3.8% YoY
US PMI Feb: ISM Mfg 52.4, ISM Services 56.1 (max od VII 2022!), Prices 70.5 (!!), S&P Composite 51.6↓
GLOBAL PMI Feb: Japan Composite 52.8 (33-mj. visina!), UK Composite 53.1 (22-mj. visina!), EA Composite 50.2, NZ <50 (kontrakcija!), Canada Mfg 52.8↑
UNEMPLOYMENT: EUR 6.1% (rekordni min), Japan 2.6% (puna zaposlenost!), UK 4.4%↑, Canada 6.5%↓, NZ 5.1%↑, AU 4.0%
CIKLUSI: Japan = rana ekspanzija (jedina CB koja hika), UK = stagflacija, EUR = krhki oporavak, US = vrh→usporavanje, NZ = usporavanje/kontrakcija
GEOPOLITIKA: Iran rat = nafta $100+ = inflacijski šok = odgođeni rezovi, CAD bullish (nafta), CHF/JPY safe haven, EUR bearish (uvoznik energije), Bloomberg 9.3: ECB+BoE hike bets rastu

Format (UVIJEK HRVATSKI):
1. Ekonomski ciklus analize (PMI + labor market + ciklus)
2. CB politika implikacije
3. Geopolitički kontekst
4. KONKRETAN ZAKLJUČAK: BUY/SELL/ČEKAJ + razlog
5. Ključni rizici

Budi koncizan i direktan. Koristi podatke, ne filozofiju.`;

// ═══════════════════════════════════════════════════════════════
// NEWS SYSTEM PROMPT — Claude traži vijesti i vraća JSON impact
// ═══════════════════════════════════════════════════════════════
const NEWS_SYSTEM_PROMPT = `Ti si forex geopolitički analitičar. Pretraži web za ZADNJE vijesti (zadnjih 24-48 sati) o:
1. Iran-US-Izrael konflikt i nafta
2. Fed, ECB, BoE, BoJ, RBA, BoC odluke ili govori
3. Globalna geopolitika koja utječe na forex
4. Inflacija, PMI ili labor market podaci

OBAVEZNO vrati odgovor ISKLJUČIVO u JSON formatu, bez ikakvog teksta izvan JSON-a:
{
  "news": [
    {
      "headline": "kratki naslov vijesti",
      "summary": "2-3 rečenice o vijesti",
      "impact": "bullish" | "bearish" | "neutral",
      "currencies_up": ["USD", "JPY"],
      "currencies_down": ["EUR", "GBP"],
      "severity": "critical" | "high" | "medium" | "low",
      "score_adjustments": {"USD": 5, "EUR": -3, "JPY": 8},
      "source_hint": "npr. Reuters, Bloomberg, Fed statement"
    }
  ],
  "overall_sentiment": "risk_on" | "risk_off" | "neutral",
  "key_theme": "jedna rečenica o dominantnoj temi dana",
  "last_updated": "trenutno vrijeme HH:MM"
}

Vrati maksimalno 6 najvažnijih vijesti. score_adjustments su od -15 do +15.`;

export default function ForexDashboard() {
  const [scores, setScores] = useState({});
  const [activeTab, setActiveTab] = useState("overview");
  const [activeCurrency, setActiveCurrency] = useState(null);
  const [aiQuery, setAiQuery] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsLastFetch, setNewsLastFetch] = useState(null);
  const [liveAdjustments, setLiveAdjustments] = useState({});
  const [newsAnalysis, setNewsAnalysis] = useState(null);

  useEffect(() => {
    const c = {};
    CURRENCIES.forEach(cur => { c[cur] = computeCurrencyScore(cur); });
    setScores(c);
  }, []);

  // Fetch live news i score adjustments
  const fetchLiveNews = useCallback(async () => {
    setNewsLoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: NEWS_SYSTEM_PROMPT,
          tools: [{ type: "web_search_20250305", name: "web_search" }],
          messages: [{ role: "user", content: `Pretraži web za zadnje forex vijesti danas ${new Date().toLocaleDateString('hr-HR')} i vrati JSON s analizom utjecaja na valute. Fokus: Iran, CB govori, geopolitika, macro podaci.` }],
        }),
      });
      const data = await res.json();
      // Extract text from response (may have tool_use blocks)
      const textBlock = data.content?.find(b => b.type === "text");
      if (textBlock?.text) {
        const raw = textBlock.text.replace(/```json|```/g, "").trim();
        // Find JSON in response
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          setNewsItems(parsed.news || []);
          setNewsAnalysis(parsed);
          setNewsLastFetch(new Date());
          // Apply score adjustments
          const adj = {};
          (parsed.news || []).forEach(item => {
            if (item.score_adjustments) {
              Object.entries(item.score_adjustments).forEach(([cur, val]) => {
                adj[cur] = (adj[cur] || 0) + val;
              });
            }
          });
          setLiveAdjustments(adj);
          // Update scores with adjustments
          const c = {};
          CURRENCIES.forEach(cur => {
            const base = computeCurrencyScore(cur);
            c[cur] = Math.max(8, Math.min(95, base + (adj[cur] || 0)));
          });
          setScores(c);
        }
      }
    } catch (e) {
      console.error("News fetch error:", e);
    }
    setNewsLoading(false);
  }, []);

  const askAI = useCallback(async (question) => {
    setAiLoading(true);
    setAiResponse("");
    setActiveTab("ai");
    const ctx = CURRENCIES.map(c => {
      const m = MACRO_CONTEXT[c];
      return `${c}: score=${computeCurrencyScore(c)}, rate=${m.rate}%, CPI=${m.inflation}%, PMI_comp=${m.pmi.composite||'n/a'}, PMI_svc=${m.pmi.services}, PMI_mfg=${m.pmi.manufacturing}, UR=${m.labor.unemployment}%, cb=${m.cb_tone}, cycle=${m.cycle}`;
    }).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: `VALUTNI PROFILI:\n${ctx}\n\nPITANJE: ${question}` }],
        }),
      });
      const data = await res.json();
      setAiResponse(data.content?.map(b => b.text || "").join("") || "Greška.");
    } catch { setAiResponse("Greška pri pozivu AI."); }
    setAiLoading(false);
  }, []);

  const handlePairClick = (pair) => {
    const sig = getPairSignal(pair.base, pair.quote, scores);
    const q = `Analiziraj ${pair.pair}. Signal: ${sig.label}, diff: ${sig.diff > 0 ? "+" : ""}${sig.diff}, confidence: ${sig.confidence}%. Koristi PMI, labor market i economic cycle framework uz geopolitički kontekst.`;
    setAiQuery(q);
    askAI(q);
  };

  const sorted = [...CURRENCIES].sort((a, b) => (scores[b] || 50) - (scores[a] || 50));

  return (
    <div style={{ minHeight: "100vh", background: "#050910", color: "#dde8f0", fontFamily: "'IBM Plex Mono', 'Courier New', monospace", overflowX: "hidden" }}>

      {/* HEADER */}
      <div style={{ background: "#07101a", borderBottom: "1px solid #0c1c2c", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#00e87a", boxShadow: "0 0 10px #00e87a", animation: "pulse 2s infinite" }} />
          <span style={{ color: "#00e87a", fontSize: "10px", letterSpacing: "3px", fontWeight: "bold" }}>FOREX MACRO INTELLIGENCE</span>
          <span style={{ color: "#1a3a55", fontSize: "8px" }}>v4.0 · LIVE NEWS + PMI + LABOR + CYCLE</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#ff7733", fontSize: "8px", letterSpacing: "1px" }}>⚠ IRAN RAT · NFP -92K · ISM PRICES 70.5</div>
          <div style={{ color: "#1a3a55", fontSize: "8px", marginTop: "1px" }}>12.3.2026. | US UR 4.4% | JP UR 2.6% | EA UR 6.1%rec.min</div>
        </div>
      </div>

      {/* TICKER */}
      <div style={{ background: "#030710", borderBottom: "1px solid #09182a", padding: "6px 20px", display: "flex", gap: "22px", overflowX: "auto" }}>
        {FOREX_PAIRS.map(p => {
          const sig = getPairSignal(p.base, p.quote, scores);
          return (
            <div key={p.pair} onClick={() => handlePairClick(p)} style={{ display: "flex", gap: "6px", alignItems: "center", flexShrink: 0, cursor: "pointer" }}>
              <span style={{ color: "#1e3a55", fontSize: "9px" }}>{p.pair}</span>
              <span style={{ color: sig.color, fontSize: "9px", fontWeight: "bold" }}>{sig.label}</span>
              <span style={{ color: "#0f2235", fontSize: "8px" }}>{sig.confidence}%</span>
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
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "10px 14px", color: activeTab === t.id ? "#00e87a" : "#1e3a55", fontSize: "9px", letterSpacing: "2px", borderBottom: activeTab === t.id ? "2px solid #00e87a" : "2px solid transparent", fontFamily: "inherit", flexShrink: 0 }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "18px 20px" }}>

        {/* ═══ OVERVIEW ═══ */}
        {activeTab === "overview" && (
          <div>
            <div style={{ color: "#1a3a55", fontSize: "8px", marginBottom: "14px", letterSpacing: "1px" }}>
              SCORE: kamate 18pt + CB ton 15pt + PMI 15pt + labor 12pt + ciklus 10pt + inflacija 8pt + geopolitika 40pt = 118pt total (normalizirano 0-100)
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "9px" }}>
              {sorted.map((currency, i) => {
                const score = scores[currency] || 50;
                const signal = getSignal(score);
                const m = MACRO_CONTEXT[currency];
                const cyc = CYCLE_CONFIG[m.cycle] || { label: m.cycle, color: "#7a9ab0", icon: "→" };
                return (
                  <div key={currency} onClick={() => { setActiveCurrency(activeCurrency === currency ? null : currency); }}
                    style={{ background: "#070d16", border: `1px solid ${i === 0 ? signal.color + "44" : "#0c1c2c"}`, borderRadius: "3px", padding: "13px", cursor: "pointer" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "20px", fontWeight: "bold" }}>{currency}</div>
                        <div style={{ fontSize: "8px", color: "#1e3a55" }}>{m.central_bank} · {m.next_meeting}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "22px", fontWeight: "bold", color: signal.color }}>{score}</div>
                        <div style={{ fontSize: "7px", color: signal.color, letterSpacing: "1px" }}>{signal.label}</div>
                      </div>
                    </div>
                    <div style={{ background: "#030710", height: "3px", borderRadius: "2px", marginBottom: "8px" }}>
                      <div style={{ height: "100%", width: `${score}%`, background: `linear-gradient(90deg, ${signal.color}55, ${signal.color})`, borderRadius: "2px", transition: "width 1.2s ease" }} />
                    </div>

                    {/* Cycle badge */}
                    <div style={{ background: cyc.color + "15", border: `1px solid ${cyc.color}33`, borderRadius: "2px", padding: "3px 8px", marginBottom: "8px", display: "inline-block" }}>
                      <span style={{ color: cyc.color, fontSize: "8px", letterSpacing: "1px" }}>{cyc.icon} {cyc.label}</span>
                    </div>

                    {/* Key indicators grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px", marginBottom: "7px" }}>
                      {[
                        ["RATE", `${m.rate}%`, "#7aaabb"],
                        ["CPI", `${m.inflation}%`, "#7aaabb"],
                        ["PMI SVC", `${m.pmi.services}`, PMI_COLOR(m.pmi.services)],
                        ["PMI MFG", `${m.pmi.manufacturing}`, PMI_COLOR(m.pmi.manufacturing)],
                        ["UR", `${m.labor.unemployment}%`, UR_COLOR(m.labor.unemployment)],
                      ].map(([l, v, c]) => (
                        <div key={l} style={{ textAlign: "center", background: "#030710", padding: "4px 2px", borderRadius: "2px" }}>
                          <div style={{ fontSize: "6px", color: "#1a3a55", marginBottom: "1px" }}>{l}</div>
                          <div style={{ fontSize: "10px", color: c }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ fontSize: "8px", color: "#1e3a55", borderTop: "1px solid #09182a", paddingTop: "7px", lineHeight: "1.5" }}>
                      {m.cycle_note}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ CYCLE ═══ */}
        {activeTab === "cycle" && (
          <div>
            <div style={{ color: "#1a3a55", fontSize: "8px", marginBottom: "4px", letterSpacing: "1px" }}>GDP = LAGGING (mjeri prošlost) · PMI = LEADING (ankete buduće namjere) · LABOR = COINCIDENT (sadašnje stanje)</div>
            <div style={{ background: "#040810", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "12px", marginBottom: "16px" }}>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {["early_expansion", "mid_expansion", "late_expansion", "peak_slowdown", "slowdown", "contraction", "recovery_fragile", "stagflation", "neutral_haven"].map(stage => {
                  const cfg = CYCLE_CONFIG[stage];
                  const currencies = CURRENCIES.filter(c => MACRO_CONTEXT[c].cycle === stage);
                  if (!currencies.length) return null;
                  return (
                    <div key={stage} style={{ background: "#070d16", border: `1px solid ${cfg.color}33`, borderRadius: "3px", padding: "8px 12px", minWidth: "120px" }}>
                      <div style={{ color: cfg.color, fontSize: "8px", letterSpacing: "1px", marginBottom: "4px" }}>{cfg.icon} {cfg.label}</div>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {currencies.map(c => <span key={c} style={{ background: cfg.color + "20", border: `1px solid ${cfg.color}40`, borderRadius: "2px", padding: "1px 5px", fontSize: "10px", color: cfg.color, fontWeight: "bold" }}>{c}</span>)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Detailed cycle analysis per currency */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "9px" }}>
              {sorted.map(currency => {
                const m = MACRO_CONTEXT[currency];
                const cyc = CYCLE_CONFIG[m.cycle] || { label: m.cycle, color: "#7a9ab0", icon: "→" };
                const score = scores[currency] || 50;
                const signal = getSignal(score);
                return (
                  <div key={currency} style={{ background: "#070d16", border: `1px solid ${cyc.color}22`, borderRadius: "3px", padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "18px", fontWeight: "bold" }}>{currency}</span>
                        <div style={{ background: cyc.color + "18", border: `1px solid ${cyc.color}33`, borderRadius: "2px", padding: "2px 7px" }}>
                          <span style={{ color: cyc.color, fontSize: "8px" }}>{cyc.icon} {cyc.label}</span>
                        </div>
                      </div>
                      <span style={{ color: signal.color, fontSize: "14px", fontWeight: "bold" }}>{score}</span>
                    </div>

                    {/* Cycle indicators */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                      <div style={{ background: "#040810", padding: "6px", borderRadius: "2px" }}>
                        <div style={{ fontSize: "7px", color: "#1a3a55", marginBottom: "2px" }}>PMI COMPOSITE</div>
                        <div style={{ fontSize: "14px", color: PMI_COLOR(m.pmi.composite || (m.pmi.manufacturing * 0.3 + m.pmi.services * 0.7)) }}>
                          {m.pmi.composite || ((m.pmi.manufacturing * 0.3 + m.pmi.services * 0.7)).toFixed(1)}
                        </div>
                        <div style={{ fontSize: "7px", color: "#1a3a55" }}>{m.pmi.trend}</div>
                      </div>
                      <div style={{ background: "#040810", padding: "6px", borderRadius: "2px" }}>
                        <div style={{ fontSize: "7px", color: "#1a3a55", marginBottom: "2px" }}>NEZAPOSLENOST</div>
                        <div style={{ fontSize: "14px", color: UR_COLOR(m.labor.unemployment) }}>{m.labor.unemployment}%</div>
                        <div style={{ fontSize: "7px", color: "#1a3a55" }}>{m.labor.trend}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: "9px", color: "#5a7a90", lineHeight: "1.6", borderTop: "1px solid #09182a", paddingTop: "7px" }}>
                      {m.cycle_note}
                    </div>

                    <button onClick={() => askAI(`Objasni ekonomski ciklus za ${currency}. Ciklus: ${m.cycle}. PMI composite: ${m.pmi.composite || 'n/a'}, UR: ${m.labor.unemployment}%, cb_tone: ${m.cb_tone}. Što to znači za forex trader?`)}
                      style={{ marginTop: "8px", background: "none", border: "1px solid #1a3a55", borderRadius: "2px", padding: "4px 10px", color: "#2a5a7a", fontSize: "8px", fontFamily: "inherit", cursor: "pointer", width: "100%", letterSpacing: "1px" }}>
                      → AI ANALIZA CIKLUSA
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ LABOR MARKET ═══ */}
        {activeTab === "labor" && (
          <div>
            <div style={{ color: "#1a3a55", fontSize: "8px", marginBottom: "14px", letterSpacing: "1px" }}>
              COINCIDENT INDICATORS — NFP (US specifično) · ADP · UR · Wage growth · Labour force participation
            </div>

            {/* US special card — most data */}
            <div style={{ background: "#0a0810", border: "1px solid #ff444422", borderLeft: "3px solid #ff4444", borderRadius: "0 3px 3px 0", padding: "14px", marginBottom: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontSize: "16px", fontWeight: "bold" }}>USD</span>
                  <span style={{ color: "#ff4444", fontSize: "8px", marginLeft: "10px", letterSpacing: "1px" }}>⚠ ŠOKANTNI NFP PODACI (6.3.2026.)</span>
                </div>
                <span style={{ color: "#ff4444", fontSize: "8px" }}>labor: deteriorating</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "10px" }}>
                {[
                  { l: "NFP Feb", v: "-92K", note: "vs +50K exp", c: "#cc2222" },
                  { l: "NFP Jan (rev)", v: "+126K", note: "rev dolje s 130K", c: "#7a9ab0" },
                  { l: "ADP Feb", v: "+63K", note: "beat! vs 50K exp", c: "#44cc77" },
                  { l: "UR Feb", v: "4.4%", note: "↑ od 4.3% (jan)", c: "#ff8844" },
                  { l: "U-6", v: "7.9%", note: "šira nezaposlenost", c: "#ff8844" },
                  { l: "PLAĆE YoY", v: "3.8%", note: "↑ inflatorno", c: "#ffaa22" },
                  { l: "PARTICIPACIJA", v: "62.0%", note: "4-god. minimum!", c: "#cc2222" },
                  { l: "DUGOTR.NEZ.", v: "25.7tj", note: "max od XII 2021", c: "#cc2222" },
                ].map(item => (
                  <div key={item.l} style={{ background: "#040810", padding: "8px", borderRadius: "2px" }}>
                    <div style={{ fontSize: "7px", color: "#1a3a55" }}>{item.l}</div>
                    <div style={{ fontSize: "14px", color: item.c, fontWeight: "bold" }}>{item.v}</div>
                    <div style={{ fontSize: "7px", color: "#2a4a65" }}>{item.note}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: "9px", color: "#5a7a90", lineHeight: "1.6" }}>
                {MACRO_CONTEXT.USD.labor.notes}
              </div>
            </div>

            {/* All currencies labor table */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "9px" }}>
              {CURRENCIES.filter(c => c !== "USD").map(currency => {
                const m = MACRO_CONTEXT[currency];
                const lab = m.labor;
                return (
                  <div key={currency} style={{ background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "bold" }}>{currency}</span>
                      <span style={{ fontSize: "8px", color: lab.trend === "deteriorating" ? "#cc2222" : lab.trend === "tight_labor_market" ? "#00e87a" : lab.trend === "improving" ? "#44cc77" : "#7a9ab0", letterSpacing: "1px" }}>{lab.trend}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                      <div style={{ background: "#040810", padding: "6px", borderRadius: "2px", textAlign: "center" }}>
                        <div style={{ fontSize: "7px", color: "#1a3a55" }}>NEZAPOSLENOST</div>
                        <div style={{ fontSize: "14px", color: UR_COLOR(lab.unemployment), fontWeight: "bold" }}>{lab.unemployment}%</div>
                      </div>
                      <div style={{ background: "#040810", padding: "6px", borderRadius: "2px", textAlign: "center" }}>
                        <div style={{ fontSize: "7px", color: "#1a3a55" }}>PLAĆE YoY</div>
                        <div style={{ fontSize: "14px", color: lab.wage_growth > 4 ? "#ffaa22" : "#7aaabb" }}>{lab.wage_growth}%</div>
                      </div>
                      <div style={{ background: "#040810", padding: "6px", borderRadius: "2px", textAlign: "center" }}>
                        <div style={{ fontSize: "7px", color: "#1a3a55" }}>PARTICIPACIJA</div>
                        <div style={{ fontSize: "12px", color: "#7aaabb" }}>{lab.participation ? `${lab.participation}%` : "n/a"}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: "8px", color: "#2a4a65", lineHeight: "1.5" }}>{lab.notes}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ PMI ═══ */}
        {activeTab === "pmi" && (
          <div>
            <div style={{ color: "#1a3a55", fontSize: "8px", marginBottom: "14px", letterSpacing: "1px" }}>
              LEADING INDICATORS — PMI {">"} 50 = ekspanzija · PMI {"<"} 50 = kontrakcija | Podaci: veljača 2026.
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "9px" }}>
              {sorted.map(currency => {
                const m = MACRO_CONTEXT[currency];
                const pmi = m.pmi;
                const comp = pmi.composite || ((pmi.manufacturing * 0.3 + pmi.services * 0.7));
                return (
                  <div key={currency} style={{ background: "#070d16", border: `1px solid ${PMI_COLOR(comp)}22`, borderRadius: "3px", padding: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "bold" }}>{currency}</span>
                      <div style={{ background: PMI_COLOR(comp) + "18", border: `1px solid ${PMI_COLOR(comp)}33`, borderRadius: "2px", padding: "2px 8px" }}>
                        <span style={{ color: PMI_COLOR(comp), fontSize: "9px", letterSpacing: "1px" }}>{pmi.trend.toUpperCase().replace(/_/g, " ")}</span>
                      </div>
                    </div>

                    {/* PMI gauges */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "8px" }}>
                      {[
                        { l: "COMPOSITE", v: comp.toFixed(1) },
                        { l: "SERVICES", v: pmi.services },
                        { l: "MANUFACTURING", v: pmi.manufacturing },
                      ].map(({ l, v }) => (
                        <div key={l} style={{ background: "#040810", padding: "8px 4px", borderRadius: "2px", textAlign: "center" }}>
                          <div style={{ fontSize: "6px", color: "#1a3a55", marginBottom: "2px" }}>{l}</div>
                          <div style={{ fontSize: "16px", fontWeight: "bold", color: PMI_COLOR(parseFloat(v)) }}>{v}</div>
                          <div style={{ background: "#030710", height: "2px", borderRadius: "1px", marginTop: "4px" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, (parseFloat(v) - 40) * 5))}%`, background: PMI_COLOR(parseFloat(v)), borderRadius: "1px" }} />
                          </div>
                          <div style={{ fontSize: "7px", color: parseFloat(v) >= 50 ? "#00e87a" : "#cc2222", marginTop: "2px" }}>
                            {parseFloat(v) >= 50 ? "EKSPANZIJA" : "KONTRAKCIJA"}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Sub-indices */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", marginBottom: "7px" }}>
                      <div style={{ background: "#040810", padding: "4px 6px", borderRadius: "2px" }}>
                        <span style={{ fontSize: "7px", color: "#1a3a55" }}>CIJENE: </span>
                        <span style={{ fontSize: "10px", color: pmi.prices_index > 60 ? "#cc2222" : pmi.prices_index > 55 ? "#ff8844" : "#7aaabb", fontWeight: "bold" }}>{pmi.prices_index}</span>
                        {pmi.prices_index > 65 && <span style={{ fontSize: "7px", color: "#cc2222" }}> ⚠ INFLACIJA!</span>}
                      </div>
                      <div style={{ background: "#040810", padding: "4px 6px", borderRadius: "2px" }}>
                        <span style={{ fontSize: "7px", color: "#1a3a55" }}>EMPLOYMENT PMI: </span>
                        <span style={{ fontSize: "10px", color: PMI_COLOR(pmi.employment_pmi) }}>{pmi.employment_pmi}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: "8px", color: "#2a4a65", lineHeight: "1.5", borderTop: "1px solid #09182a", paddingTop: "7px" }}>
                      {pmi.notes}
                    </div>
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
              <div>
                <div style={{ color: "#1a3a55", fontSize: "8px", letterSpacing: "1px" }}>LIVE NEWS — Claude pretražuje web i računa utjecaj na valutne scoreove</div>
                {newsLastFetch && <div style={{ color: "#1a3a55", fontSize: "8px", marginTop: "2px" }}>Zadnji fetch: {newsLastFetch.toLocaleTimeString('hr-HR')}</div>}
              </div>
              <button onClick={fetchLiveNews} disabled={newsLoading} style={{ background: newsLoading ? "#070d16" : "#00e87a18", border: `1px solid ${newsLoading ? "#0c1c2c" : "#00e87a44"}`, borderRadius: "3px", padding: "8px 16px", color: newsLoading ? "#1e3a55" : "#00e87a", fontFamily: "inherit", fontSize: "9px", letterSpacing: "2px", cursor: newsLoading ? "wait" : "pointer" }}>
                {newsLoading ? "⟳ DOHVAĆAM..." : "↻ OSVJEŽI VIJESTI"}
              </button>
            </div>

            {/* Overall sentiment bar */}
            {newsAnalysis && (
              <div style={{ background: "#070d16", border: `1px solid ${newsAnalysis.overall_sentiment === "risk_off" ? "#ff444433" : newsAnalysis.overall_sentiment === "risk_on" ? "#00e87a33" : "#1a3a5533"}`, borderRadius: "3px", padding: "12px 14px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "8px", color: "#1a3a55", letterSpacing: "1px", marginBottom: "3px" }}>TRŽIŠNI SENTIMENT</div>
                  <div style={{ fontSize: "13px", color: newsAnalysis.overall_sentiment === "risk_off" ? "#ff4444" : newsAnalysis.overall_sentiment === "risk_on" ? "#00e87a" : "#7a9ab0", fontWeight: "bold", letterSpacing: "2px" }}>
                    {newsAnalysis.overall_sentiment === "risk_off" ? "⚠ RISK OFF" : newsAnalysis.overall_sentiment === "risk_on" ? "▲ RISK ON" : "→ NEUTRALNO"}
                  </div>
                  <div style={{ fontSize: "9px", color: "#4a7a90", marginTop: "4px" }}>{newsAnalysis.key_theme}</div>
                </div>
                {/* Live adjustments summary */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {Object.entries(liveAdjustments).filter(([,v]) => v !== 0).sort((a,b) => b[1]-a[1]).map(([cur, adj]) => (
                    <div key={cur} style={{ background: adj > 0 ? "#00e87a15" : "#ff444415", border: `1px solid ${adj > 0 ? "#00e87a33" : "#ff444433"}`, borderRadius: "2px", padding: "3px 7px", textAlign: "center" }}>
                      <div style={{ fontSize: "9px", fontWeight: "bold", color: adj > 0 ? "#00e87a" : "#ff4444" }}>{cur}</div>
                      <div style={{ fontSize: "9px", color: adj > 0 ? "#00e87a" : "#ff4444" }}>{adj > 0 ? "+" : ""}{adj}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* News loading state */}
            {newsLoading && (
              <div style={{ background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "40px", textAlign: "center" }}>
                <div style={{ color: "#00e87a", fontSize: "10px", marginBottom: "8px", animation: "pulse 1s infinite" }}>⟳ Claude pretražuje web za zadnje vijesti...</div>
                <div style={{ color: "#1a3a55", fontSize: "8px" }}>Tražim: Iran, Fed, ECB, BoJ, geopolitika, macro podaci</div>
              </div>
            )}

            {/* No news yet */}
            {!newsLoading && newsItems.length === 0 && (
              <div style={{ background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "40px", textAlign: "center" }}>
                <div style={{ color: "#0c1c2c", fontSize: "10px", marginBottom: "8px" }}>◆</div>
                <div style={{ color: "#1a3a55", fontSize: "9px", letterSpacing: "1px", marginBottom: "16px" }}>Pritisni "OSVJEŽI VIJESTI" — Claude će pretražiti web i analizirati utjecaj na valute</div>
                <button onClick={fetchLiveNews} style={{ background: "#00e87a18", border: "1px solid #00e87a44", borderRadius: "3px", padding: "10px 20px", color: "#00e87a", fontFamily: "inherit", fontSize: "10px", letterSpacing: "2px", cursor: "pointer" }}>
                  ↻ DOHVATI LIVE VIJESTI
                </button>
              </div>
            )}

            {/* News cards */}
            {!newsLoading && newsItems.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                {newsItems.map((item, i) => {
                  const sc = item.severity === "critical" ? "#ff2244" : item.severity === "high" ? "#ff7733" : item.severity === "medium" ? "#ffcc33" : "#4488aa";
                  const impactColor = item.impact === "bullish" ? "#00e87a" : item.impact === "bearish" ? "#ff4444" : "#7a9ab0";
                  return (
                    <div key={i} style={{ background: "#070d16", border: "1px solid #0c1c2c", borderLeft: `3px solid ${sc}`, borderRadius: "0 3px 3px 0", padding: "13px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                        <div style={{ fontSize: "11px", color: "#c0d8e8", fontWeight: "bold", flex: 1 }}>{item.headline}</div>
                        <div style={{ display: "flex", gap: "5px", flexShrink: 0 }}>
                          <span style={{ background: sc + "20", border: `1px solid ${sc}40`, borderRadius: "2px", padding: "1px 5px", fontSize: "7px", color: sc, letterSpacing: "1px" }}>{item.severity?.toUpperCase()}</span>
                          <span style={{ background: impactColor + "18", border: `1px solid ${impactColor}33`, borderRadius: "2px", padding: "1px 5px", fontSize: "7px", color: impactColor, letterSpacing: "1px" }}>{item.impact?.toUpperCase()}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: "9px", color: "#4a7a90", lineHeight: "1.5", marginBottom: "8px" }}>{item.summary}</div>
                      <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "6px" }}>
                        {item.currencies_up?.map(c => <span key={c} style={{ background: "#00e87a15", border: "1px solid #00e87a30", borderRadius: "2px", padding: "1px 6px", fontSize: "8px", color: "#00e87a", fontWeight: "bold" }}>↑ {c}</span>)}
                        {item.currencies_down?.map(c => <span key={c} style={{ background: "#ff444415", border: "1px solid #ff444430", borderRadius: "2px", padding: "1px 6px", fontSize: "8px", color: "#ff4444", fontWeight: "bold" }}>↓ {c}</span>)}
                      </div>
                      {item.score_adjustments && Object.keys(item.score_adjustments).length > 0 && (
                        <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "7px", color: "#1a3a55", alignSelf: "center" }}>SCORE ADJ:</span>
                          {Object.entries(item.score_adjustments).map(([cur, adj]) => (
                            <span key={cur} style={{ fontSize: "8px", color: adj > 0 ? "#00e87a" : "#ff4444" }}>{cur} {adj > 0 ? "+" : ""}{adj}</span>
                          ))}
                        </div>
                      )}
                      {item.source_hint && <div style={{ fontSize: "7px", color: "#1a3a55", marginTop: "5px" }}>Izvor: {item.source_hint}</div>}
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
            <div style={{ color: "#1a3a55", fontSize: "8px", marginBottom: "14px", letterSpacing: "1px" }}>KLIKNI PAR → AI ANALIZA (PMI + LABOR + CYCLE + GEO)</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "9px" }}>
              {FOREX_PAIRS.map(pair => {
                const sig = getPairSignal(pair.base, pair.quote, scores);
                const bm = MACRO_CONTEXT[pair.base];
                const qm = MACRO_CONTEXT[pair.quote];
                const bcyc = CYCLE_CONFIG[bm.cycle] || { color: "#7a9ab0", icon: "→" };
                const qcyc = CYCLE_CONFIG[qm.cycle] || { color: "#7a9ab0", icon: "→" };
                return (
                  <div key={pair.pair} onClick={() => handlePairClick(pair)}
                    style={{ background: "#070d16", border: `1px solid ${sig.color}22`, borderRadius: "3px", padding: "14px", cursor: "pointer", transition: "border-color 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = sig.color + "55"}
                    onMouseLeave={e => e.currentTarget.style.borderColor = sig.color + "22"}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "bold" }}>{pair.pair}</span>
                      <div style={{ background: sig.color + "15", border: `1px solid ${sig.color}33`, borderRadius: "2px", padding: "2px 6px", color: sig.color, fontSize: "8px", fontWeight: "bold", letterSpacing: "1px" }}>{sig.label}</div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <div>
                        <div style={{ fontSize: "8px", color: "#1e3a55" }}>{pair.base}</div>
                        <div style={{ fontSize: "18px", color: getSignal(scores[pair.base] || 50).color }}>{scores[pair.base] || 50}</div>
                        <div style={{ fontSize: "7px", color: bcyc.color }}>{bcyc.icon} {bm.cycle.replace(/_/g, " ")}</div>
                      </div>
                      <div style={{ color: "#0a1c2c", fontSize: "14px", alignSelf: "center" }}>↔</div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "8px", color: "#1e3a55" }}>{pair.quote}</div>
                        <div style={{ fontSize: "18px", color: getSignal(scores[pair.quote] || 50).color }}>{scores[pair.quote] || 50}</div>
                        <div style={{ fontSize: "7px", color: qcyc.color }}>{qcyc.icon} {qm.cycle.replace(/_/g, " ")}</div>
                      </div>
                    </div>
                    <div style={{ background: "#040810", borderRadius: "2px", padding: "5px", display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                      <span style={{ fontSize: "8px", color: "#1e3a55" }}>CONF: <span style={{ color: sig.color, fontWeight: "bold" }}>{sig.confidence}%</span></span>
                      <span style={{ fontSize: "8px", color: "#1e3a55" }}>DIFF: <span style={{ color: sig.diff >= 0 ? "#00e87a" : "#e85544" }}>{sig.diff >= 0 ? "+" : ""}{sig.diff}</span></span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                      {[pair.base, pair.quote].map(c => {
                        const pm = MACRO_CONTEXT[c].pmi;
                        const lm = MACRO_CONTEXT[c].labor;
                        return (
                          <div key={c} style={{ background: "#040810", padding: "4px", borderRadius: "2px" }}>
                            <div style={{ fontSize: "7px", color: "#1a3a55" }}>{c}: PMI {pm.services} svc</div>
                            <div style={{ fontSize: "7px", color: "#1a3a55" }}>UR {lm.unemployment}% · {lm.trend.split("_")[0]}</div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ fontSize: "7px", color: "#0f2235", textAlign: "center", marginTop: "7px" }}>→ klikni za AI analizu</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ AI ═══ */}
        {activeTab === "ai" && (
          <div>
            <div style={{ color: "#1a3a55", fontSize: "8px", marginBottom: "12px", letterSpacing: "1px" }}>AI ANALIZA · PMI + LABOR + CYCLE FRAMEWORK · KONTEKST: 12.3.2026.</div>
            <div style={{ display: "flex", gap: "7px", marginBottom: "10px" }}>
              <input value={aiQuery} onChange={e => setAiQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && aiQuery.trim() && askAI(aiQuery)}
                placeholder="npr. Koji ciklus favorizira JPY dugoročno? Zašto je NFP -92K bearish za USD?"
                style={{ flex: 1, background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "9px 12px", color: "#dde8f0", fontFamily: "inherit", fontSize: "10px", outline: "none" }} />
              <button onClick={() => aiQuery.trim() && askAI(aiQuery)} disabled={aiLoading}
                style={{ background: aiLoading ? "#070d16" : "#00e87a15", border: `1px solid ${aiLoading ? "#0c1c2c" : "#00e87a33"}`, borderRadius: "3px", padding: "9px 14px", color: aiLoading ? "#1e3a55" : "#00e87a", fontFamily: "inherit", fontSize: "9px", letterSpacing: "2px", cursor: aiLoading ? "wait" : "pointer" }}>
                {aiLoading ? "ANALIZIRAM..." : "ANALIZIRAJ"}
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "14px" }}>
              {[
                "Koja valuta ima najjači ekonomski ciklus?",
                "NFP -92K + ISM services 56.1 — kako pomiriti?",
                "Japan vs USD — ciklus analiza",
                "NZD — zašto je PMI u kontrakciji?",
                "GBP stagflacija — buy ili sell?",
                "CAD: nafta bullish vs tarife bearish?",
                "Safe haven: CHF ili JPY u Iran šoku?",
              ].map(q => (
                <button key={q} onClick={() => { setAiQuery(q); askAI(q); }}
                  style={{ background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "2px", padding: "4px 8px", color: "#1e4a6a", fontSize: "8px", fontFamily: "inherit", cursor: "pointer", letterSpacing: "1px" }}>
                  {q}
                </button>
              ))}
            </div>
            {(aiLoading || aiResponse) && (
              <div style={{ background: "#070d16", border: "1px solid #00e87a18", borderLeft: "3px solid #00e87a", borderRadius: "0 3px 3px 0", padding: "16px" }}>
                <div style={{ fontSize: "7px", color: "#00e87a", letterSpacing: "2px", marginBottom: "9px" }}>◆ AI ANALIZA · PMI + LABOR + CYCLE · 12. OŽUJKA 2026.</div>
                {aiLoading
                  ? <div style={{ color: "#1e3a55", fontSize: "10px" }}>Analiziram PMI, tržište rada, ekonomske cikluse i geopolitiku... <span style={{ animation: "blink 1s infinite" }}>█</span></div>
                  : <div style={{ color: "#a8c8e0", fontSize: "12px", lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{aiResponse}</div>}
              </div>
            )}
            {!aiLoading && !aiResponse && (
              <div style={{ background: "#070d16", border: "1px solid #0c1c2c", borderRadius: "3px", padding: "40px", textAlign: "center", color: "#0c1c2c" }}>
                <div style={{ fontSize: "10px", marginBottom: "5px" }}>◆</div>
                <div style={{ fontSize: "8px", letterSpacing: "2px" }}>UNESI UPIT ILI KLIKNI PAR / BRZO PITANJE</div>
              </div>
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
