# Darts and Pats Named Entity Explorer

A PL2-styled, static web app for exploring named people, organizations, campus groups, buildings, places, and businesses mentioned in Darts and Pats published in *The Breeze*.

## Live data and entity analysis

On every page load—and whenever a visitor selects **Refresh data**—the app reads the public `parsed_rows` tab from the project Google Sheet through Google's read-only visualization endpoint. No API key or write access is stored in the site.

The named entity recognition runs in the visitor's browser using the transparent, campus-specific vocabulary in `src/entityDictionary.js`. Aliases such as “JMU,” “James Madison University,” and historical building or organization names are grouped under canonical entities. This is a research aid, not a substitute for human validation; precision and recall have not been measured against an independently annotated reference set. The cached `public/data/records.json` snapshot is used only when the live sheet is unavailable.

The original 115-entry dictionary is extended by all 71 source-supported names from the September 7, 2026 NER review in `src/reviewedEntities.js`. Each addition retains the inspected source record IDs and a review note. Two spaCy models (en_core_web_trf and en_core_web_lg, version 3.8.0) examined 10,860 eligible published texts. Review was AI-assisted inspection of selected source contexts, not independent human annotation of every occurrence. The 5,552 raw candidate groups include fragments, duplicates and unreviewed names and are not all promoted into the public catalogue. Proposed aliases remain separate until reviewed. Misc. holds supported entities outside the existing types (events, technology, courses, services, products, creative works and additional publication titles). Existing categories remain unchanged.

Ambiguous new names such as CARE, FLEX, HHS, GCOM, Canvas, Let's Go and Darts & Pats require source capitalization. This reduces generic-word matches but can miss lowercase/OCR variants; it does not resolve every contextual ambiguity. Counts are dictionary matches, not model-confidence estimates. New live rows use the expanded catalogue without requiring a rebuild; discovering additional names still requires another review. The page starts with no selected entity, all years and all types.

The explorer includes only `DART` and `PAT` rows from either source. Combined entries remain in the source but are excluded before entity analysis, so all displayed counts, search results, charts, and record lists use the same population. Chart legend counts and the balance gauge follow the selected entity and year. The gauge's descriptive bands are defined in `src/entryBalance.js` and explained in the page's Method section.

## Run the website locally

Visitors can find any recognized entity by its name or alias. Selecting a search result highlights it in the cloud and loads its records; an incompatible year or type filter is reset with a visible explanation. Every matching entity is included in one adaptive word cloud, and Scramble rearranges the full set. Long names are measured to fit; the cloud grows as needed instead of appending a separate list. The Breeze and WXJM are grouped with Organizations.

```powershell
pnpm install
pnpm dev
```

Open the local address printed by the development server. The production version is created with `pnpm build`.

## Data files and historical scripts

The repository retains these generated files for fallback, reproducibility, and earlier analyses:

- `public/data/records.json`: web-ready records
- `public/data/summary.json`: yearly and issue-level counts
- `public/data/records.csv.gz`: compact downloadable table
- `public/data/enrichment.json`: record-level topic and entity annotations
- `public/data/analysis.json`: aggregates and method metadata for the charts

The current named-entity interface does not require rebuilding these files when the Google Sheet changes. The original Excel workbook is not committed to this repository.
