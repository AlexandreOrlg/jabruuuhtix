#!/usr/bin/env -S deno run --allow-read --allow-write

const [
  inputPath = "backend/OpenLexicon.tsv",
  outputPath = "backend/words.txt",
] = Deno.args;
const minFrequency = 10;

if (inputPath === "-h" || inputPath === "--help") {
  console.log(
    "Usage: build_words.ts [inputPath] [outputPath]\n" +
      "Defaults: backend/OpenLexicon.tsv -> backend/words.txt\n" +
      `Filters: NOM, no space/hyphen, freqlemfilms2 > ${minFrequency}`,
  );
  Deno.exit(0);
}

const content = await Deno.readTextFile(inputPath);
const lines = content.split(/\r?\n/);

if (lines.length === 0) {
  throw new Error("Empty input file.");
}

const headers = lines[0].split("\t");
const lemmaIndex = headers.indexOf("Lexique3__lemme");
const cgramIndex = headers.indexOf("Lexique3__cgram");
const freqIndex = headers.indexOf("Lexique3__freqlemfilms2");

if (lemmaIndex === -1) {
  throw new Error("Missing Lexique3__lemme column.");
}
if (cgramIndex === -1) {
  throw new Error("Missing Lexique3__cgram column.");
}
if (freqIndex === -1) {
  throw new Error("Missing Lexique3__freqlemfilms2 column.");
}

const seen = new Set<string>();
const words: string[] = [];

for (let i = 1; i < lines.length; i += 1) {
  const line = lines[i];
  if (!line) continue;
  const fields = line.split("\t");
  if (fields.length <= Math.max(lemmaIndex, cgramIndex)) continue;

  if (fields[cgramIndex] !== "NOM") continue;

  const frequency = Number.parseFloat(fields[freqIndex]);
  if (!Number.isFinite(frequency) || frequency <= minFrequency) continue;

  const lemma = fields[lemmaIndex].trim().toLowerCase();
  if (!lemma) continue;
  if (/[\s-]/.test(lemma)) continue;
  if (seen.has(lemma)) continue;

  seen.add(lemma);
  words.push(lemma);
}

await Deno.writeTextFile(outputPath, `${words.join("\n")}\n`);

console.log(`Wrote ${words.length} words to ${outputPath}`);
