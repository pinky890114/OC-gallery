import { Character } from "./types";

export const CHARACTERS: Character[] = Array.from({ length: 11 }).map((_, i) => ({
  id: `char-${i + 1}`,
  name: `Character ${i + 1}`,
  japaneseName: ["零", "壱", "弐", "参", "肆", "伍", "陸", "漆", "捌", "玖", "拾"][i],
  posterUrl: `https://picsum.photos/seed/oc-poster-${i + 1}/800/1200`,
  description: "這是一個充滿神秘感的角色，背負著不為人知的過去。在極簡的線條中，展現出獨特的靈魂與魅力。",
  settings: {
    age: `${18 + i}`,
    height: `${160 + i * 2}cm`,
    personality: "冷靜、優雅、略帶憂鬱",
    likes: ["黑咖啡", "古典樂", "深夜的街道"],
  },
  wardrobe: [
    { id: "w1", name: "日常服", imageUrl: `https://picsum.photos/seed/oc-w1-${i}/600/900` },
    { id: "w2", name: "戰鬥服", imageUrl: `https://picsum.photos/seed/oc-w2-${i}/600/900` },
    { id: "w3", name: "禮服", imageUrl: `https://picsum.photos/seed/oc-w3-${i}/600/900` },
  ],
  portfolio: Array.from({ length: 8 }).map((_, j) => ({
    id: `p-${j}`,
    imageUrl: `https://picsum.photos/seed/oc-p-${i}-${j}/${j % 2 === 0 ? 600 : 400}/${j % 3 === 0 ? 800 : 600}`,
    title: `Artwork ${j + 1}`,
  })),
}));
