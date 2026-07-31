"use client";

import { useState, useRef } from "react";
import { importFile, createSetFromWords } from "@/lib/import";
import { saveSet, setActiveSetId } from "@/lib/storage";
import { VocabWord } from "@/types/vocab";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<VocabWord[] | null>(null);
  const [setName, setSetName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const words = await importFile(file);
      if (words.length === 0) {
        setError("檔案中沒有找到有效的單字資料。請確認格式包含 english 和 chinese 欄位。");
        setPreview(null);
      } else {
        setPreview(words);
        // Default set name from file name
        const baseName = file.name.replace(/\.(csv|xlsx|xls)$/i, "");
        setSetName(baseName);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "匯入失敗，請確認檔案格式");
      setPreview(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleSave = () => {
    if (!preview || preview.length === 0) return;
    const name = setName.trim() || "未命名單字集";
    const vocabSet = createSetFromWords(name, preview);
    saveSet(vocabSet);
    setActiveSetId(vocabSet.id);
    router.push("/");
  };

  return (
    <div className="min-h-screen p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">📥 匯入單字</h1>
        <Link
          href="/"
          className="text-sm px-3 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
        >
          返回
        </Link>
      </div>

      {/* Format guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">📋 檔案格式說明</h3>
        <p className="text-sm text-blue-700 mb-2">
          支援 CSV 和 Excel (.xlsx / .xls) 格式，欄位需包含：
        </p>
        <div className="bg-white rounded p-3 font-mono text-xs">
          <div className="text-gray-500">english, chinese, example, exampleChinese (後兩者選填)</div>
          <div>abandon, 放棄, He decided to abandon the plan., 他決定放棄這個計畫。</div>
          <div>abundant, 豐富的, The region has abundant resources., 該地區有豐富的資源。</div>
        </div>
        <p className="text-xs text-blue-600 mt-2">
          欄位名稱也可以用：word/單字/英文、meaning/意思/中文、sentence/例句、例句中文
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors cursor-pointer ${
          dragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleInputChange}
        />
        {loading ? (
          <div className="text-gray-500">正在解析檔案...</div>
        ) : (
          <>
            <div className="text-4xl mb-3">📁</div>
            <p className="text-gray-600 font-medium">
              拖曳檔案到這裡，或點擊選擇檔案
            </p>
            <p className="text-gray-400 text-sm mt-2">
              支援 .csv / .xlsx / .xls
            </p>
          </>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="mt-6">
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              placeholder="單字集名稱"
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button
              onClick={handleSave}
              className="bg-[var(--accent)] text-white px-5 py-2 rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors"
            >
              儲存 ({preview.length} 字)
            </button>
          </div>

          {/* Preview table */}
          <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    #
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    English
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    中文
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    例句
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-gray-600">
                    例句中文
                  </th>
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 50).map((word, i) => (
                  <tr key={word.id} className="border-t">
                    <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                    <td className="px-3 py-2 font-medium">{word.english}</td>
                    <td className="px-3 py-2 text-blue-600">{word.chinese}</td>
                    <td className="px-3 py-2 text-gray-500 truncate max-w-[180px]">
                      {word.example || "-"}
                    </td>
                    <td className="px-3 py-2 text-gray-400 truncate max-w-[180px]">
                      {word.exampleChinese || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length > 50 && (
              <div className="text-center text-xs text-gray-400 py-2 bg-gray-50">
                顯示前 50 筆，共 {preview.length} 筆
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
