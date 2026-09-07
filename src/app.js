import { layoutEntityCloud } from "./cloudLayout.js";
import "./styles.css";
import { ENTITY_DICTIONARY, ENTITY_TYPE_COLORS, recognizeEntities } from "./entityDictionary.js";
import { searchEntities, chooseCloudEntities, scrambleOrder } from "./entityBrowsing.js";
import { entryBalance } from "./entryBalance.js";

const SHEET_ID = "1QxSwNnQDkxWk3HcCvIrr5RelCROchm0MA0AsL78Q5VA";
const SHEET_NAME = "parsed_rows";
const SHEET_QUERY = "select A,D,E,F,G,H,K,L,Q,T where A is not null";
const PAGE_SIZE = 18;
let activeCloudLayout;
let webMcpRegistered = false;

const state = {
  records: [],
  entityStats: new Map(),
  selectedEntityId: null,
  selectedYear: null,
  entityType: "all",
  visibleCount: PAGE_SIZE,
  source: "loading",
  cloudRenderId: 0,
  cloudOrder: [],
  cloudIds: [],
  cloudSeed: 0,
};

const elements = {
  totalRecords: document.querySelector("#total-records"),
  totalEntities: document.querySelector("#total-entities"),
  totalPats: document.querySelector("#total-pats"),
  totalDarts: document.querySelector("#total-darts"),
  sourceStatus: document.querySelector("#source-status"),
  refreshData: document.querySelector("#refresh-data"),
  entityTypes: document.querySelector("#entity-types"),
  wordCloud: document.querySelector("#word-cloud"),
  cloudCount: document.querySelector("#cloud-count"),
  cloudScramble: document.querySelector("#cloud-scramble"),
  entitySearch: document.querySelector("#entity-search"),
  searchForm: document.querySelector("#entity-search-form"),
  searchResults: document.querySelector("#entity-search-results"),
  searchStatus: document.querySelector("#entity-search-status"),
  frequencyEntity: document.querySelector("#frequency-entity"),
  frequencyTotal: document.querySelector("#frequency-total"),
  yearChart: document.querySelector("#year-chart"),
  legendDarts: document.querySelector("#legend-darts"),
  legendPats: document.querySelector("#legend-pats"),
  balanceLabel: document.querySelector("#balance-label"),
  balanceShare: document.querySelector("#balance-share"),
  balanceMeter: document.querySelector("#balance-meter"),
  balanceScale: document.querySelector("#balance-scale"),
  yearSlider: document.querySelector("#year-slider"),
  yearTicks: document.querySelector("#year-ticks"),
  sliderLabels: document.querySelector(".slider-labels"),
  selectedYear: document.querySelector("#selected-year"),
  allYears: document.querySelector("#all-years"),
  matchCount: document.querySelector("#match-count"),
  status: document.querySelector("#status-message"),
  recordList: document.querySelector("#record-list"),
  loadMore: document.querySelector("#load-more"),
};

function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value, year) {
  if (!value) return String(year);
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return String(year);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(parsed);
}

function parseGoogleDate(value, formattedValue) {
  if (formattedValue) {
    const parsed = new Date(formattedValue);
    if (!Number.isNaN(parsed.getTime())) {
      const month = String(parsed.getMonth() + 1).padStart(2, "0");
      const day = String(parsed.getDate()).padStart(2, "0");
      return `${parsed.getFullYear()}-${month}-${day}`;
    }
  }
  const match = String(value || "").match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/);
  if (!match) return null;
  return `${match[1]}-${String(Number(match[2]) + 1).padStart(2, "0")}-${match[3].padStart(2, "0")}`;
}

