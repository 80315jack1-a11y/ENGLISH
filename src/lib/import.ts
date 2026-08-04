import Papa from "papaparse";
import * as XLSX from "xlsx";
import { VocabWord, VocabSet } from "@/types/vocab";
import { generateId } from "./storage";

interface RawRow {
  english?: string;
  chinese?: string;
  example?: string;
  exampleChinese?: string;
  similar?: string;
  [key: string]: string | undefined;
}

function normalizeRows(rows: Record<string, string>[]): RawRow[] {
  return rows.map((row) => {
    const keys = Object.keys(row);
    // Try to match column names flexibly
    const english =
      row["english"] ||
      row["English"] ||
      row["ENGLISH"] ||
      row["word"] ||
      row["Word"] ||
      row["單字"] ||
      row["英文"] ||
      keys[0] && row[keys[0]];
    const chinese =
      row["chinese"] ||
      row["Chinese"] ||
      row["CHINESE"] ||
      row["meaning"] ||
      row["Meaning"] ||
      row["中文"] ||
      row["意思"] ||
      keys[1] && row[keys[1]];
    const example =
      row["example"] ||
      row["Example"] ||
      row["EXAMPLE"] ||
      row["sentence"] ||
      row["Sentence"] ||
      row["例句"] ||
      keys[2] && row[keys[2]];
    const exampleChinese =
      row["exampleChinese"] ||
      row["ExampleChinese"] ||
      row["example_chinese"] ||
      row["例句中文"] ||
      row["句子中文"] ||
      keys[3] && row[keys[3]];
    const similar =
      row["similar"] ||
      row["Similar"] ||
      row["SIMILAR"] ||
      row["相似字"] ||
      row["同義字"] ||
      keys[4] && row[keys[4]];

    return { english, chinese, example, exampleChinese, similar };
  });
}

function rowsToWords(rows: RawRow[]): VocabWord[] {
  return rows
    .filter((r) => r.english && r.chinese)
    .map((r) => ({
      id: generateId(),
      english: r.english!.trim(),
      chinese: r.chinese!.trim(),
      example: r.example?.trim() || undefined,
      exampleChinese: r.exampleChinese?.trim() || undefined,
      similar: r.similar?.trim() || undefined,
      familiarity: 0 as const,
    }));
}

export async function importCSV(file: File): Promise<VocabWord[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = normalizeRows(results.data as Record<string, string>[]);
        resolve(rowsToWords(rows));
      },
      error: (err) => reject(err),
    });
  });
}

export async function importExcel(file: File): Promise<VocabWord[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);
  const normalized = normalizeRows(rows);
  return rowsToWords(normalized);
}

export async function importFile(file: File): Promise<VocabWord[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) {
    return importCSV(file);
  } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    return importExcel(file);
  }
  throw new Error("不支援的檔案格式，請使用 CSV 或 Excel (.xlsx/.xls)");
}

export function createSetFromWords(name: string, words: VocabWord[]): VocabSet {
  return {
    id: generateId(),
    name,
    words,
    createdAt: new Date().toISOString(),
  };
}
