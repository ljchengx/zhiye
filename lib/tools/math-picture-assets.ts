import type { WorksheetIconKey } from "./number-sense/drawing";

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

/** 表头用的角色图，来自本地素材库；只在实际用到时才加载。 */
export const MATH_WORKSHEET_HEADER_ASSETS = [
  { name: "banjo_and_kazooie_01", src: "/math-worksheet/characters/headers/banjo_and_kazooie_01.png" },
  { name: "bayonetta_01", src: "/math-worksheet/characters/headers/bayonetta_01.png" },
  { name: "black_pit_01", src: "/math-worksheet/characters/headers/black_pit_01.png" },
  { name: "byleth_01", src: "/math-worksheet/characters/headers/byleth_01.png" },
  { name: "captain_falcon_01", src: "/math-worksheet/characters/headers/captain_falcon_01.png" },
  { name: "chrom_01", src: "/math-worksheet/characters/headers/chrom_01.png" },
  { name: "cloud_01", src: "/math-worksheet/characters/headers/cloud_01.png" },
  { name: "daisy_01", src: "/math-worksheet/characters/headers/daisy_01.png" },
  { name: "dark_samus_01", src: "/math-worksheet/characters/headers/dark_samus_01.png" },
  { name: "dedede_01", src: "/math-worksheet/characters/headers/dedede_01.png" },
  { name: "diddy_kong_01", src: "/math-worksheet/characters/headers/diddy_kong_01.png" },
  { name: "donkey_kong_01", src: "/math-worksheet/characters/headers/donkey_kong_01.png" },
  { name: "dq_hero_01", src: "/math-worksheet/characters/headers/dq_hero_01.png" },
  { name: "dr_mario_01", src: "/math-worksheet/characters/headers/dr_mario_01.png" },
  { name: "duck_hunt_01", src: "/math-worksheet/characters/headers/duck_hunt_01.png" },
  { name: "falco_01", src: "/math-worksheet/characters/headers/falco_01.png" },
  { name: "fox_01", src: "/math-worksheet/characters/headers/fox_01.png" },
  { name: "ganondorf_01", src: "/math-worksheet/characters/headers/ganondorf_01.png" },
  { name: "gaogaen_01", src: "/math-worksheet/characters/headers/gaogaen_01.png" },
  { name: "gekkouga_01", src: "/math-worksheet/characters/headers/gekkouga_01.png" },
  { name: "homura_01", src: "/math-worksheet/characters/headers/homura_01.png" },
  { name: "ice_climber_01", src: "/math-worksheet/characters/headers/ice_climber_01.png" },
  { name: "ike_01", src: "/math-worksheet/characters/headers/ike_01.png" },
  { name: "inkling_01", src: "/math-worksheet/characters/headers/inkling_01.png" },
  { name: "joker_01", src: "/math-worksheet/characters/headers/joker_01.png" },
  { name: "kamui_01", src: "/math-worksheet/characters/headers/kamui_01.png" },
  { name: "kazuya_01", src: "/math-worksheet/characters/headers/kazuya_01.png" },
  { name: "ken_01", src: "/math-worksheet/characters/headers/ken_01.png" },
  { name: "king_k_rool_01", src: "/math-worksheet/characters/headers/king_k_rool_01.png" },
  { name: "kirby_01", src: "/math-worksheet/characters/headers/kirby_01.png" },
  { name: "koopa_01", src: "/math-worksheet/characters/headers/koopa_01.png" },
  { name: "koopa_jr_01", src: "/math-worksheet/characters/headers/koopa_jr_01.png" },
  { name: "link_01", src: "/math-worksheet/characters/headers/link_01.png" },
  { name: "little_mac_01", src: "/math-worksheet/characters/headers/little_mac_01.png" },
  { name: "lucario_01", src: "/math-worksheet/characters/headers/lucario_01.png" },
  { name: "lucas_01", src: "/math-worksheet/characters/headers/lucas_01.png" },
  { name: "lucina_01", src: "/math-worksheet/characters/headers/lucina_01.png" },
  { name: "luigi_01", src: "/math-worksheet/characters/headers/luigi_01.png" },
  { name: "mario_01", src: "/math-worksheet/characters/headers/mario_01.png" },
  { name: "marth_01", src: "/math-worksheet/characters/headers/marth_01.png" },
  { name: "meta_knight_01", src: "/math-worksheet/characters/headers/meta_knight_01.png" },
  { name: "mewtwo_01", src: "/math-worksheet/characters/headers/mewtwo_01.png" },
  { name: "mii_fighter_01", src: "/math-worksheet/characters/headers/mii_fighter_01.png" },
  { name: "minmin_01", src: "/math-worksheet/characters/headers/minmin_01.png" },
  { name: "mr_game_and_watch_01", src: "/math-worksheet/characters/headers/mr_game_and_watch_01.png" },
  { name: "murabito_01", src: "/math-worksheet/characters/headers/murabito_01.png" },
  { name: "ness_01", src: "/math-worksheet/characters/headers/ness_01.png" },
  { name: "pac_man_01", src: "/math-worksheet/characters/headers/pac_man_01.png" },
  { name: "packun_flower_01", src: "/math-worksheet/characters/headers/packun_flower_01.png" },
  { name: "palutena_01", src: "/math-worksheet/characters/headers/palutena_01.png" },
  { name: "peach_01", src: "/math-worksheet/characters/headers/peach_01.png" },
  { name: "pichu_01", src: "/math-worksheet/characters/headers/pichu_01.png" },
  { name: "pikachu_01", src: "/math-worksheet/characters/headers/pikachu_01.png" },
  { name: "pikmin_and_olimar_01", src: "/math-worksheet/characters/headers/pikmin_and_olimar_01.png" },
  { name: "pit_01", src: "/math-worksheet/characters/headers/pit_01.png" },
  { name: "pokemon_trainer_01", src: "/math-worksheet/characters/headers/pokemon_trainer_01.png" },
  { name: "purin_01", src: "/math-worksheet/characters/headers/purin_01.png" },
  { name: "pyra_01", src: "/math-worksheet/characters/headers/pyra_01.png" },
  { name: "reflet_01", src: "/math-worksheet/characters/headers/reflet_01.png" },
  { name: "richter_01", src: "/math-worksheet/characters/headers/richter_01.png" },
  { name: "ridley_01", src: "/math-worksheet/characters/headers/ridley_01.png" },
  { name: "robot_01", src: "/math-worksheet/characters/headers/robot_01.png" },
  { name: "rockman_01", src: "/math-worksheet/characters/headers/rockman_01.png" },
  { name: "rosetta_and_chiko_01", src: "/math-worksheet/characters/headers/rosetta_and_chiko_01.png" },
  { name: "roy_01", src: "/math-worksheet/characters/headers/roy_01.png" },
  { name: "ryu_01", src: "/math-worksheet/characters/headers/ryu_01.png" },
  { name: "samus_01", src: "/math-worksheet/characters/headers/samus_01.png" },
  { name: "sephiroth_01", src: "/math-worksheet/characters/headers/sephiroth_01.png" },
  { name: "sheik_01", src: "/math-worksheet/characters/headers/sheik_01.png" },
  { name: "shizue_01", src: "/math-worksheet/characters/headers/shizue_01.png" },
  { name: "shulk_01", src: "/math-worksheet/characters/headers/shulk_01.png" },
  { name: "simon_01", src: "/math-worksheet/characters/headers/simon_01.png" },
  { name: "snake_01", src: "/math-worksheet/characters/headers/snake_01.png" },
  { name: "sonic_01", src: "/math-worksheet/characters/headers/sonic_01.png" },
  { name: "sora_01", src: "/math-worksheet/characters/headers/sora_01.png" },
  { name: "steve_01", src: "/math-worksheet/characters/headers/steve_01.png" },
  { name: "terry_01", src: "/math-worksheet/characters/headers/terry_01.png" },
  { name: "toon_link_01", src: "/math-worksheet/characters/headers/toon_link_01.png" },
  { name: "wario_01", src: "/math-worksheet/characters/headers/wario_01.png" },
  { name: "wii_fit_trainer_01", src: "/math-worksheet/characters/headers/wii_fit_trainer_01.png" },
  { name: "wolf_01", src: "/math-worksheet/characters/headers/wolf_01.png" },
  { name: "yoshi_01", src: "/math-worksheet/characters/headers/yoshi_01.png" },
  { name: "young_link_01", src: "/math-worksheet/characters/headers/young_link_01.png" },
  { name: "zelda_01", src: "/math-worksheet/characters/headers/zelda_01.png" },
  { name: "zero_suit_samus_01", src: "/math-worksheet/characters/headers/zero_suit_samus_01.png" },
] as const;
export type MathPdfHeaderCharacter = (typeof MATH_WORKSHEET_HEADER_ASSETS)[number]["name"];
export const MATH_PDF_HEADER_SOURCES: Record<MathPdfHeaderCharacter, string> = Object.fromEntries(
  MATH_WORKSHEET_HEADER_ASSETS.map(({ name, src }) => [name, src]),
) as Record<MathPdfHeaderCharacter, string>;

/** 按份号取表头角色：一份两个、跨份不重复，同种子可复现。 */
export function getMathHeaderCharacters(sheet: number): readonly [MathPdfHeaderCharacter, MathPdfHeaderCharacter] {
  const total = MATH_WORKSHEET_HEADER_ASSETS.length;
  const index = ((Math.max(1, Math.floor(sheet)) - 1) * 2) % total;
  return [MATH_WORKSHEET_HEADER_ASSETS[index].name, MATH_WORKSHEET_HEADER_ASSETS[(index + 1) % total].name];
}
