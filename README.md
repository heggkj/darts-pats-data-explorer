# Darts and Pats Named Entity Explorer

A PL2-styled, static web app for browsing every eligible Dart and Pat published in *The Breeze*, exploring named entities and events, and inspecting keyword-based topics.

## Explorer views

- **Named entities** is the starting view, with Topics beta alongside it. This visualization is one of a planned collection, not the collection's full-dataset landing page.
- **Explore the full archive** is secondary navigation. Until a dedicated visualization's URL is available, it opens the local **All entries** view: full-text search across published text, target and sender; year and entry-type filters; and with/without recognized entity filters. Search terms are case/accent-insensitive and all space-separated terms must occur. This view does not depend on an entity or topic match. Show more reaches every result without a fixed cap. Replace this internal navigation with the dedicated destination when its URL is confirmed.
- **Named entities** retains the cloud, search spotlight, year bars, balance meter and sidebar. It starts without an entity selection. Entity and archive filters are independent.
- **Topics · beta** uses 16 transparent keyword categories in `src/topics.js`, with per-topic Dart/Pat bars, disclosed rules and per-entry matched keywords. It shares the archive search/year/type/recognition filters, but the selected topic is not applied in All entries. Counts overlap and are not validated topic-model outputs or sentiment toward a topic.

The September 8 lookup update has 281 configured canonical entities, 278 of which occur in the saved 10,860-entry snapshot, including 15 Events. On that snapshot, 6,047 entries have a recognized entity and 4,813 do not. Every eligible entry is accessible regardless. These are operational match counts, not measured accuracy.

## Live data and entity analysis

On every page load—and whenever a visitor selects **Refresh data**—the app reads the public `parsed_rows` tab from the project Google Sheet through Google's read-only visualization endpoint. No API key or write access is stored in the site.

The named entity recognition runs in the visitor's browser using the transparent, campus-specific vocabulary in `src/entityDictionary.js`. Aliases such as “JMU,” “James Madison University,” and historical building or organization names are grouped under canonical entities. This is a research aid, not a substitute for human validation; precision and recall have not been measured against an independently annotated reference set. The cached `public/data/records.json` snapshot is used only when the live sheet is unavailable.

The original dictionary and 71 September 7 additions are retained, with September 8 approved changes in `src/lookupUpdates.js`. Events now separates events, holidays and observances from Misc. Two spaCy models (en_core_web_trf and en_core_web_lg, version 3.8.0) examined 10,860 eligible published texts. The candidate groups include fragments, duplicates and unreviewed names; they are not all promoted into the public catalogue. Review was AI-assisted inspection of selected source contexts, not independent annotation of every occurrence.

`src/entityMatching.js` favors the longest competing phrase at the same text span while retaining independent mentions elsewhere. Canonical IDs are deduplicated per record. `src/reviewedOccurrences.json` adds 190 exact-text-guarded historical occurrence decisions for short forms that were manually inspected in source context. If a live row changes text, its override is no longer applied. Full-phrase lookup matching still works on new rows automatically. The JACard product is separate from Card Services; bare Carrier is no longer a global library alias.

The first low-frequency alias pass includes Dukes Dining → JMU Dining Services, Madison Grille → Madison Grill, and the two source-verified short Gibbons building references → D-Hall. This is not a review of every low-frequency model candidate. Names such as John Alger are not automatically merged with similar existing names.

Unresolved or generic proposals remain held: unrestricted HOUSE, Chinese, Samaritan, Olympic, Madison, Duke, Friends, Bush, surnames and subject/language adjectives. Some have valid scoped full-name or reviewed-occurrence counterparts; absence of a broad alias does not reject the entire target. Historical Warren Campus Center and the Parents’/Family Weekend roll-up require further identity verification; the latter two remain separate Events. Original review decisions are preserved privately in the local analysis folder, not loaded from the public site.

Ambiguous names such as CARE, FLEX, HHS, GCOM, Canvas, Let's Go, CHOICES and Darts & Pats require source capitalization. This reduces generic-word matches but can miss lowercase/OCR variants; it does not resolve every contextual ambiguity. Counts are lookup matches, not model-confidence estimates. New live rows use the expanded catalogue without requiring a rebuild; discovering additional names still requires another review.

The explorer includes only `DART` and `PAT` rows from either source. Combined entries remain in the source but are excluded before entity analysis, so all displayed counts, search results, charts, and record lists use the same population. Chart legend counts and the balance gauge follow the selected entity and year. The gauge's descriptive bands are defined in `src/entryBalance.js` and explained in the page's Method section.

## Run the website locally

Visitors can find any recognized entity by its name or alias. Selecting a search result highlights it in the cloud and loads its records; an incompatible year or type filter is reset with a visible explanation. Every matching entity is included in one adaptive word cloud, and Scramble rearranges the full set. Long names are measured to fit; the cloud grows as needed instead of appending a separate list. The Breeze and WXJM are grouped with Organizations.

```powershell
pnpm install
pnpm dev
```

Open the local address printed by the development server. The production version is created with `pnpm build`.

Run `pnpm test` for archive pagination/filtering, new-row refresh, topic overlap, HTML escaping, approved merges, false-positive safeguards, cloud geometry and existing year/sidebar behavior. These checks run in GitHub Actions before deployment. They are code-level regressions, not browser visual QA. `scripts/build_reviewed_occurrences.mjs` reproduces the override data when the private, hash-pinned analysis files are present; it only prints JSON and does not publish.

## Data files and historical scripts

The repository retains these generated files for fallback, reproducibility, and earlier analyses:

- `public/data/records.json`: web-ready records
- `public/data/summary.json`: yearly and issue-level counts
- `public/data/records.csv.gz`: compact downloadable table
- `public/data/enrichment.json`: record-level topic and entity annotations
- `public/data/analysis.json`: aggregates and method metadata for the charts

The current named-entity interface does not require rebuilding these files when the Google Sheet changes. The original Excel workbook is not committed to this repository.
