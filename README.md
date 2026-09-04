# Darts and Pats Data Explorer

An interactive web explorer for Darts and Pats published in *The Breeze*.

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

The original Excel workbook is not committed to this repository.

## Rebuild the data

Run the data builder and pass the source workbook as its argument:

```powershell
python scripts/build_data.py "path/to/Darts-and-Pats_dataset_parsed.xlsx"
```

The builder keeps the fields needed for filtering, searching, display, and source identification. Dates are stored as `YYYY-MM-DD`; numbers are stored as numbers; missing values are stored as `null`.