function gvizRecords(response) {
  if (response?.status !== "ok" || !response.table) throw new Error("Google Sheets returned an invalid response.");
  const columns = new Map(response.table.cols.map((column, index) => [column.label, index]));
  const required = ["count", "year", "date", "semester", "pl2_pdf", "page_in_breeze", "kind", "text_full", "target_short", "sender_short"];
  for (const label of required) {
    if (!columns.has(label)) throw new Error(`The live sheet is missing the ${label} column.`);
  }
  const cell = (row, label) => row.c[columns.get(label)] || null;
  return response.table.rows.map((row) => {
    const dateCell = cell(row, "date");
    return {
      id: Number(cell(row, "count")?.v),
      year: Number(cell(row, "year")?.v),
      date: parseGoogleDate(dateCell?.v, dateCell?.f),
      semester: cell(row, "semester")?.v || null,
      sourcePdf: cell(row, "pl2_pdf")?.v || null,
      newspaperPage: Number(cell(row, "page_in_breeze")?.v) || null,
      kind: cell(row, "kind")?.v || null,
      text: cell(row, "text_full")?.v || "",
      target: cell(row, "target_short")?.v || null,
      sender: cell(row, "sender_short")?.v || null,
    };
  }).filter((record) => Number.isFinite(record.id) && Number.isFinite(record.year) && record.kind && record.text);
}

function loadLiveSheet() {
  return new Promise((resolve, reject) => {
    const callbackName = `dartsPatsSheet_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => finish(new Error("The Google Sheet took too long to respond.")), 45000);
    let completed = false;

    function cleanup() {
      window.clearTimeout(timeout);
      script.remove();
      delete window[callbackName];
    }

    function finish(error, records) {
      if (completed) return;
      completed = true;
      cleanup();
      if (error) reject(error); else resolve(records);
    }

    window[callbackName] = (response) => {
      try { finish(null, gvizRecords(response)); }
      catch (error) { finish(error); }
    };
    script.onerror = () => finish(new Error("The live Google Sheet could not be reached."));
    const params = new URLSearchParams({
      sheet: SHEET_NAME,
      headers: "1",
      tq: SHEET_QUERY,
      tqx: `responseHandler:${callbackName}`,
      cache: String(Date.now()),
    });
    script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?${params}`;
    document.head.append(script);
  });
}

async function loadFallback() {
  const response = await fetch(`${import.meta.env.BASE_URL}data/records.json`);
  if (!response.ok) throw new Error("The cached archive could not be loaded.");
  return response.json();
}

function analyzeRecords(records) {
  const stats = new Map(ENTITY_DICTIONARY.map((entity) => [entity.id, {
    ...entity, count: 0, darts: 0, pats: 0, records: [], byYear: new Map(),
  }]));
  state.records = records.filter((record) => record.kind === "DART" || record.kind === "PAT").map((record) => {
    const entities = recognizeEntities(record);
    const enriched = { ...record, entities };
    for (const entity of entities) {
      const item = stats.get(entity.id);
      item.count += 1;
      item.records.push(enriched);
      item.byYear.set(record.year, (item.byYear.get(record.year) || 0) + 1);
      if (record.kind === "DART") item.darts += 1;
      else if (record.kind === "PAT") item.pats += 1;
    }
    return enriched;
  });
  state.entityStats = new Map([...stats].filter(([, entity]) => entity.count > 0));
  const defaultEntity = [...state.entityStats.values()].sort((a, b) => b.count - a.count)[0];
  if (!state.entityStats.has(state.selectedEntityId)) state.selectedEntityId = defaultEntity?.id || null;
}

function availableYears() {
  const years = [...new Set(state.records.map((record) => record.year))].sort((a, b) => a - b);
  return years;
}

function configureYearControls() {
  const years = availableYears();
  const minYear = years[0];
  const maxYear = years.at(-1);
  elements.yearSlider.min = String(minYear);
  elements.yearSlider.max = String(maxYear);
  elements.yearSlider.value = String(state.selectedYear || minYear);
  elements.yearTicks.innerHTML = years.map((year) => `<option value="${year}"></option>`).join("");
  const labelYears = [minYear, ...years.filter((year) => year % 10 === 0), maxYear].filter((year, index, list) => list.indexOf(year) === index);
  elements.sliderLabels.innerHTML = labelYears.map((year) => `<span>${year}</span>`).join("");
}

