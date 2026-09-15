import {
  MATH_WORKSHEET_CHARACTER_ASSETS,
  type MathPdfCharacterAsset,
} from "./math-picture-assets";

export type LocalWorksheetImageMimeType = "image/png" | "image/jpeg";

export interface LocalWorksheetCharacterAsset {
  name: MathPdfCharacterAsset;
  file: File;
  url: string;
  mimeType: LocalWorksheetImageMimeType;
}

export type LocalWorksheetCharacterMap = Partial<Record<MathPdfCharacterAsset, LocalWorksheetCharacterAsset>>;

export interface WorksheetCharacterFolderResult {
  assets: LocalWorksheetCharacterMap;
  scannedFiles: number;
  matchedFiles: number;
  ignoredFiles: number;
  duplicateFiles: number;
}

const CHARACTER_NAMES = new Set(MATH_WORKSHEET_CHARACTER_ASSETS.map(({ name }) => name));
const CHARACTER_NAME_BY_TOKEN = new Map(
  MATH_WORKSHEET_CHARACTER_ASSETS.map(({ name }) => [normalizeToken(name), name]),
);

function normalizeToken(value: string) {
  return value.toLocaleLowerCase().replace(/[^a-z0-9]+/g, "");
}

function getExtension(filePath: string) {
  const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
  const extension = fileName.split(".").pop();
  return extension?.toLocaleLowerCase() ?? "";
}

function getBaseName(filePath: string) {
  const fileName = filePath.split(/[\\/]/).pop() ?? filePath;
  return fileName.replace(/\.[^.]+$/, "");
}

function hasNumberBlockFolder(filePath: string) {
  return /(?:number[-_ ]?blocks?|数字积木)/iu.test(filePath);
}

function getNumberBlockName(baseName: string, filePath: string): MathPdfCharacterAsset | null {
  const compactName = normalizeToken(baseName);
  const match = compactName.match(/^(?:numberblocks?|nb)?(\d{1,2})(?:better|image|character|nb)?$/);
  if (!match || (!compactName.startsWith("number") && !compactName.startsWith("nb") && !hasNumberBlockFolder(filePath))) {
    return null;
  }
  const number = Number(match[1]);
  if (number < 1 || number > 20) return null;
  return `number-block-${number}` as MathPdfCharacterAsset;
}

export function matchWorksheetCharacterAsset(filePath: string): MathPdfCharacterAsset | null {
  const baseName = getBaseName(filePath);
  const directMatch = CHARACTER_NAME_BY_TOKEN.get(normalizeToken(baseName));
  if (directMatch && CHARACTER_NAMES.has(directMatch)) return directMatch;

  if (normalizeToken(baseName) === "bowserjr") return "bowser-jr";
  return getNumberBlockName(baseName, filePath);
}

function getImageMimeType(file: File) {
  if (file.type === "image/png" || file.type === "image/jpeg") return file.type;
  const extension = getExtension(file.name);
  if (extension === "png") return "image/png" as const;
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg" as const;
  return null;
}

function getCandidateScore(filePath: string, asset: MathPdfCharacterAsset) {
  const path = filePath.toLocaleLowerCase();
  const segments = filePath.split(/[\\/]/).filter(Boolean).length;
  let score = -segments;
  if (/characters?|角色|人物/iu.test(path)) score += 20;
  if (asset.startsWith("number-block-") && /number[-_ ]?blocks?|数字积木/iu.test(path)) score += 10;
  if (getBaseName(filePath).toLocaleLowerCase() === asset) score += 5;
  return score;
}

export function readWorksheetCharacterFolder(files: readonly File[]): WorksheetCharacterFolderResult {
  const assets: LocalWorksheetCharacterMap = {};
  const scores = new Map<MathPdfCharacterAsset, number>();
  let ignoredFiles = 0;
  let duplicateFiles = 0;

  for (const file of files) {
    const mimeType = getImageMimeType(file);
    const filePath = file.webkitRelativePath || file.name;
    const name = matchWorksheetCharacterAsset(filePath);
    if (!mimeType || !name) {
      ignoredFiles += 1;
      continue;
    }

    const score = getCandidateScore(filePath, name);
    const previous = assets[name];
    if (previous) {
      duplicateFiles += 1;
      if ((scores.get(name) ?? Number.NEGATIVE_INFINITY) >= score) continue;
      URL.revokeObjectURL(previous.url);
    }

    assets[name] = {
      name,
      file,
      url: URL.createObjectURL(file),
      mimeType,
    };
    scores.set(name, score);
  }

  return {
    assets,
    scannedFiles: files.length,
    matchedFiles: Object.keys(assets).length,
    ignoredFiles,
    duplicateFiles,
  };
}

export function releaseWorksheetCharacterFolder(assets: LocalWorksheetCharacterMap) {
  for (const asset of Object.values(assets)) {
    if (asset) URL.revokeObjectURL(asset.url);
  }
}
