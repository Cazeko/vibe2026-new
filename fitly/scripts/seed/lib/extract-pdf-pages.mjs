// 일회성 텍스트 추출 유틸 — D-S4a unpdf 본체.
// 사용: node scripts/seed/lib/extract-pdf-pages.mjs <pdf-path>
import { readFile } from 'node:fs/promises';
import { extractText, getDocumentProxy } from 'unpdf';

const path = process.argv[2];
if (!path) {
  console.error('usage: node extract-pdf-pages.mjs <pdf-path>');
  process.exit(1);
}

const buf = await readFile(path);
const pdf = await getDocumentProxy(new Uint8Array(buf));
const { totalPages, text } = await extractText(pdf, { mergePages: false });

console.log(`=== PDF: ${path}`);
console.log(`=== Total pages: ${totalPages}`);
const pages = Array.isArray(text) ? text : [text];
for (let i = 0; i < pages.length; i++) {
  console.log(`\n=== Page ${i + 1} ===\n${pages[i]}`);
}
