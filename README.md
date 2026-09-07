# Darts and Pats Named Entity Explorer

A PL2-styled, static web app for exploring named people, organizations, campus groups, buildings, places, and businesses mentioned in Darts and Pats published in *The Breeze*.

## Live data and entity analysis

On every page load—and whenever a visitor selects **Refresh data**—the app reads the public `parsed_rows` tab from the project Google Sheet through Google's read-only visualization endpoint. No API key or write access is stored in the site.

The named entity recognition runs in the visitor's browser using the transparent, campus-specific vocabulary in `src/entityDictionary.js`. Aliases such as “JMU,” “James Madison University,” and historical building or organization names are grouped under canonical entities. This is a high-precision research aid, not a substitute for human validation. The cached `public/data/records.json` snapshot is used only when the live sheet is unavailable.

## Run the website locally

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
