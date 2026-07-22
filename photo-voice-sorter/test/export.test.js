import { test } from 'node:test';
import assert from 'node:assert';
import { buildExportJson, buildRenameCsv } from '../js/pvs-export.js';

const photos = [
  { id: 'p1', originalFileName: 'IMG_1.jpg', newFileName: '撤去_A_001.jpg',
    spokenText: 's', title: 'A', process: '撤去', confirmed: true },
];

test('JSONにphotos配列が含まれる', () => {
  const j = JSON.parse(buildExportJson(photos));
  assert.strictEqual(j.photos.length, 1);
  assert.strictEqual(j.photos[0].newFileName, '撤去_A_001.jpg');
});

test('CSVはヘッダと1行を持つ', () => {
  const csv = buildRenameCsv(photos);
  const lines = csv.trim().split('\n');
  assert.strictEqual(lines[0], 'original,new,process,title');
  assert.strictEqual(lines[1], 'IMG_1.jpg,撤去_A_001.jpg,撤去,A');
});

test('カンマを含む値はクォートする', () => {
  const csv = buildRenameCsv([{ ...photos[0], title: 'A,B' }]);
  assert.match(csv, /"A,B"/);
});
