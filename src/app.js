import "./styles.css";

const PAGE_SIZE = 24;

const state = {
  records: [], summary: null, analysis: null, enrichment: new Map(), filtered: [],
  visibleCount: PAGE_SIZE, query: "", kind: "all", year: "all", yearRange: null,
  semester: "all", topic: "all", entity: "all", sort: "newest",
};

const elements = {
  form: document.querySelector("#filter-form"), search: document.querySelector("#search"),
  kind: document.querySelector("#kind"), year: document.querySelector("#year"),
  semester: document.querySelector("#semester"), topic: document.querySelector("#topic"),
  sort: document.querySelector("#sort"), timeline: document.querySelector("#timeline"),
  balanceSummary: document.querySelector("#balance-summary"), topicBars: document.querySelector("#topic-bars"),
  entityList: document.querySelector("#entity-list"), recordList: document.querySelector("#record-list"),
  resultCount: document.querySelector("#result-count"), status: document.querySelector("#status-message"),
  loadMore: document.querySelector("#load-more"), totalRecords: document.querySelector("#total-records"),
  totalDarts: document.querySelector("#total-darts"), totalPats: document.querySelector("#total-pats"),
  totalIssues: document.querySelector("#total-issues"), activeScope: document.querySelector("#active-scope"),
  studentView: document.querySelector("#student-view"), alumniYear: document.querySelector("#alumni-year"),
  alumniView: document.querySelector("#alumni-view"), methodNote: document.querySelector("#method-note"),
  coverageNote: document.querySelector("#coverage-note"),
};

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function formatNumber(value) { return new Intl.NumberFormat("en-US").format(value); }
function formatPercent(value, digits = 1) {
  return new Intl.NumberFormat("en-US", { style: "percent", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}
function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}
function normalize(value = "") { return String(value).toLowerCase().normalize("NFKD"); }
function topicMetadata(topicId) {
  return state.analysis.topics.find((topic) => topic.id === topicId) || { id: "unclassified", label: "Unclassified" };
}
function searchBlob(record) {
  const annotation = record._analysis;
  const entityNames = annotation.entities.map((entity) => entity.name);
  const topicNames = [annotation.primaryTopic, ...annotation.secondaryTopics].map((topicId) => topicMetadata(topicId).label);
  return normalize([record.text, record.target, record.sender, record.sourcePdf, ...entityNames, ...topicNames].filter(Boolean).join(" "));
}

function renderSummary() {
  const counts = state.summary.kindCounts;
  elements.totalRecords.textContent = formatNumber(state.summary.recordCount);
  elements.totalDarts.textContent = formatNumber(counts.DART || 0);
  elements.totalPats.textContent = formatNumber(counts.PAT || 0);
  elements.totalIssues.textContent = formatNumber(state.summary.issues.length);
}

function populateControls() {
  const yearOptions = state.summary.years.slice().reverse().map((year) => `<option value="${year.key}">${year.key}</option>`).join("");
  elements.year.insertAdjacentHTML("beforeend", yearOptions);
  elements.alumniYear.innerHTML = yearOptions;
  elements.alumniYear.value = state.summary.years.some((item) => item.key === 2000) ? "2000" : String(state.summary.years.at(-1).key);
  const topicOptions = state.analysis.topics.filter((topic) => topic.id !== "unclassified")
    .sort((a, b) => a.label.localeCompare(b.label))
    .map((topic) => `<option value="${topic.id}">${escapeHtml(topic.label)}</option>`).join("");
  elements.topic.insertAdjacentHTML("beforeend", `${topicOptions}<option value="unclassified">Unclassified</option>`);
}

function baseScope(record, ignored = new Set()) {
  const query = normalize(state.query).trim();
  const inRange = !state.yearRange || (record.year >= state.yearRange[0] && record.year <= state.yearRange[1]);
  const hasEntity = state.entity === "all" || record._analysis.entities.some((entity) => entity.name === state.entity);
  return (ignored.has("query") || !query || record._search.includes(query))
    && (ignored.has("kind") || state.kind === "all" || record.kind === state.kind)
    && (ignored.has("year") || state.year === "all" || String(record.year) === state.year)
    && (ignored.has("yearRange") || inRange)
    && (ignored.has("semester") || state.semester === "all" || record.semester === state.semester)
    && (ignored.has("topic") || state.topic === "all" || record._analysis.primaryTopic === state.topic)
    && (ignored.has("entity") || hasEntity);
}

function patShare(records) {
  const darts = records.filter((record) => record.kind === "DART").length;
  const pats = records.filter((record) => record.kind === "PAT").length;
  return { darts, pats, total: darts + pats, share: darts + pats ? pats / (darts + pats) : null };
}

function renderTimeline() {
  const scopedRecords = state.records.filter((record) => baseScope(record, new Set(["kind", "year", "yearRange"])));
  const overall = patShare(scopedRecords);
  const yearCounts = new Map(state.summary.years.map(({ key }) => [key, scopedRecords.filter((record) => record.year === key).length]));
  const maxCount = Math.max(1, ...yearCounts.values());
  const issueBalance = state.analysis.editorialBalance;
  elements.balanceSummary.innerHTML = overall.share === null
    ? "No classified Darts or Pats match this analytical scope."
    : `<strong>${formatPercent(overall.share)}</strong> Pats among <strong>${formatNumber(overall.total)}</strong> classified records in this scope.
      <span>Across the full archive, ${formatPercent(issueBalance.exactlyBalancedShare)} of issues published equal numbers of Darts and Pats—evidence that editorial format shaped the ratio.</span>`;
  elements.timeline.innerHTML = state.summary.years.map((item) => {
    const yearRecords = scopedRecords.filter((record) => record.year === item.key);
    const balance = patShare(yearRecords);
    const total = yearCounts.get(item.key);
    const dotPosition = balance.share === null ? 50 : balance.share * 100;
    const volumeHeight = total ? Math.max(4, (total / maxCount) * 88) : 0;
    const isActive = String(item.key) === state.year;
    const label = balance.share === null ? `${item.key}: no matching classified records`
      : `${item.key}: ${formatPercent(balance.share)} Pats among ${balance.total} classified records`;
    return `<button class="balance-year${isActive ? " is-active" : ""}" type="button" data-year="${item.key}" aria-pressed="${isActive}" aria-label="${label}" title="${label}">
      <span class="volume-bar" style="height:${volumeHeight}%" aria-hidden="true"></span>
      ${balance.share === null ? "" : `<span class="balance-dot" style="bottom:${dotPosition}%" aria-hidden="true"></span>`}
      <small>${String(item.key).slice(2)}</small></button>`;
  }).join("");
}

function renderTopicChart() {
  const scopedRecords = state.records.filter((record) => baseScope(record, new Set(["kind", "topic"])));
  const counts = new Map();
  for (const record of scopedRecords) {
    const id = record._analysis.primaryTopic;
    if (!counts.has(id)) counts.set(id, { darts: 0, pats: 0 });
    if (record.kind === "DART") counts.get(id).darts += 1;
    if (record.kind === "PAT") counts.get(id).pats += 1;
  }
  const rows = state.analysis.topics.filter((topic) => topic.id !== "unclassified")
    .map((topic) => ({ ...topic, ...(counts.get(topic.id) || { darts: 0, pats: 0 }) }))
    .map((topic) => ({ ...topic, classified: topic.darts + topic.pats }))
    .filter((topic) => topic.classified).sort((a, b) => b.classified - a.classified);
  if (!rows.length) {
    elements.topicBars.innerHTML = '<p class="loading-note">No topic results match this scope.</p>';
    return;
  }
  elements.topicBars.innerHTML = rows.map((topic) => {
    const dartPercent = topic.darts / topic.classified;
    const patPercent = topic.pats / topic.classified;
    const isActive = state.topic === topic.id;
    return `<button class="topic-row${isActive ? " is-active" : ""}" type="button" data-topic="${topic.id}" aria-pressed="${isActive}">
      <span class="topic-label"><strong>${escapeHtml(topic.label)}</strong><small>${formatNumber(topic.classified)} records</small></span>
      <span class="diverging-track" aria-hidden="true"><i class="topic-dart" style="width:${dartPercent * 100}%"></i><i class="topic-pat" style="width:${patPercent * 100}%"></i></span>
      <span class="topic-share">${formatPercent(patPercent, 0)} Pats</span></button>`;
  }).join("");
}

function renderEntities() {
  const scopedRecords = state.records.filter((record) => baseScope(record, new Set(["kind", "entity"])));
  const counts = new Map();
  for (const record of scopedRecords) {
    for (const entity of record._analysis.entities) {
      if (!counts.has(entity.name)) counts.set(entity.name, { type: entity.type, darts: 0, pats: 0, total: 0 });
      const row = counts.get(entity.name);
      row.total += 1;
      if (record.kind === "DART") row.darts += 1;
      if (record.kind === "PAT") row.pats += 1;
    }
  }
  const entities = [...counts.entries()].map(([name, values]) => ({ name, ...values }))
    .filter((entity) => entity.total >= 5).sort((a, b) => b.total - a.total).slice(0, 16);
  if (!entities.length) {
    elements.entityList.innerHTML = '<p class="loading-note">No recognized entities match this scope.</p>';
    return;
  }
  elements.entityList.innerHTML = entities.map((entity) => {
    const classified = entity.darts + entity.pats;
    const share = classified ? entity.pats / classified : 0;
    const isActive = state.entity === entity.name;
    return `<button class="entity-chip${isActive ? " is-active" : ""}" type="button" data-entity="${escapeHtml(entity.name)}" aria-pressed="${isActive}">
      <span>${escapeHtml(entity.name)}</span><small>${entity.type} · ${formatNumber(entity.total)} · ${formatPercent(share, 0)} Pats</small></button>`;
  }).join("");
}

function recordCard(record) {
  const cardClass = record.kind === "PAT" ? "record-card--pat" : "record-card--dart";
  const annotation = record._analysis;
  const topic = topicMetadata(annotation.primaryTopic);
  const sourceParts = [record.sourcePdf, record.newspaperPage ? `newspaper p. ${record.newspaperPage}` : null, record.pdfPage ? `PDF p. ${record.pdfPage}` : null].filter(Boolean).join(" · ");
  const entityMarkup = annotation.entities.length ? `<div class="record-entities" aria-label="Recognized entities">${annotation.entities.map((entity) => `<span>${escapeHtml(entity.name)}</span>`).join("")}</div>` : "";
  return `<article class="record-card ${cardClass}"><div class="record-meta"><span class="kind-badge">${escapeHtml(record.kind)}</span><time datetime="${record.date}">${escapeHtml(formatDate(record.date))}</time></div>
    <p class="record-text">${escapeHtml(record.text)}</p>
    <div class="annotation-line"><span class="topic-badge">${escapeHtml(topic.label)}</span><small>${escapeHtml(annotation.topicConfidence)} confidence</small></div>${entityMarkup}
    <div class="record-details">${record.target ? `<div>Target: <span>${escapeHtml(record.target)}</span></div>` : ""}${record.sender ? `<div>Sender: <span>${escapeHtml(record.sender)}</span></div>` : ""}${sourceParts ? `<div>Source: <span>${escapeHtml(sourceParts)}</span></div>` : ""}</div></article>`;
}

function renderRecords() {
  elements.resultCount.textContent = formatNumber(state.filtered.length);
  elements.recordList.innerHTML = state.filtered.slice(0, state.visibleCount).map(recordCard).join("");
  elements.status.textContent = state.filtered.length ? "" : "No records match these filters. Try a broader search.";
  elements.loadMore.hidden = state.visibleCount >= state.filtered.length;
  if (!elements.loadMore.hidden) elements.loadMore.textContent = `Show more records (${formatNumber(state.filtered.length - state.visibleCount)} remaining)`;
}

function renderActiveScope() {
  const parts = [];
  if (state.yearRange) parts.push(`${state.yearRange[0]}–${state.yearRange[1]}`);
  if (state.year !== "all") parts.push(state.year);
  if (state.semester !== "all") parts.push(state.semester);
  if (state.topic !== "all") parts.push(topicMetadata(state.topic).label);
  if (state.entity !== "all") parts.push(state.entity);
  if (state.kind !== "all") parts.push(state.kind === "PAT" ? "Pats only" : state.kind === "DART" ? "Darts only" : "Combined entries");
  if (state.query.trim()) parts.push(`“${state.query.trim()}”`);
  elements.activeScope.textContent = parts.length ? `Active view: ${parts.join(" · ")}` : "";
}

function renderMethods() {
  const unclassified = state.analysis.confidenceCounts.unclassified || 0;
  const classified = state.summary.recordCount - unclassified;
  elements.methodNote.textContent = state.analysis.methodNote;
  elements.coverageNote.textContent = `${formatNumber(classified)} of ${formatNumber(state.summary.recordCount)} records (${formatPercent(classified / state.summary.recordCount)}) received a first-pass topic label.`;
}

function renderAll() { renderTimeline(); renderTopicChart(); renderEntities(); renderActiveScope(); renderRecords(); }
function applyFilters() {
  state.filtered = state.records.filter((record) => baseScope(record)).sort((a, b) => state.sort === "oldest" ? a.id - b.id : b.id - a.id);
  state.visibleCount = PAGE_SIZE;
  renderAll();
}
function scrollToAnalysis() { document.querySelector(".timeline-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); }
function clearAudienceRange() { state.yearRange = null; }

function registerWebMcpTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const allowedKinds = new Set(["all", "DART", "PAT", "DART AND PAT"]);
  const allowedSemesters = new Set(["all", "Fall", "Spring"]);
  const allowedYears = new Set(["all", ...state.summary.years.map((item) => String(item.key))]);
  const allowedTopics = new Set(["all", ...state.analysis.topics.map((topic) => topic.id)]);
  const allowedEntities = new Set(["all", ...state.analysis.entities.map((entity) => entity.name)]);
  context.registerTool({
    name: "filter_archive", title: "Filter the Darts and Pats archive",
    description: "Filter the visible archive by text, publication label, year range, semester, topic, or recognized campus entity.",
    inputSchema: { type: "object", properties: {
      query: { type: "string", description: "Words to search for in the published text and annotations." },
      kind: { type: "string", enum: ["all", "DART", "PAT", "DART AND PAT"] },
      year: { type: "string", description: "A year from 1991 through 2026, or all." },
      yearFrom: { type: "integer", minimum: 1991, maximum: 2026 }, yearTo: { type: "integer", minimum: 1991, maximum: 2026 },
      semester: { type: "string", enum: ["all", "Fall", "Spring"] },
      topic: { type: "string", description: "A controlled topic ID, or all." },
      entity: { type: "string", description: "A recognized campus entity name, or all." },
    }, additionalProperties: false }, annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input = {}) {
      if (input.kind !== undefined && !allowedKinds.has(input.kind)) throw new Error("Unsupported kind filter.");
      if (input.year !== undefined && !allowedYears.has(input.year)) throw new Error("Unsupported year filter.");
      if (input.semester !== undefined && !allowedSemesters.has(input.semester)) throw new Error("Unsupported semester filter.");
      if (input.topic !== undefined && !allowedTopics.has(input.topic)) throw new Error("Unsupported topic filter.");
      if (input.entity !== undefined && !allowedEntities.has(input.entity)) throw new Error("Unsupported entity filter.");
      if (input.query !== undefined && typeof input.query !== "string") throw new Error("Search query must be text.");
      if (input.yearFrom !== undefined && input.yearTo !== undefined && input.yearFrom > input.yearTo) throw new Error("yearFrom must not be later than yearTo.");
      if (input.query !== undefined) state.query = input.query;
      if (input.kind !== undefined) state.kind = input.kind;
      if (input.year !== undefined) { state.year = input.year; state.yearRange = null; }
      if (input.yearFrom !== undefined || input.yearTo !== undefined) {
        state.yearRange = [input.yearFrom ?? state.summary.years[0].key, input.yearTo ?? state.summary.years.at(-1).key]; state.year = "all";
      }
      if (input.semester !== undefined) state.semester = input.semester;
      if (input.topic !== undefined) state.topic = input.topic;
      if (input.entity !== undefined) state.entity = input.entity;
      elements.search.value = state.query; elements.kind.value = state.kind; elements.year.value = state.year;
      elements.semester.value = state.semester; elements.topic.value = state.topic; applyFilters();
      return { matchingRecords: state.filtered.length, filters: { query: state.query, kind: state.kind, year: state.year, yearRange: state.yearRange, semester: state.semester, topic: state.topic, entity: state.entity } };
    },
  });
}

let searchTimer;
elements.search.addEventListener("input", (event) => { window.clearTimeout(searchTimer); searchTimer = window.setTimeout(() => { state.query = event.target.value; applyFilters(); }, 150); });
elements.kind.addEventListener("change", (event) => { state.kind = event.target.value; applyFilters(); });
elements.year.addEventListener("change", (event) => { state.year = event.target.value; clearAudienceRange(); applyFilters(); });
elements.semester.addEventListener("change", (event) => { state.semester = event.target.value; applyFilters(); });
elements.topic.addEventListener("change", (event) => { state.topic = event.target.value; applyFilters(); });
elements.sort.addEventListener("change", (event) => { state.sort = event.target.value; applyFilters(); });
elements.form.addEventListener("reset", () => { window.setTimeout(() => { Object.assign(state, { query: "", kind: "all", year: "all", yearRange: null, semester: "all", topic: "all", entity: "all" }); applyFilters(); }); });
elements.timeline.addEventListener("click", (event) => { const button = event.target.closest("[data-year]"); if (!button) return; state.year = state.year === button.dataset.year ? "all" : button.dataset.year; clearAudienceRange(); elements.year.value = state.year; applyFilters(); });
elements.topicBars.addEventListener("click", (event) => { const button = event.target.closest("[data-topic]"); if (!button) return; state.topic = state.topic === button.dataset.topic ? "all" : button.dataset.topic; elements.topic.value = state.topic; applyFilters(); document.querySelector(".results-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); });
elements.entityList.addEventListener("click", (event) => { const button = event.target.closest("[data-entity]"); if (!button) return; state.entity = state.entity === button.dataset.entity ? "all" : button.dataset.entity; applyFilters(); document.querySelector(".results-panel")?.scrollIntoView({ behavior: "smooth", block: "start" }); });
elements.studentView.addEventListener("click", () => { const maxYear = state.summary.years.at(-1).key; state.yearRange = [maxYear - 5, maxYear]; state.year = "all"; elements.year.value = "all"; applyFilters(); scrollToAnalysis(); });
elements.alumniView.addEventListener("click", () => { const graduationYear = Number(elements.alumniYear.value); state.yearRange = [Math.max(state.summary.years[0].key, graduationYear - 3), graduationYear]; state.year = "all"; elements.year.value = "all"; applyFilters(); scrollToAnalysis(); });
elements.loadMore.addEventListener("click", () => { state.visibleCount += PAGE_SIZE; renderRecords(); });

async function start() {
  try {
    const base = import.meta.env.BASE_URL;
    const responses = await Promise.all(["records.json", "summary.json", "enrichment.json", "analysis.json"].map((name) => fetch(`${base}data/${name}`)));
    if (!responses.every((response) => response.ok)) throw new Error("Data files could not be loaded.");
    const [records, summary, enrichment, analysis] = await Promise.all(responses.map((response) => response.json()));
    state.summary = summary; state.analysis = analysis; state.enrichment = new Map(enrichment.records.map((row) => [row.id, row]));
    state.records = records.map((record) => {
      const annotation = state.enrichment.get(record.id);
      if (!annotation) throw new Error(`Missing analysis for record ${record.id}.`);
      const enriched = { ...record, _analysis: annotation }; enriched._search = searchBlob(enriched); return enriched;
    });
    renderSummary(); populateControls(); renderMethods(); applyFilters(); registerWebMcpTools();
  } catch (error) {
    elements.status.textContent = "The archive could not be loaded. Please refresh the page and try again.";
    elements.timeline.innerHTML = '<p class="loading-note">Timeline unavailable.</p>';
    elements.topicBars.innerHTML = '<p class="loading-note">Topic analysis unavailable.</p>';
    elements.entityList.innerHTML = '<p class="loading-note">Entity analysis unavailable.</p>';
    console.error(error);
  }
}

start();