function populateEntityTypes() {
  const types = [...new Set([...state.entityStats.values()].map((entity) => entity.type))].sort();
  if (!types.includes(state.entityType)) state.entityType = "all";
  elements.entityTypes.innerHTML = ["all", ...types].map((type) => {
    const background = ENTITY_TYPE_COLORS[type] || "#351c75";
    const channels = background.slice(1).match(/../g).map((hex) => {
      const value = parseInt(hex, 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    });
    const luminance = channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    const foreground = luminance > 0.179 ? "#000000" : "#ffffff";
    return `<button type="button" class="entity-type-pill" data-entity-type="${escapeHtml(type)}" aria-pressed="${state.entityType === type}" style="--entity-color:${background};--entity-text:${foreground}">${escapeHtml(type === "all" ? "All" : type)}</button>`;
  }).join("");
}

function syncEntityTypeSelection() {
  for (const button of elements.entityTypes.querySelectorAll("[data-entity-type]")) {
    button.setAttribute("aria-pressed", String(button.dataset.entityType === state.entityType));
  }
}

function selectEntityType(type) {
  state.entityType = type;
  state.cloudOrder = [];
  syncEntityTypeSelection();
  renderCloud();
}

function updateSummary() {
  const darts = state.records.filter((record) => record.kind === "DART").length;
  const pats = state.records.filter((record) => record.kind === "PAT").length;
  elements.totalRecords.textContent = formatNumber(state.records.length);
  elements.totalEntities.textContent = formatNumber(state.entityStats.size);
  elements.totalDarts.textContent = formatNumber(darts);
  elements.totalPats.textContent = formatNumber(pats);
}

function selectedEntity() {
  return state.entityStats.get(state.selectedEntityId) || null;
}

function cloudEntities() {
  const counts = new Map();
  for (const record of state.records) {
    if (state.selectedYear !== null && record.year !== state.selectedYear) continue;
    for (const entity of record.entities) {
      if (state.entityType !== "all" && entity.type !== state.entityType) continue;
      if (!counts.has(entity.id)) counts.set(entity.id, { ...entity, count: 0, darts: 0, pats: 0 });
      const item = counts.get(entity.id);
      item.count += 1;
      if (record.kind === "DART") item.darts += 1;
      if (record.kind === "PAT") item.pats += 1;
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

function scrambleCloud() {
  state.cloudOrder = scrambleOrder(cloudEntities(), state.cloudIds);
  state.cloudSeed += 1;
  renderCloud();
}

function matchingEntities() {
  return searchEntities([...state.entityStats.values()], elements.entitySearch.value);
}

function renderEntitySearch() {
  const query = elements.entitySearch.value.trim();
  const matches = matchingEntities();
  elements.searchResults.hidden = !query || !matches.length;
  elements.searchResults.innerHTML = matches.map((entity) =>
    `<button type="button" data-search-entity="${escapeHtml(entity.id)}"><strong>${escapeHtml(entity.name)}</strong><span>${escapeHtml(entity.type)} · ${formatNumber(entity.count)} records</span></button>`
  ).join("");
  elements.searchStatus.textContent = !query ? "" : matches.length
    ? `${matches.length} ${matches.length === 1 ? "match" : "matches"} across all years and types`
    : "No recognized entity matches. Try another name or abbreviation.";
}

function selectSearchEntity(entityId) {
  const entity = state.entityStats.get(entityId);
  if (!entity) return;
  const adjustments = [];
  if (state.entityType !== "all" && state.entityType !== entity.type) {
    state.entityType = "all";
    syncEntityTypeSelection();
    adjustments.push("all entity types");
  }
  if (state.selectedYear !== null && !entity.byYear.has(state.selectedYear)) {
    state.selectedYear = null;
    adjustments.push("all years");
  }
  state.cloudOrder = [entityId, ...matchingEntities().filter((item) => item.id !== entityId).map((item) => item.id)];
  state.cloudSeed += 1;
  elements.entitySearch.value = entity.name;
  elements.searchResults.hidden = true;
  elements.searchStatus.textContent = adjustments.length ? `Showing ${adjustments.join(" and ")} for ${entity.name}.` : "";
  selectEntity(entityId);
}

async function renderCloud() {
  const allEntities = cloudEntities();
  const entities = chooseCloudEntities(allEntities, state.cloudOrder, state.selectedEntityId, allEntities.length);
  state.cloudIds = entities.map((entity) => entity.id);
  elements.cloudScramble.disabled = allEntities.length < 2;
  elements.cloudCount.textContent = `(N=${formatNumber(allEntities.length)})`;
  elements.cloudCount.setAttribute("aria-label", `Arranging ${allEntities.length} entities for the current filters`);
  activeCloudLayout?.stop();
  const renderId = ++state.cloudRenderId;
  elements.wordCloud.setAttribute("aria-busy", "true");
  if (!entities.length) {
    elements.wordCloud.innerHTML = '<p class="empty-note">No recognized entities appear in this year and type.</p>';
    elements.wordCloud.setAttribute("aria-busy", "false");
    elements.cloudCount.textContent = "(N=0)";
    elements.cloudCount.setAttribute("aria-label", "No entities match the current filters");
    return;
  }
  // Measure and render with the same loaded font so long names actually fit.
  try { await document.fonts.load('600 16px "Fraunces"'); } catch { /* Use the browser's fallback font if needed. */ }
  if (renderId !== state.cloudRenderId) return;
  const availableWidth = Math.max(256, Math.round(elements.wordCloud.getBoundingClientRect().width || 760) - 16);
  activeCloudLayout = layoutEntityCloud(entities, {
    width: availableWidth,
    seed: entities.length * 31 + (state.selectedYear || 0) + state.cloudSeed * 7919,
    onEnd: ({ words: placedWords, width, height }) => {
      if (renderId !== state.cloudRenderId) return;
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      svg.setAttribute("role", "group");
      svg.setAttribute("aria-label", `Clickable entities for ${state.selectedYear || "all years"}`);
      const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      group.setAttribute("transform", `translate(${width / 2},${height / 2})`);
      for (const word of placedWords) {
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
        text.setAttribute("class", `cloud-word${word.id === state.selectedEntityId ? " is-selected" : ""}`);
        text.setAttribute("x", word.x);
        text.setAttribute("y", word.y);
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("font-family", "Fraunces");
        text.setAttribute("font-weight", "600");
        text.setAttribute("aria-pressed", String(word.id === state.selectedEntityId));
        text.setAttribute("transform", `rotate(${word.rotate})`);
        text.setAttribute("style", `font-size:${word.size}px;fill:${ENTITY_TYPE_COLORS[word.type] || "#351c75"}`);
        text.setAttribute("role", "button");
        text.setAttribute("tabindex", "0");
        text.setAttribute("aria-label", `${word.name}: ${word.count} mentions. Select to view records.`);
        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = `${word.name}: ${formatNumber(word.count)} mentions`;
        text.append(title, document.createTextNode(word.text));
        const choose = () => selectEntity(word.id);
        text.addEventListener("click", choose);
        text.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); choose(); }
        });
        group.append(text);
      }
      svg.append(group);
      elements.wordCloud.replaceChildren(svg);
      elements.wordCloud.setAttribute("aria-busy", "false");
      elements.cloudCount.textContent = `(N=${formatNumber(allEntities.length)})`;
      elements.cloudCount.setAttribute("aria-label", `${allEntities.length} entities shown for the current filters`);
      const selectedWord = group.querySelector(".is-selected");
      if (selectedWord) {
        const bounds = selectedWord.getBBox();
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const scale = Math.min(1.18, (width - 24) / (bounds.width + 14), (height - 24) / (bounds.height + 8));
        const halfWidth = (bounds.width + 14) * scale / 2;
        const halfHeight = (bounds.height + 8) * scale / 2;
        const fittedX = Math.max(-width / 2 + 12 + halfWidth, Math.min(centerX, width / 2 - 12 - halfWidth));
        const fittedY = Math.max(-height / 2 + 12 + halfHeight, Math.min(centerY, height / 2 - 12 - halfHeight));
        const selectionLayer = document.createElementNS("http://www.w3.org/2000/svg", "g");
        selectionLayer.setAttribute("class", "selected-entity-layer");
        selectionLayer.setAttribute("transform", `translate(${fittedX},${fittedY}) scale(${scale}) translate(${-centerX},${-centerY})`);
        const highlight = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        highlight.setAttribute("class", "entity-highlight");
        highlight.setAttribute("x", bounds.x - 7);
        highlight.setAttribute("y", bounds.y - 4);
        highlight.setAttribute("width", bounds.width + 14);
        highlight.setAttribute("height", bounds.height + 8);
        highlight.setAttribute("rx", "8");
        highlight.setAttribute("aria-hidden", "true");
        // Last in SVG paint order: enlarge the selection without changing frequency sizes.
        selectionLayer.append(highlight, selectedWord);
        group.append(selectionLayer);
      }
    },
    onError: (error) => {
      if (renderId !== state.cloudRenderId) return;
      elements.wordCloud.innerHTML = '<p class="empty-note">Could not arrange the cloud. Select Scramble to try again.</p>';
      elements.wordCloud.setAttribute("aria-busy", "false");
      elements.cloudCount.textContent = `(N=${formatNumber(allEntities.length)})`;
      elements.cloudCount.setAttribute("aria-label", "Cloud layout unavailable");
      console.error(error);
    },
  });
}

