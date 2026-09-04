# Web data schema

Each record in `public/data/records.json` contains:

| Field | Purpose |
| --- | --- |
| `id` | Stable record identifier |
| `date` | Publication date in `YYYY-MM-DD` format |
| `year` | Year filter and aggregation |
| `semester` | Fall or Spring filter |
| `kind` | Dart, Pat, or combined entry |
| `text` | Full published text |
| `target` | Short parsed target when available |
| `sender` | Short parsed sender description when available |
| `sourcePdf` | Source PDF filename |
| `newspaperPage` | Printed newspaper page |
| `pdfPage` | Page within the source PDF |
| `positionOnPage` | Entry order on the page |

The source workbook columns omitted from the web file are either redundant with these fields, derivable from `date`, long parsing intermediates, or internal coding metadata.

