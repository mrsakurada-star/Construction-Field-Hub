import { test } from 'node:test';
import assert from 'node:assert';
import { renderFileName, resolveCollision } from '../js/pvs-naming.js';

test('テンプレートを置換し連番を3桁ゼロ埋めする', () => {
  const n = renderFileName({
    template: '{工程}_{タイトル}_{連番}', process: '撤去', title: '2階給湯器', seq: 1, ext: 'jpg',
  });
  assert.strictEqual(n, '撤去_2階給湯器_001.jpg');
});

test('禁止文字をアンダースコアに置換する', () => {
  const n = renderFileName({
    template: '{タイトル}', process: '', title: 'A/B:C', seq: 1, ext: 'png',
  });
  assert.strictEqual(n, 'A_B_C.png');
});

test('衝突時は拡張子の前に連番サフィックスを付ける', () => {
  const existing = new Set(['撤去_x_001.jpg']);
  assert.strictEqual(resolveCollision('撤去_x_001.jpg', existing), '撤去_x_001-2.jpg');
});

test('衝突しなければそのまま返す', () => {
  assert.strictEqual(resolveCollision('a.jpg', new Set()), 'a.jpg');
});
