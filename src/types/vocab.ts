export interface VocabWord {
  id: string;
  english: string;
  chinese: string;
  example?: string;
  exampleChinese?: string;
  similar?: string;
  familiarity: 0 | 1 | 2 | 3; // 0=未標記, 1=不會, 2=普通, 3=熟悉
}

export interface VocabSet {
  id: string;
  name: string;
  words: VocabWord[];
  createdAt: string;
}
