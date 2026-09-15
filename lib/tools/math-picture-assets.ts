import type { WorksheetIconKey } from "./math-worksheet";

export type MathPdfObjectAsset = WorksheetIconKey | "one-stick" | "ten-rod";

export const MATH_WORKSHEET_CHARACTER_ASSETS = [
  { name: "mario", src: "/math-worksheet/characters/mario.png" },
  { name: "luigi", src: "/math-worksheet/characters/luigi.png" },
  { name: "bowser-jr", src: "/math-worksheet/characters/bowser-jr.png" },
  { name: "boo", src: "/math-worksheet/characters/boo.png" },
  { name: "number-block-1", src: "/math-worksheet/characters/number-block-1.png" },
  { name: "number-block-2", src: "/math-worksheet/characters/number-block-2.png" },
  { name: "number-block-3", src: "/math-worksheet/characters/number-block-3.png" },
  { name: "number-block-4", src: "/math-worksheet/characters/number-block-4.png" },
  { name: "number-block-5", src: "/math-worksheet/characters/number-block-5.png" },
  { name: "number-block-6", src: "/math-worksheet/characters/number-block-6.png" },
  { name: "number-block-7", src: "/math-worksheet/characters/number-block-7.png" },
  { name: "number-block-8", src: "/math-worksheet/characters/number-block-8.png" },
  { name: "number-block-9", src: "/math-worksheet/characters/number-block-9.png" },
  { name: "number-block-10", src: "/math-worksheet/characters/number-block-10.png" },
  { name: "number-block-11", src: "/math-worksheet/characters/number-block-11.png" },
  { name: "number-block-12", src: "/math-worksheet/characters/number-block-12.png" },
  { name: "number-block-13", src: "/math-worksheet/characters/number-block-13.png" },
  { name: "number-block-14", src: "/math-worksheet/characters/number-block-14.png" },
  { name: "number-block-15", src: "/math-worksheet/characters/number-block-15.png" },
  { name: "number-block-16", src: "/math-worksheet/characters/number-block-16.png" },
  { name: "number-block-17", src: "/math-worksheet/characters/number-block-17.png" },
  { name: "number-block-18", src: "/math-worksheet/characters/number-block-18.png" },
  { name: "number-block-19", src: "/math-worksheet/characters/number-block-19.png" },
  { name: "number-block-20", src: "/math-worksheet/characters/number-block-20.png" },
] as const;

export type MathPdfCharacterAsset = typeof MATH_WORKSHEET_CHARACTER_ASSETS[number]["name"];

export const MATH_PDF_OBJECT_SOURCES: Record<MathPdfObjectAsset, string> = {
  apple: "/math-worksheet/pdf-objects/apple.png",
  ball: "/math-worksheet/pdf-objects/ball.png",
  balloon: "/math-worksheet/pdf-objects/balloon.png",
  block: "/math-worksheet/pdf-objects/block.png",
  book: "/math-worksheet/pdf-objects/book.png",
  coin: "/math-worksheet/pdf-objects/coin.png",
  cookie: "/math-worksheet/pdf-objects/cookie.png",
  fish: "/math-worksheet/pdf-objects/fish.png",
  flower: "/math-worksheet/pdf-objects/flower.png",
  heart: "/math-worksheet/pdf-objects/heart.png",
  mushroom: "/math-worksheet/pdf-objects/mushroom.png",
  "one-stick": "/math-worksheet/pdf-objects/one-stick.png",
  pineapple: "/math-worksheet/pdf-objects/pineapple.png",
  star: "/math-worksheet/pdf-objects/star.png",
  "ten-rod": "/math-worksheet/pdf-objects/ten-rod.png",
};

export const MATH_PDF_CHARACTER_SOURCES: Record<MathPdfCharacterAsset, string> = Object.fromEntries(
  MATH_WORKSHEET_CHARACTER_ASSETS.map(({ name, src }) => [name, src]),
) as Record<MathPdfCharacterAsset, string>;

const CHARACTER_SEQUENCE = MATH_WORKSHEET_CHARACTER_ASSETS.map(({ name }) => name);

export function getMathPdfCharacter(day: number): MathPdfCharacterAsset {
  return CHARACTER_SEQUENCE[(Math.max(1, Math.trunc(day)) - 1) % CHARACTER_SEQUENCE.length];
}