function renderEntryBalance(darts, pats) {
  const balance = entryBalance(darts, pats);
  elements.legendDarts.textContent = `Darts (${formatNumber(darts)})`;
  elements.legendPats.textContent = `Pats (${formatNumber(pats)})`;
  elements.balanceLabel.textContent = balance.label;
  elements.balanceShare.textContent = balance.detail;
  elements.balanceMeter.hidden = !balance.total;
  elements.balanceScale.hidden = !balance.total;
  if (balance.total) {
    const percent = balance.patShare * 100;
    elements.balanceMeter.style.setProperty("--pat-share", `${percent}%`);
    elements.balanceMeter.setAttribute("aria-valuenow", percent.toFixed(1));
    elements.balanceMeter.setAttribute("aria-valuetext", `${balance.label}. ${balance.detail}. ${balance.total} entries, ${state.selectedYear ?? "all years"}.`);
  }
}

function renderYearChart() {
  const entity = selectedEntity();
  const years = availableYears();
  if (!entity) {
    elements.frequencyEntity.textContent = "Select an entity";
    elements.frequencyTotal.textContent = "—";
    elements.yearChart.replaceChildren();
    renderEntryBalance(0, 0);
    return;
  }
  const maxCount = Math.max(1, ...years.map((year) => entity.byYear.get(year) || 0));
  const countsByYear = new Map(years.map((year) => [year, { darts: 0, pats: 0 }]));
  for (const record of entity.records) {
    const counts = countsByYear.get(record.year);
    if (record.kind === "DART") counts.darts += 1;
    else if (record.kind === "PAT") counts.pats += 1;
  }
  const periodCounts = state.selectedYear === null ? entity : countsByYear.get(state.selectedYear) || { darts: 0, pats: 0 };
  renderEntryBalance(periodCounts.darts, periodCounts.pats);
  elements.frequencyEntity.textContent = entity.name;
  elements.frequencyTotal.textContent = state.selectedYear === null
    ? `${formatNumber(entity.count)} total`
    : `${formatNumber(entity.byYear.get(state.selectedYear) || 0)} in ${state.selectedYear}`;
  elements.yearChart.style.setProperty("--year-count", years.length);
  elements.yearChart.innerHTML = years.map((year) => {
    const count = entity.byYear.get(year) || 0;
    const height = count / maxCount * 100;
    const { darts, pats } = countsByYear.get(year);
    const description = `${year}: ${darts} Darts, ${pats} Pats; ${count} total mentions`;
    const selected = state.selectedYear === year;
    return `<button class="year-bar${selected ? " is-selected" : ""}" type="button" data-year="${year}" aria-label="${description}" title="${description}" aria-pressed="${selected}" style="--bar-height:${height}%">
      ${selected ? `<span class="bar-count">${formatNumber(count)}</span>` : ""}
      <span class="bar-stack" aria-hidden="true" style="height:${height}%">
        <i class="bar-dart" style="flex-grow:${darts}"></i>
        <i class="bar-pat" style="flex-grow:${pats}"></i>
      </span><span class="bar-year">${year}</span></button>`;
  }).join("");
}

