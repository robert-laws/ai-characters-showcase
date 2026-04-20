import { existsSync, readdirSync, readFileSync } from "node:fs";

type RawCharacterEntry = {
  id: string;
  filename: string;
  placeholder: string;
  name: string;
  imageType: string;
  species: string;
  age: number;
  gender: string;
  category: string;
  appearance?: {
    hair?: string;
    beard?: string;
    eyes?: string;
    build?: string;
    distinguishingFeatures?: string;
    palette?: string;
  };
  backstory: string;
  attributes?: Record<string, number>;
  strengths?: string[];
  weaknesses?: string[];
  abilities?: string[];
  tags?: string[];
};

export type CharacterImage = {
  placeholder: string;
  type: string;
  filename: string;
  src: string;
  label: string;
};

export type CharacterRecord = {
  id: string;
  slug: string;
  name: string;
  category: string;
  species: string;
  age: number;
  gender: string;
  appearance: RawCharacterEntry["appearance"];
  backstory: string;
  attributes: Record<string, number>;
  strengths: string[];
  weaknesses: string[];
  abilities: string[];
  tags: string[];
  summary: string;
  images: CharacterImage[];
  primaryImage: CharacterImage;
};

export type CategoryTile = {
  placeholder: string;
  slug: string;
  name: string;
  category: string;
  image: CharacterImage;
};

const imageTypesForCharacters = new Set([
  "hero",
  "product-card",
  "new-archive",
  "editorial-banner",
  "vertical-feature"
]);

const sampleDir = new URL("../../public/images/layout-samples/", import.meta.url);
const metadataPath = new URL("../../public/images/layout-samples/character-metadata.json", import.meta.url);
const sampleDirPath = sampleDir.pathname;

const rawEntries = JSON.parse(readFileSync(metadataPath, "utf8")) as RawCharacterEntry[];
const sampleFiles = new Set(
  readdirSync(sampleDir, { withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const titleCase = (value: string) =>
  value
    .split(/[\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const firstSentence = (value: string) => {
  const trimmed = value.trim();
  const match = trimmed.match(/^.+?[.!?](?=\s|$)/);
  return match ? match[0] : trimmed;
};

const resolveFilename = (entry: RawCharacterEntry) => {
  if (sampleFiles.has(entry.filename) && existsSync(new URL(entry.filename, sampleDir))) {
    return entry.filename;
  }

  const prefix = `${entry.placeholder}-`;
  const fallback = [...sampleFiles].find((filename) => filename.startsWith(prefix) && !filename.endsWith(".json"));

  return fallback ?? entry.filename;
};

const makeImage = (entry: RawCharacterEntry): CharacterImage => {
  const filename = resolveFilename(entry);

  return {
    placeholder: entry.placeholder,
    type: entry.imageType,
    filename,
    src: `/images/layout-samples/${filename}`,
    label: `${entry.name} ${entry.imageType.replace(/-/g, " ")}`
  };
};

const characterEntries = rawEntries.filter((entry) => imageTypesForCharacters.has(entry.imageType));
const categoryEntries = rawEntries.filter((entry) => entry.imageType === "category");

const groupedCharacters = new Map<string, RawCharacterEntry[]>();

for (const entry of characterEntries) {
  const existing = groupedCharacters.get(entry.name) ?? [];
  existing.push(entry);
  groupedCharacters.set(entry.name, existing);
}

const imageTypePriority = new Map([
  ["hero", 0],
  ["product-card", 1],
  ["new-archive", 2],
  ["editorial-banner", 3],
  ["vertical-feature", 4]
]);

const sortedCharacterNames = [...groupedCharacters.keys()].sort(
  (left, right) =>
    Math.min(...(groupedCharacters.get(left) ?? []).map((entry) => Number(entry.placeholder))) -
    Math.min(...(groupedCharacters.get(right) ?? []).map((entry) => Number(entry.placeholder)))
);

export const characters: CharacterRecord[] = sortedCharacterNames.map((name) => {
  const entries = [...(groupedCharacters.get(name) ?? [])].sort((left, right) => {
    const priority = (imageTypePriority.get(left.imageType) ?? 99) - (imageTypePriority.get(right.imageType) ?? 99);
    return priority || Number(left.placeholder) - Number(right.placeholder);
  });

  const base = entries[0];
  const slug = slugify(base.name);
  const images = entries.map(makeImage);

  return {
    id: base.id,
    slug,
    name: base.name,
    category: base.category,
    species: base.species,
    age: base.age,
    gender: base.gender,
    appearance: base.appearance ?? {},
    backstory: base.backstory,
    attributes: base.attributes ?? {},
    strengths: base.strengths ?? [],
    weaknesses: base.weaknesses ?? [],
    abilities: base.abilities ?? [],
    tags: base.tags ?? [],
    summary: firstSentence(base.backstory),
    images,
    primaryImage: images[0]
  };
});

export const categories: CategoryTile[] = categoryEntries
  .sort((left, right) => Number(left.placeholder) - Number(right.placeholder))
  .map((entry) => ({
    placeholder: entry.placeholder,
    slug: slugify(entry.category),
    name: entry.name,
    category: entry.category,
    image: makeImage(entry)
  }));

const characterBySlugMap = new Map(characters.map((character) => [character.slug, character]));

const rawEntryByPlaceholder = new Map(rawEntries.map((entry) => [entry.placeholder, entry]));
const characterByPlaceholder = new Map(
  characters.flatMap((character) => character.images.map((image) => [image.placeholder, character] as const))
);
const categoryByPlaceholder = new Map(categories.map((category) => [category.placeholder, category]));

export const getCharacterBySlug = (slug: string) => characterBySlugMap.get(slug);

export const getRelatedCharacters = (character: CharacterRecord, limit = 3) =>
  characters
    .filter((candidate) => candidate.slug !== character.slug)
    .map((candidate) => ({
      character: candidate,
      overlap: candidate.tags.filter((tag) => character.tags.includes(tag)).length,
      categoryMatch: candidate.category === character.category ? 1 : 0
    }))
    .filter(({ overlap, categoryMatch }) => overlap > 0 || categoryMatch > 0)
    .sort((left, right) => right.overlap + right.categoryMatch - (left.overlap + left.categoryMatch))
    .slice(0, limit)
    .map(({ character: candidate }) => candidate);

export const homeCatalog = {
  hero: characterByPlaceholder.get("01")!,
  selections: ["02", "03", "04", "05", "06"].map((placeholder) => characterByPlaceholder.get(placeholder)!),
  categoryTiles: ["07", "08", "09", "10", "11", "12"].map((placeholder) => categoryByPlaceholder.get(placeholder)!),
  newArchive: ["13", "14", "15", "16", "17"].map((placeholder) => characterByPlaceholder.get(placeholder)!),
  highlight: characterByPlaceholder.get("18")!,
  verticalFeature: characterByPlaceholder.get("19")!,
  footerLandscape: makeImage(rawEntryByPlaceholder.get("20")!)
};

export const getPlaceholderImage = (placeholder: string) => {
  const rawEntry = rawEntryByPlaceholder.get(placeholder);
  return rawEntry ? makeImage(rawEntry) : null;
};

export const listSampleAssetNames = () =>
  [...sampleFiles]
    .filter((filename) => !filename.endsWith(".json"))
    .sort();

export const sampleAssetDirectory = sampleDirPath;
