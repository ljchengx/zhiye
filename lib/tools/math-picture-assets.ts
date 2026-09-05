import type { WorksheetIconKey } from "./math-worksheet";

export type MathPdfObjectAsset = WorksheetIconKey | "one-stick" | "ten-rod";
export type MathPdfCharacterAsset = "boo" | "bowser-jr" | "luigi" | "mario";

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

export const MATH_PDF_CHARACTER_SOURCES: Record<MathPdfCharacterAsset, string> = {
  boo: "/math-worksheet/characters/boo.png",
  "bowser-jr": "/math-worksheet/characters/bowser-jr.png",
  luigi: "/math-worksheet/characters/luigi.png",
  mario: "/math-worksheet/characters/mario.png",
};

const CHARACTER_SEQUENCE: readonly MathPdfCharacterAsset[] = ["mario", "luigi", "bowser-jr", "boo"];

export function getMathPdfCharacter(day: number): MathPdfCharacterAsset {
  return CHARACTER_SEQUENCE[(Math.max(1, Math.trunc(day)) - 1) % CHARACTER_SEQUENCE.length];
}