function matchingRecords() {
  const entity = selectedEntity();
  if (!entity) return [];
  return entity.records.filter((record) => state.selectedYear === null || record.year === state.selectedYear)
    .sort((a, b) => b.id - a.id);
}

function recordCard(record) {
  const className = record.kind === "PAT" ? "record-card--pat" : "record-card--dart";
  const source = [record.sourcePdf, record.newspaperPage ? `newspaper p. ${record.newspaperPage}` : null].filter(Boolean).join(" · ");
  return `<article class="record-card ${className}">
    <div class="record-meta"><span class="kind-badge">${escapeHtml(record.kind)}</span><time datetime="${record.date || ""}">${escapeHtml(formatDate(record.date, record.year))}</time></div>
    <p>${escapeHtml(record.text)}</p>
    ${record.target ? `<div class="record-target">Target: <strong>${escapeHtml(record.target)}</strong></div>` : ""}
    ${source ? `<div class="record-source">${escapeHtml(source)}</div>` : ""}
  </article>`;
}

function renderRecords() {
  const entity = selectedEntity();
  const records = matchingRecords();
  elements.matchCount.textContent = formatNumber(records.length);
  if (!entity) {
    elements.status.textContent = "Select an entity in the word cloud to view its records.";
    elements.recordList.replaceChildren();
    elements.loadMore.hidden = true;
    return;
  }
  elements.status.textContent = records.length ? "" : `${entity.name} has no records in ${state.selectedYear}.`;
  elements.recordList.innerHTML = records.slice(0, state.visibleCount).map(recordCard).join("");
  elements.loadMore.hidden = state.visibleCount >= records.length;
  if (!elements.loadMore.hidden) elements.loadMore.textContent = `Show more (${formatNumber(records.length - state.visibleCount)} remaining)`;
}

