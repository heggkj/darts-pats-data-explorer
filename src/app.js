import "./styles.css";

const PAGE_SIZE = 24;

const state = {
  records: [],
  summary: null,
  filtered: [],
  visibleCount: PAGE_SIZE,
  query: "",
  kind: "all",
  year: "all",
  semester: "all",
  sort: "newest",
};

const elements = {
  form: document.querySelector("#filter-form"),
  search: document.querySelector("#search"),
  kind: document.querySelector("#kind"),
  year: document.querySelector("#year"),
  semester: document.querySelector("#semester"),
  sort: document.querySelector("#sort"),
  timeline: document.querySelector("#timeline"),
  recordList: document.querySelector("#record-list"),
  resultCount: document.querySelector("#result-count"),
  status: document.querySelector("#status-message"),
  loadMore: document.querySelector("#load-more"),
  totalRecords: document.querySelector("#total-records"),
  totalDarts: document.querySelector("#total-darts"),
  totalPats: document.querySelector("#total-pats"),
  totalIssues: document.querySelector("#total-issues"),
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatDate(value) {
  const parsed = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function normalize(value = "") {
  return String(value).toLowerCase().normalize("NFKD");
}

function searchBlob(record) {
  return normalize([record.text, record.target, record.sender, record.sourcePdf].filter(Boolean).join(" "));
}

function renderSummary() {
  const counts = state.summary.kindCounts;
  elements.totalRecords.textContent = formatNumber(state.summary.recordCount);
  elements.totalDarts.textContent = formatNumber(counts.DART || 0);
  elements.totalPats.textContent = formatNumber(counts.PAT || 0);
  elements.totalIssues.textContent = formatNumber(state.summary.issues.length);
}

function populateYears() {
  const options = state.summary.years
    .slice()
    .reverse()
    .map((year) => `<option value="${year.key}">${year.key}</option>`)
    .join("");
  elements.year.insertAdjacentHTML("beforeend", options);
}

function renderTimeline() {
  const maxCount = Math.max(...state.summary.years.map((item) => item.total));
  elements.timeline.innerHTML = state.summary.years.map((item) => {
    const dartHeight = (item.darts / maxCount) * 100;
    const patHeight = (item.pats / maxCount) * 100;
    const isActive = String(item.key) === state.year;
    return `
      <button
        class="year-bar${isActive ? " is-active" : ""}"
        type="button"
        data-year="${item.key}"
        aria-pressed="${isActive}"
        aria-label="${item.key}: ${item.darts} Darts and ${item.pats} Pats"
        title="${item.key}: ${item.darts} Darts, ${item.pats} Pats"
      >
        <span class="bar-stack" aria-hidden="true">
          <i class="bar-dart" style="height:${dartHeight}%"></i>
          <i class="bar-pat" style="height:${patHeight}%"></i>
        </span>
        <small>${String(item.key).slice(2)}</small>
      </button>
    `;
  }).join("");
}

function recordCard(record) {
  const cardClass = record.kind === "PAT" ? "record-card--pat" : "record-card--dart";
  const sourceParts = [
    record.sourcePdf,
    record.newspaperPage ? `newspaper p. ${record.newspaperPage}` : null,
    record.pdfPage ? `PDF p. ${record.pdfPage}` : null,
  ].filter(Boolean).join(" · ");

  return `
    <article class="record-card ${cardClass}">
      <div class="record-meta">
        <span class="kind-badge">${escapeHtml(record.kind)}</span>
        <time datetime="${record.date}">${escapeHtml(formatDate(record.date))}</time>
      </div>
      <p class="record-text">${escapeHtml(record.text)}</p>
      <div class="record-details">
        ${record.target ? `<div>Target: <span>${escapeHtml(record.target)}</span></div>` : ""}
        ${record.sender ? `<div>Sender: <span>${escapeHtml(record.sender)}</span></div>` : ""}
        ${sourceParts ? `<div>Source: <span>${escapeHtml(sourceParts)}</span></div>` : ""}
      </div>
    </article>
  `;
}

function renderRecords() {
  elements.resultCount.textContent = formatNumber(state.filtered.length);
  const visible = state.filtered.slice(0, state.visibleCount);
  elements.recordList.innerHTML = visible.map(recordCard).join("");
  elements.status.textContent = state.filtered.length ? "" : "No records match these filters. Try a broader search.";
  elements.loadMore.hidden = state.visibleCount >= state.filtered.length;
  if (!elements.loadMore.hidden) {
    const remaining = state.filtered.length - state.visibleCount;
    elements.loadMore.textContent = `Show more records (${formatNumber(remaining)} remaining)`;
  }
}

function applyFilters() {
  const query = normalize(state.query).trim();
  state.filtered = state.records
    .filter((record) => state.kind === "all" || record.kind === state.kind)
    .filter((record) => state.year === "all" || String(record.year) === state.year)
    .filter((record) => state.semester === "all" || record.semester === state.semester)
    .filter((record) => !query || record._search.includes(query))
    .sort((a, b) => state.sort === "oldest" ? a.id - b.id : b.id - a.id);
  state.visibleCount = PAGE_SIZE;
  renderTimeline();
  renderRecords();
}

function registerWebMcpTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;

  const allowedKinds = new Set(["all", "DART", "PAT", "DART AND PAT"]);
  const allowedSemesters = new Set(["all", "Fall", "Spring"]);
  const allowedYears = new Set(["all", ...state.summary.years.map((item) => String(item.key))]);

  context.registerTool({
    name: "filter_archive",
    title: "Filter the Darts and Pats archive",
    description: "Apply a text, type, year, or semester filter to the visible archive and return the matching record count.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Words to search for in the published text and parsed metadata." },
        kind: { type: "string", enum: ["all", "DART", "PAT", "DART AND PAT"] },
        year: { type: "string", description: "A year from 1991 through 2026, or all." },
        semester: { type: "string", enum: ["all", "Fall", "Spring"] },
      },
      additionalProperties: false,
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input = {}) {
      if (input.kind !== undefined && !allowedKinds.has(input.kind)) throw new Error("Unsupported kind filter.");
      if (input.year !== undefined && !allowedYears.has(input.year)) throw new Error("Unsupported year filter.");
      if (input.semester !== undefined && !allowedSemesters.has(input.semester)) throw new Error("Unsupported semester filter.");
      if (input.query !== undefined && typeof input.query !== "string") throw new Error("Search query must be text.");

      if (input.query !== undefined) state.query = input.query;
      if (input.kind !== undefined) state.kind = input.kind;
      if (input.year !== undefined) state.year = input.year;
      if (input.semester !== undefined) state.semester = input.semester;

      elements.search.value = state.query;
      elements.kind.value = state.kind;
      elements.year.value = state.year;
      elements.semester.value = state.semester;
      applyFilters();
      return {
        matchingRecords: state.filtered.length,
        filters: { query: state.query, kind: state.kind, year: state.year, semester: state.semester },
      };
    },
  });
}

