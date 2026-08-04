import { VocabSet } from "@/types/vocab";

export function exportSetAsCSV(vocabSet: VocabSet): void {
  const header = "english,chinese,example,exampleChinese,similar,familiarity";
  const rows = vocabSet.words.map((w) => {
    const english = escapeCsvField(w.english);
    const chinese = escapeCsvField(w.chinese);
    const example = escapeCsvField(w.example || "");
    const exampleChinese = escapeCsvField(w.exampleChinese || "");
    const similar = escapeCsvField(w.similar || "");
    const familiarity = w.familiarity.toString();
    return `${english},${chinese},${example},${exampleChinese},${similar},${familiarity}`;
  });

  const csv = [header, ...rows].join("\n");
  downloadFile(csv, `${vocabSet.name}.csv`, "text/csv;charset=utf-8;");
}

export function exportSetAsJSON(vocabSet: VocabSet): void {
  const json = JSON.stringify(vocabSet, null, 2);
  downloadFile(json, `${vocabSet.name}.json`, "application/json;charset=utf-8;");
}

function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const BOM = "\uFEFF"; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([BOM + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
