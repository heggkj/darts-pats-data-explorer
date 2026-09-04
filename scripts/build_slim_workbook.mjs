import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const inputPath = process.argv[2];
const outputPath = process.argv[3];
if (!inputPath || !outputPath) {
  throw new Error("Usage: node build_slim_workbook.mjs records.json output.xlsx");
}

const records = JSON.parse(await fs.readFile(inputPath, "utf8"));
const headers = [
  "id",
  "date",
  "year",
  "semester",
  "kind",
  "text",
  "target",
  "sender",
  "sourcePdf",
  "newspaperPage",
  "pdfPage",
  "positionOnPage",
];

const rows = records.map((record) => [
  record.id,
  new Date(`${record.date}T00:00:00Z`),
  record.year,
  record.semester,
  record.kind,
  record.text,
  record.target,
  record.sender,
  record.sourcePdf,
  record.newspaperPage,
  record.pdfPage,
  record.positionOnPage,
]);

const workbook = Workbook.create();
const sheet = workbook.worksheets.add("records");
sheet.getRange("A1").write([headers, ...rows]);

const lastRow = rows.length + 1;
const fullRange = sheet.getRange(`A1:L${lastRow}`);
fullRange.format.font = { name: "Arial", size: 10 };
sheet.getRange("A1:L1").format = {
  fill: "#3B2567",
  font: { name: "Arial", size: 10, bold: true, color: "#FFFFFF" },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
sheet.getRange(`B2:B${lastRow}`).format.numberFormat = "yyyy-mm-dd";
sheet.getRange(`A2:A${lastRow}`).format.numberFormat = "0";
sheet.getRange(`C2:C${lastRow}`).format.numberFormat = "0";
sheet.getRange(`J2:L${lastRow}`).format.numberFormat = "0";

const widths = [10, 13, 8, 10, 15, 72, 28, 24, 20, 16, 11, 17];
widths.forEach((width, index) => {
  sheet.getRangeByIndexes(0, index, lastRow, 1).format.columnWidth = width;
});
sheet.getRange("A1:L1").format.rowHeight = 24;
sheet.freezePanes.freezeRows(1);
sheet.tables.add(`A1:L${lastRow}`, true, "DartsPatsRecords");

const preview = await workbook.render({
  sheetName: "records",
  range: "A1:L12",
  scale: 1,
  format: "png",
});
const previewPath = path.join(os.tmpdir(), "darts-pats-slim-preview.png");
await fs.writeFile(previewPath, new Uint8Array(await preview.arrayBuffer()));

const check = await workbook.inspect({
  kind: "table",
  sheetId: "records",
  range: "A1:L8",
  include: "values,formulas",
  tableMaxRows: 8,
  tableMaxCols: 12,
  maxChars: 8000,
});
console.log(check.ndjson);

const errors = await workbook.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A|#NUM!|#NULL!|#SPILL!|#CALC!",
  options: { useRegex: true, maxResults: 100 },
  summary: "final formula error scan",
});
console.log(errors.ndjson);

await fs.mkdir(path.dirname(outputPath), { recursive: true });
const output = await SpreadsheetFile.exportXlsx(workbook);
await output.save(outputPath);
console.log(JSON.stringify({ outputPath, previewPath, records: rows.length }));
