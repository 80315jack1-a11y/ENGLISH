"use client";

import { useEffect, useState, useCallback } from "react";
import { VocabWord, VocabSet } from "@/types/vocab";
import {
  getAllSets,
  getActiveSet,
  setActiveSetId,
  updateWordFamiliarity,
} from "@/lib/storage";
import { exportSetAsCSV } from "@/lib/export";
import Link from "next/link";

// Fisher-Yates shuffle - returns a new shuffled array
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function HomePage() {
  const [vocabSet, setVocabSet] = useState<VocabSet | null>(null);
  const [allSets, setAllSets] = useState<VocabSet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [officeMode, setOfficeMode] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [displayOrder, setDisplayOrder] = useState<number[]>([]);
  const [filter, setFilter] = useState<0 | 1 | 2 | 3>(0); // 0=全部, 1=不會, 2=普通, 3=熟悉

  // Build display order based on filter + shuffle
  const buildDisplayOrder = useCallback(
    (words: VocabWord[], doShuffle: boolean, filterLevel: 0 | 1 | 2 | 3) => {
      let indices = words.map((_, i) => i);
      if (filterLevel > 0) {
        indices = indices.filter((i) => words[i].familiarity === filterLevel);
      }
      return doShuffle ? shuffleArray(indices) : indices;
    },
    []
  );

  // Load data
  useEffect(() => {
    const sets = getAllSets();
    setAllSets(sets);
    const active = getActiveSet();
    if (active) {
      setVocabSet(active);
      setDisplayOrder(buildDisplayOrder(active.words, false, 0));
    }
  }, [buildDisplayOrder]);

  const currentWord: VocabWord | null =
    vocabSet && vocabSet.words.length > 0 && displayOrder.length > 0
      ? vocabSet.words[displayOrder[currentIndex]]
      : null;

  const goNext = useCallback(() => {
    if (!vocabSet || displayOrder.length === 0) return;
    setRevealed(false);
    setCurrentIndex((prev) =>
      prev < displayOrder.length - 1 ? prev + 1 : 0
    );
  }, [vocabSet, displayOrder]);

  const goPrev = useCallback(() => {
    if (!vocabSet || displayOrder.length === 0) return;
    setRevealed(false);
    setCurrentIndex((prev) =>
      prev > 0 ? prev - 1 : displayOrder.length - 1
    );
  }, [vocabSet, displayOrder]);

  const handleTap = useCallback(() => {
    if (!revealed) {
      setRevealed(true);
    } else {
      goNext();
    }
  }, [revealed, goNext]);

  const handleFamiliarity = useCallback(
    (level: 1 | 2 | 3) => {
      if (!vocabSet || !currentWord) return;
      const actualIndex = displayOrder[currentIndex];
      updateWordFamiliarity(vocabSet.id, currentWord.id, level);
      // Update local state
      setVocabSet((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, words: [...prev.words] };
        updated.words[actualIndex] = {
          ...updated.words[actualIndex],
          familiarity: level,
        };
        return updated;
      });
      goNext();
    },
    [vocabSet, currentWord, currentIndex, displayOrder, goNext]
  );

  // Keyboard listeners
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if focus is on an input/select element
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case " ":
          e.preventDefault();
          handleTap();
          break;
        case "ArrowRight":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "1":
          handleFamiliarity(1);
          break;
        case "2":
          handleFamiliarity(2);
          break;
        case "3":
          handleFamiliarity(3);
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleTap, goNext, goPrev, handleFamiliarity]);

  const handleSetChange = (setId: string) => {
    setActiveSetId(setId);
    const selected = allSets.find((s) => s.id === setId);
    if (selected) {
      setVocabSet(selected);
      setCurrentIndex(0);
      setRevealed(false);
      setDisplayOrder(buildDisplayOrder(selected.words, shuffled, filter));
    }
  };

  const toggleShuffle = () => {
    if (!vocabSet) return;
    const newShuffled = !shuffled;
    setShuffled(newShuffled);
    setCurrentIndex(0);
    setRevealed(false);
    setDisplayOrder(buildDisplayOrder(vocabSet.words, newShuffled, filter));
  };

  const handleFilterChange = (level: 0 | 1 | 2 | 3) => {
    if (!vocabSet) return;
    setFilter(level);
    setCurrentIndex(0);
    setRevealed(false);
    setDisplayOrder(buildDisplayOrder(vocabSet.words, shuffled, level));
  };

  // Text-to-speech for pronunciation
  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  }, []);

  // Auto-speak when card changes
  useEffect(() => {
    if (currentWord) {
      speak(currentWord.english);
    }
  }, [currentIndex, displayOrder, currentWord, speak]);

  // No sets available
  if (allSets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">📚 英文單字卡</h1>
          <p className="text-gray-600 mb-8">
            還沒有匯入任何單字，先匯入你的 IELTS 單字庫吧！
          </p>
          <Link
            href="/import"
            className="inline-block bg-[var(--accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--accent-hover)] transition-colors"
          >
            匯入單字
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-3 border-b bg-white">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold">📚 英文單字卡</h1>
          <select
            value={vocabSet?.id || ""}
            onChange={(e) => handleSetChange(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            {allSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.words.length} 字)
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setOfficeMode(!officeMode)}
            className={`text-sm px-3 py-1 rounded border transition-colors ${
              officeMode
                ? "bg-gray-800 text-white border-gray-800"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {officeMode ? "🕶️ Office Mode" : "👁️ 一般模式"}
          </button>
          <button
            onClick={toggleShuffle}
            className={`text-sm px-3 py-1 rounded border transition-colors ${
              shuffled
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {shuffled ? "🔀 隨機" : "📋 順序"}
          </button>
          {vocabSet && (
            <button
              onClick={() => exportSetAsCSV(vocabSet)}
              className="text-sm px-3 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
            >
              匯出 CSV
            </button>
          )}
          <Link
            href="/import"
            className="text-sm px-3 py-1 rounded border border-gray-300 hover:border-gray-400 transition-colors"
          >
            匯入
          </Link>
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-b">
        <span className="text-xs text-gray-500 mr-1">篩選：</span>
        {([
          { level: 0, label: "全部", color: "gray" },
          { level: 1, label: "不會", color: "red" },
          { level: 2, label: "普通", color: "yellow" },
          { level: 3, label: "熟悉", color: "green" },
        ] as const).map(({ level, label, color }) => (
          <button
            key={level}
            onClick={() => handleFilterChange(level)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
              filter === level
                ? level === 0
                  ? "bg-gray-700 text-white border-gray-700"
                  : level === 1
                  ? "bg-red-500 text-white border-red-500"
                  : level === 2
                  ? "bg-yellow-500 text-white border-yellow-500"
                  : "bg-green-500 text-white border-green-500"
                : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
            }`}
          >
            {label}
            {vocabSet && level > 0 && (
              <span className="ml-1">
                ({vocabSet.words.filter((w) => w.familiarity === level).length})
              </span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-400">
          {displayOrder.length} 字
        </span>
      </div>

      {/* Main card area */}
      <main
        className="flex-1 flex flex-col items-center justify-center p-6 cursor-pointer select-none"
        onClick={handleTap}
      >
        {currentWord ? (
          <div className="w-full max-w-lg">
            {/* Progress */}
            <div className="text-center text-sm text-gray-400 mb-6">
              {currentIndex + 1} / {displayOrder.length}
            </div>

            {/* Card */}
            <div
              className={`bg-white rounded-2xl shadow-lg p-10 text-center border-2 transition-all ${
                currentWord.familiarity === 1
                  ? "border-red-300"
                  : currentWord.familiarity === 2
                  ? "border-yellow-300"
                  : currentWord.familiarity === 3
                  ? "border-green-300"
                  : "border-transparent"
              }`}
            >
              {/* English word - always visible */}
              <h2 className="text-4xl font-bold mb-4 text-gray-900">
                {currentWord.english}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    speak(currentWord.english);
                  }}
                  className="ml-3 text-2xl text-gray-400 hover:text-blue-500 transition-colors align-middle"
                  title="播放發音"
                >
                  🔊
                </button>
              </h2>

              {/* Chinese + Example - reveal on tap/space */}
              {revealed && (
                <div className="mt-6 animate-fadeIn">
                  {(!officeMode || revealed) && (
                    <>
                      <p className="text-2xl text-blue-600 mb-4">
                        {currentWord.chinese}
                      </p>
                      {currentWord.example && (
                        <p className="text-gray-500 text-base italic leading-relaxed">
                          {currentWord.example}
                        </p>
                      )}
                      {currentWord.exampleChinese && (
                        <p className="text-gray-400 text-sm mt-1 leading-relaxed">
                          {currentWord.exampleChinese}
                        </p>
                      )}
                      {currentWord.similar && (
                        <div className="mt-4 pt-3 border-t border-gray-100">
                          <p className="text-xs text-gray-400 mb-1">相似字</p>
                          <p className="text-sm text-purple-600 font-medium">
                            {currentWord.similar.split(/[/,;、]/).map((s, i) => (
                              <span key={i} className="inline-block bg-purple-50 rounded px-2 py-0.5 mr-1.5 mb-1">
                                {s.trim()}
                              </span>
                            ))}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Hint */}
              {!revealed && (
                <p className="text-gray-300 text-sm mt-6">
                  點擊或按 Space 顯示答案
                </p>
              )}
            </div>

            {/* Familiarity buttons */}
            <div className="flex justify-center gap-3 mt-8">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFamiliarity(1);
                }}
                className="px-4 py-2 rounded-lg border-2 border-red-300 bg-red-50 text-red-700 font-medium hover:bg-red-100 transition-colors"
              >
                1 不會
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFamiliarity(2);
                }}
                className="px-4 py-2 rounded-lg border-2 border-yellow-300 bg-yellow-50 text-yellow-700 font-medium hover:bg-yellow-100 transition-colors"
              >
                2 普通
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleFamiliarity(3);
                }}
                className="px-4 py-2 rounded-lg border-2 border-green-300 bg-green-50 text-green-700 font-medium hover:bg-green-100 transition-colors"
              >
                3 熟悉
              </button>
            </div>

            {/* Navigation hint */}
            <div className="text-center text-xs text-gray-400 mt-6">
              ← → 切換單字 ｜ Space 翻牌 ｜ 1/2/3 標記熟悉度
            </div>
          </div>
        ) : (
          <p className="text-gray-400">
            {displayOrder.length === 0 && filter > 0
              ? `沒有標記為「${filter === 1 ? "不會" : filter === 2 ? "普通" : "熟悉"}」的單字`
              : "此單字集沒有單字"}
          </p>
        )}
      </main>
    </div>
  );
}
