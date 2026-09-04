# Darts and Pats Data Explorer

A static, PL2-styled explorer for Darts and Pats published in *The Breeze*. It includes linked sentiment-balance, controlled-topic, and campus-entity views alongside the searchable source records.

## Refresh the data

Run the source conversion first, then the transparent first-pass analysis:

```powershell
python scripts/build_data.py "..\Darts-and-Pats_dataset_parsed.xlsx"
python scripts/enrich_data.py
```

The analysis vocabulary is defined near the top of `scripts/enrich_data.py`. Topic and entity labels require human validation before formal research use.

## Run the website locally

```powershell
pnpm install
pnpm dev
```

Open the local address printed by the development server. The production version is created with `pnpm build`.

## Data files

The website uses files generated from the source workbook:

- `public/data/records.json`: web-ready records
- `public/data/summary.json`: yearly and issue-level counts
- `public/data/records.csv.gz`: compact downloadable table
- `public/data/enrichment.json`: record-level topic and entity annotations
- `public/data/analysis.json`: aggregates and method metadata for the charts

The original Excel workbook is not committed to this repository.