let searchTimer;
elements.search.addEventListener("input", (event) => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => {
    state.query = event.target.value;
    applyFilters();
  }, 150);
});

elements.kind.addEventListener("change", (event) => { state.kind = event.target.value; applyFilters(); });
elements.year.addEventListener("change", (event) => { state.year = event.target.value; applyFilters(); });
elements.semester.addEventListener("change", (event) => { state.semester = event.target.value; applyFilters(); });
elements.sort.addEventListener("change", (event) => { state.sort = event.target.value; applyFilters(); });

elements.form.addEventListener("reset", () => {
  window.setTimeout(() => {
    Object.assign(state, { query: "", kind: "all", year: "all", semester: "all" });
    applyFilters();
  });
});

elements.timeline.addEventListener("click", (event) => {
  const button = event.target.closest("[data-year]");
  if (!button) return;
  state.year = state.year === button.dataset.year ? "all" : button.dataset.year;
  elements.year.value = state.year;
  applyFilters();
});

elements.loadMore.addEventListener("click", () => {
  state.visibleCount += PAGE_SIZE;
  renderRecords();
});

async function start() {
  try {
    const base = import.meta.env.BASE_URL;
    const [recordsResponse, summaryResponse] = await Promise.all([
      fetch(`${base}data/records.json`),
      fetch(`${base}data/summary.json`),
    ]);
    if (!recordsResponse.ok || !summaryResponse.ok) throw new Error("Data files could not be loaded.");

    const [records, summary] = await Promise.all([recordsResponse.json(), summaryResponse.json()]);
    state.records = records.map((record) => ({ ...record, _search: searchBlob(record) }));
    state.summary = summary;
    renderSummary();
    populateYears();
    applyFilters();
    registerWebMcpTools();
  } catch (error) {
    elements.status.textContent = "The archive could not be loaded. Please refresh the page and try again.";
    elements.timeline.innerHTML = '<p class="loading-note">Timeline unavailable.</p>';
    console.error(error);
  }
}

start();