function renderYearSelection() {
  elements.selectedYear.textContent = state.selectedYear === null ? "All years" : String(state.selectedYear);
  elements.allYears.classList.toggle("is-active", state.selectedYear === null);
  elements.allYears.setAttribute("aria-pressed", String(state.selectedYear === null));
  if (state.selectedYear !== null) elements.yearSlider.value = String(state.selectedYear);
}

function renderSelection({ redrawCloud = true } = {}) {
  state.visibleCount = PAGE_SIZE;
  renderYearSelection();
  renderYearChart();
  renderRecords();
  if (redrawCloud) renderCloud();
}

function selectEntity(entityId) {
  if (!state.entityStats.has(entityId)) return;
  state.selectedEntityId = entityId;
  renderSelection();
  if (window.matchMedia("(max-width: 800px)").matches) {
    document.querySelector(".entity-sidebar")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function selectYear(year) {
  state.selectedYear = Number(year);
  state.cloudOrder = [];
  renderSelection();
}

function registerWebMcpTool() {
  const context = document.modelContext;
  if (!context?.registerTool || webMcpRegistered) return;
  const entityNames = [...state.entityStats.values()].map((entity) => entity.name);
  const minYear = availableYears()[0];
  const maxYear = availableYears().at(-1);
  context.registerTool({
    name: "explore_named_entity",
    title: "Explore a named entity in Darts and Pats",
    description: "Select a recognized organization, place, building, business, group, or academic unit and optionally filter its records to one year.",
    inputSchema: { type: "object", properties: {
      entity: { type: "string", enum: entityNames },
      year: { anyOf: [{ type: "integer", minimum: minYear, maximum: maxYear }, { type: "null" }], description: "Publication year, or null for all years." },
    }, required: ["entity"], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute({ entity, year = null }) {
      const match = [...state.entityStats.values()].find((item) => item.name === entity);
      if (!match) throw new Error("Entity is not available in the current live data.");
      state.selectedEntityId = match.id;
      state.selectedYear = year;
      state.cloudOrder = [match.id];
      renderSelection();
      return { entity, year, matchingRecords: matchingRecords().length };
    },
  });
  webMcpRegistered = true;
}

async function refreshData() {
  elements.refreshData.disabled = true;
  elements.sourceStatus.textContent = "Connecting to the live Google Sheet…";
  try {
    let records;
    try {
      records = await loadLiveSheet();
      state.source = "live";
      document.body.dataset.source = "live";
    } catch (liveError) {
      console.warn(liveError);
      records = await loadFallback();
      state.source = "cached";
      elements.sourceStatus.textContent = "Cached archive shown · select Refresh data to retry the live sheet";
      document.body.dataset.source = "cached";
    }
    analyzeRecords(records);
    if (state.source === "live") {
      const loadedAt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date());
      elements.sourceStatus.textContent = `Live Google Sheet · ${formatNumber(state.records.length)} Dart and Pat records loaded at ${loadedAt}`;
    }
    state.cloudOrder = [];
    configureYearControls();
    populateEntityTypes();
    updateSummary();
    renderSelection();
    renderEntitySearch();
    registerWebMcpTool();
  } catch (error) {
    elements.sourceStatus.textContent = "The archive could not be loaded.";
    elements.status.textContent = "Please check the source sharing settings and try again.";
    elements.wordCloud.innerHTML = '<p class="empty-note">Data unavailable.</p>';
    console.error(error);
  } finally {
    elements.refreshData.disabled = false;
  }
}

elements.refreshData.addEventListener("click", refreshData);
elements.entityTypes.addEventListener("click", (event) => {
  const button = event.target.closest("[data-entity-type]");
  if (button) selectEntityType(button.dataset.entityType);
});
elements.cloudScramble.addEventListener("click", scrambleCloud);
elements.entitySearch.addEventListener("input", renderEntitySearch);
elements.entitySearch.addEventListener("keydown", (event) => {
  if (event.key === "Escape") elements.searchResults.hidden = true;
  if (event.key === "ArrowDown" && !elements.searchResults.hidden) {
    event.preventDefault();
    elements.searchResults.querySelector("button")?.focus();
  }
});
elements.searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const match = matchingEntities()[0];
  if (match) selectSearchEntity(match.id);
  else renderEntitySearch();
});
elements.searchResults.addEventListener("click", (event) => {
  const button = event.target.closest("[data-search-entity]");
  if (button) selectSearchEntity(button.dataset.searchEntity);
});
elements.yearSlider.addEventListener("input", (event) => selectYear(event.target.value));
elements.allYears.addEventListener("click", () => { state.selectedYear = null; state.cloudOrder = []; renderSelection(); });
elements.yearChart.addEventListener("click", (event) => {
  const button = event.target.closest("[data-year]");
  if (button) selectYear(button.dataset.year);
});
elements.loadMore.addEventListener("click", () => { state.visibleCount += PAGE_SIZE; renderRecords(); });

let resizeTimer;
let cloudWidth = 0;
new ResizeObserver(([entry]) => {
  if (entry.contentRect.width === cloudWidth) return;
  cloudWidth = entry.contentRect.width;
  window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => { if (state.records.length) renderCloud(); }, 160);
}).observe(elements.wordCloud);

refreshData();
