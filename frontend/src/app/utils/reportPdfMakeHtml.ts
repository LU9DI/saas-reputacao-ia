import type { ClientReportPayload } from './reportPdfClient';
import {
  esc, pct, planDisplayName, depthOf, planHero, features,
  sectionLabels, distOf, LOGO_SVG,
} from './reportPdfHelpers';

export function makeHtml(p: ClientReportPayload): string {
  const lang = String(p.lang || 'pt');
  const rawPlan = p.plan || 'trial';
  const depth = depthOf(rawPlan);
  const displayName = planDisplayName(rawPlan, lang);
  const hero = planHero(depth, lang, displayName);
  const feats = features(depth, lang);
  const L = sectionLabels(lang);
  const s = p.stats;
  const total = s.ratedCount || s.total || 0;
  const avg = s.average ? s.average.toFixed(1) : '—';
  const dist = distOf(p);
  const maxD = Math.max(...dist, 1);
  const showSent = depth !== 'pro';
  const showThemes = depth !== 'pro';
  const showRanking = depth === 'corp' || depth === 'rei';
  const showRei = depth === 'rei';
  const company = String(p.companyName || '').trim() || 'Empresa';
  const footerLine = L.footer.replace('{{plan}}', displayName).replace('{{company}}', company);
  const rights = p.labels.rights || L.rights;
  const now = new Date();
  const genLabel =
    lang === 'en'
      ? `Generated ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC · Confidential`
      : `Gerado em ${now.toISOString().slice(0, 16).replace('T', ' ')} UTC · Confidencial`;
  const tierClass =
    depth === 'rei' ? 'tier-rei' : depth === 'corp' ? 'tier-corp' : depth === 'ultra' ? 'tier-ultra' : 'tier-pro';
  const tierLabel =
    depth === 'rei'
      ? (lang === 'en' ? 'Premium executive tier' : lang === 'es' ? 'Nivel ejecutivo premium' : 'Nível executivo premium')
      : depth === 'corp'
        ? (lang === 'en' ? 'Multi-unit tier' : lang === 'es' ? 'Nivel multiunidad' : 'Nível multi-unidade')
        : depth === 'ultra'
          ? (lang === 'en' ? 'AI analytics tier' : lang === 'es' ? 'Nivel con análisis IA' : 'Nível com análise de IA')
          : (lang === 'en' ? 'Essential tier' : lang === 'es' ? 'Nivel esencial' : 'Nível essencial');
  const includedCount = feats.included.length;
  const countLabel =
    lang === 'en'
      ? `${includedCount} benefits included`
      : lang === 'es'
        ? `${includedCount} beneficios incluidos`
        : lang === 'zh'
          ? `含 ${includedCount} 项权益`
          : `${includedCount} benefícios inclusos`;

  const bars = dist
    .map((v, i) => {
      const w = Math.max(v > 0 ? 4 : 0, Math.round((v / maxD) * 100));
      const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
      return `<div class="bar-row"><span class="star">${i + 1}★</span><div class="track"><div class="fill" style="width:${w}%;background:${colors[i]}"></div></div><span class="cnt">${v}</span></div>`;
    })
    .join('');

  const benIn = feats.included
    .map((x) => {
      const premium = x.min === 'ultra' || x.min === 'corp' || x.min === 'rei';
      const elite = x.min === 'corp' || x.min === 'rei';
      const cls = elite ? 'feat elite' : premium ? 'feat premium' : 'feat';
      const badge =
        x.min === 'rei'
          ? '<span class="tag tag-rei">REI</span>'
          : x.min === 'corp'
            ? '<span class="tag tag-corp">CORP</span>'
            : x.min === 'ultra'
              ? '<span class="tag tag-ultra">ULTRA</span>'
              : '';
      return `<li class="${cls}"><span class="ok">✓</span><span class="feat-text">${esc(x.label)}</span>${badge}</li>`;
    })
    .join('');

  const benOut = feats.locked.length
    ? feats.locked
        .map((x) => {
          const badge =
            x.min === 'rei'
              ? '<span class="tag tag-muted">REI</span>'
              : x.min === 'corp'
                ? '<span class="tag tag-muted">CORP</span>'
                : x.min === 'ultra'
                  ? '<span class="tag tag-muted">ULTRA</span>'
                  : '';
          return `<li class="feat locked"><span class="no">○</span><span class="feat-text">${esc(x.label)}</span>${badge}</li>`;
        })
        .join('')
    : '<li class="feat"><span class="ok">✓</span><span class="feat-text">—</span></li>';

  const themesHtml =
    s.themes && s.themes.length
      ? s.themes.map((t) => `<div class="theme">• ${esc(t.name)} <b>(${t.count})</b></div>`).join('')
      : `<div class="themes-empty">${esc(L.themesEmpty)}</div>`;

  const sentTotal = s.sentiment.positivo + s.sentiment.neutro + s.sentiment.negativo || 1;
  const donutNote = `Participação: +${pct(s.sentiment.positivo, sentTotal)} · ~${pct(s.sentiment.neutro, sentTotal)} · −${pct(s.sentiment.negativo, sentTotal)}`;

  const bottleneckHtml =
    s.themes && s.themes.length
      ? s.themes
          .slice(0, 4)
          .map((t, i) => {
            const w = Math.max(8, Math.round((t.count / (s.themes[0].count || 1)) * 100));
            return `<div class="bn-row"><span class="bn-n">${i + 1}</span><span class="bn-name">${esc(t.name)}</span><div class="track"><div class="fill bn" style="width:${w}%"></div></div><span class="cnt">${t.count}</span></div>`;
          })
          .join('')
      : `<div class="themes-empty">${esc(L.themesEmpty)}</div>`;

  const sentBlock = showSent
    ? `<h2 class="sec">${esc(L.sentiment)}</h2><section class="sent-grid">
  <div class="sent-card"><small class="g">${esc(p.labels.sentPos)}</small><b>${s.sentiment.positivo}</b><span>${pct(s.sentiment.positivo, total)}</span></div>
  <div class="sent-card"><small class="a">${esc(p.labels.sentNeu)}</small><b>${s.sentiment.neutro}</b><span>${pct(s.sentiment.neutro, total)}</span></div>
  <div class="sent-card"><small class="r">${esc(p.labels.sentNeg)}</small><b>${s.sentiment.negativo}</b><span>${pct(s.sentiment.negativo, total)}</span></div>
</section>`
    : '';

  const themesBlock = showThemes ? `<h2 class="sec">${esc(L.themes)}</h2><div class="themes-box">${themesHtml}</div>` : '';
  const rankingBlock = showRanking
    ? `<h2 class="sec">${esc(L.ranking)}</h2><div class="themes-box"><div class="themes-empty">${esc(L.rankingEmpty)}</div></div>`
    : '';
  const reiBlock = showRei
    ? `<h2 class="sec">${esc(L.executive)}</h2><section class="sent-grid">
  <div class="sent-card"><small class="g">${esc(p.labels.sentPos)}</small><b>${pct(s.sentiment.positivo, sentTotal)}</b><span>${s.sentiment.positivo}</span></div>
  <div class="sent-card"><small class="a">${esc(p.labels.sentNeu)}</small><b>${pct(s.sentiment.neutro, sentTotal)}</b><span>${s.sentiment.neutro}</span></div>
  <div class="sent-card"><small class="r">${esc(p.labels.sentNeg)}</small><b>${pct(s.sentiment.negativo, sentTotal)}</b><span>${s.sentiment.negativo}</span></div>
</section><p class="donut-note">${esc(donutNote)}</p>
<h2 class="sec">${esc(L.bottlenecks)}</h2><div class="themes-box">${bottleneckHtml}</div>`
    : '';

  return `<main class="report">
  <div class="watermark">FILTRA.AI · ${esc(displayName.toUpperCase())}</div>
  <div class="hero">
    <div class="brand-row"><span class="logo-wrap">${LOGO_SVG}</span><span class="brand">Filtra.AI</span></div>
    <div class="plan-title">${esc(hero.title)}</div>
    <div class="plan-sub">${esc(hero.subtitle)}</div>
    <div class="hero-meta">
      <div class="company">${esc(company)}</div>
      <div class="cycle">${esc(p.periodLabel)} · ${esc(L.planLine)}: <strong>${esc(displayName)}</strong></div>
      <span class="badge-plan">${esc(displayName)}</span>
    </div>
  </div>
  <section class="benefits ${tierClass}">
    <div class="ben-head">
      <div class="ben-head-left">
        <span class="ben-title">${esc(L.benefitsTier)}</span>
        <span class="ben-count">${esc(countLabel)}</span>
      </div>
      <span class="ben-tier">${esc(tierLabel)}</span>
    </div>
    <div class="ben-grid">
      <div class="ben in"><h3>${esc(L.benefitsIn)}</h3><ul>${benIn}</ul></div>
      <div class="ben out"><h3>${esc(L.benefitsOut)}</h3><ul>${benOut}</ul></div>
    </div>
  </section>
  <h2 class="sec">${esc(L.summary)}</h2>
  <section class="kpis">
    <div class="kpi"><small>${esc(L.volume)}</small><b>${s.total}</b><span>${esc(L.volumeSub)}</span></div>
    <div class="kpi"><small>${esc(L.avg)}</small><b>${esc(avg)}</b><span>${esc(L.avgSub)}</span></div>
    <div class="kpi"><small>${esc(L.positive)}</small><b class="g">${s.positive}</b><span>${pct(s.positive, total)} · ${esc(L.positiveSub)}</span></div>
    <div class="kpi"><small>${esc(L.critical)}</small><b class="r">${s.critical}</b><span>${pct(s.critical, total)} · ${esc(L.criticalSub)}</span></div>
  </section>
  <h2 class="sec">${esc(L.dist)}</h2>
  <section class="bars">${bars}</section>
  ${sentBlock}${themesBlock}${rankingBlock}${reiBlock}
  <footer>
    <div class="foot-main">${esc(footerLine)}</div>
    <div class="foot-rights">${esc(rights)}</div>
    <div class="foot-gen">${esc(genLabel)}</div>
  </footer>
  <style>
    @page{size:A4;margin:0}*{box-sizing:border-box}
    body{margin:0;font-family:"Segoe UI",system-ui,-apple-system,Arial,Helvetica,sans-serif;color:#0f172a;-webkit-font-smoothing:antialiased}
    .report{position:relative;display:flex;flex-direction:column;width:794px;min-height:1123px;padding:32px 44px 28px;background:linear-gradient(180deg,#f8fafc 0%,#fff 120px);overflow:hidden}
    .watermark{position:absolute;top:46%;left:50%;width:680px;margin-left:-340px;text-align:center;transform:rotate(-28deg);font-size:40px;font-weight:800;letter-spacing:4px;color:#1e3a8a;opacity:.04;pointer-events:none;z-index:0}
    .hero{position:relative;z-index:1;background:linear-gradient(135deg,#1d4ed8 0%,#2563eb 45%,#3b82f6 100%);border-radius:16px;padding:20px 24px 18px;color:#fff;margin-bottom:18px;box-shadow:0 10px 28px rgba(37,99,235,.28);border:1px solid rgba(255,255,255,.12)}
    .brand-row{display:flex;align-items:center;gap:12px;margin-bottom:10px}
    .logo-wrap{display:inline-flex;width:40px;height:40px;border-radius:11px;overflow:hidden;flex-shrink:0;box-shadow:0 4px 12px rgba(15,23,42,.35);background:#05050a;border:1px solid rgba(255,255,255,.15)}
    .logo-wrap svg{display:block;width:40px;height:40px}
    .hero .brand{font-size:14px;font-weight:800;color:#fff;letter-spacing:.4px}
    .hero .plan-title{font-size:24px;font-weight:800;line-height:1.15;letter-spacing:-.02em}
    .hero .plan-sub{font-size:11.5px;color:#dbeafe;margin-top:6px;line-height:1.4;max-width:620px}
    .hero-meta{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px;margin-top:14px}
    .company{font-size:13px;font-weight:700}
    .cycle{font-size:11px;color:#dbeafe}
    .badge-plan{background:rgba(255,255,255,.18);border:1px solid rgba(255,255,255,.28);border-radius:999px;padding:3px 10px;font-size:10px;font-weight:800;letter-spacing:.04em}
    .benefits{position:relative;z-index:1;margin-bottom:16px}
    .ben-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:10px}
    .ben-title{font-size:12px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:.04em}
    .ben-count{font-size:10px;color:#64748b;font-weight:600}
    .ben-tier{font-size:10px;font-weight:700;color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;padding:3px 10px}
    .ben-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .ben{border:1px solid #e2e8f0;border-radius:14px;padding:12px 14px;background:#fff}
    .ben h3{margin:0 0 8px;font-size:11px;font-weight:800;color:#334155}
    .ben ul{list-style:none;margin:0;padding:0}
    .feat{display:flex;align-items:flex-start;gap:8px;margin:0 0 7px;font-size:11px;line-height:1.35;color:#1e293b}
    .feat .ok{color:#16a34a;font-weight:800}
    .feat .no{color:#94a3b8}
    .feat.locked{color:#94a3b8}
    .feat-text{flex:1}
    .tag{font-size:8px;font-weight:800;border-radius:4px;padding:1px 5px;letter-spacing:.03em}
    .tag-ultra{background:#ede9fe;color:#6d28d9}
    .tag-corp{background:#e0e7ff;color:#3730a3}
    .tag-rei{background:#fef3c7;color:#b45309}
    .tag-muted{background:#f1f5f9;color:#94a3b8}
    .sec{position:relative;z-index:1;font-size:12px;font-weight:800;color:#0f172a;margin:16px 0 10px;text-transform:uppercase;letter-spacing:.04em}
    .kpis{position:relative;z-index:1;display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:4px}
    .kpi{border:1px solid #e2e8f0;border-radius:14px;padding:12px;background:#fff;text-align:center}
    .kpi small{display:block;font-size:9px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:.04em}
    .kpi b{display:block;font-size:22px;margin:4px 0 2px;color:#0f172a}
    .kpi span{font-size:10px;color:#64748b}
    .kpi .g{color:#16a34a}.kpi .r{color:#dc2626}
    .bars{position:relative;z-index:1;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;background:#fff}
    .bar-row{display:grid;grid-template-columns:28px 1fr 28px;gap:8px;align-items:center;margin-bottom:7px;font-size:11px}
    .star{color:#64748b;font-weight:700}.cnt{text-align:right;color:#64748b;font-weight:700}
    .track{height:8px;background:#f1f5f9;border-radius:999px;overflow:hidden}
    .fill{height:100%;border-radius:999px}.fill.bn{background:#2563eb}
    .sent-grid{position:relative;z-index:1;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
    .sent-card{border:1px solid #e2e8f0;border-radius:14px;padding:12px;background:#fff;text-align:center}
    .sent-card small{display:block;font-size:9px;font-weight:800;text-transform:uppercase}
    .sent-card small.g{color:#16a34a}.sent-card small.a{color:#d97706}.sent-card small.r{color:#dc2626}
    .sent-card b{display:block;font-size:20px;margin:4px 0}.sent-card span{font-size:10px;color:#64748b}
    .themes-box{position:relative;z-index:1;border:1px solid #e2e8f0;border-radius:14px;padding:14px 16px;background:#fff;min-height:44px}
    .theme{font-size:11.5px;color:#1e293b;margin-bottom:6px;line-height:1.35}.theme b{color:#64748b;font-weight:700}
    .themes-empty{font-size:10.5px;color:#64748b;line-height:1.5}
    .donut-note{position:relative;z-index:1;font-size:10.5px;color:#475569;margin:0 0 10px;font-weight:600}
    .bn-row{display:grid;grid-template-columns:24px minmax(80px,1.1fr) 1fr 32px;gap:8px;align-items:center;margin-bottom:8px;font-size:11.5px}
    .bn-n{width:20px;height:20px;line-height:20px;text-align:center;border-radius:50%;background:#2563eb;color:#fff;font-size:10px;font-weight:800}
    .bn-name{color:#1e293b;font-weight:600}
    footer{margin-top:auto;position:relative;width:100%;border-top:1px solid #e2e8f0;padding:14px 0 0;text-align:center;z-index:1}
    .foot-main{font-size:9.5px;color:#475569;font-weight:600;line-height:1.35}
    .foot-rights{font-size:8px;color:#94a3b8;margin-top:4px;line-height:1.35}
    .foot-gen{font-size:7.5px;color:#cbd5e1;margin-top:3px;line-height:1.35}
  </style>
</main>`;
}
