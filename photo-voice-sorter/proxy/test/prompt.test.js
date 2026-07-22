import { test } from 'node:test';
import assert from 'node:assert';
import { buildClassifyPrompt } from '../src/prompt.js';

test('プロンプトに発話と全工程が含まれ、JSON限定を指示する', () => {
  const p = buildClassifyPrompt({
    spokenText: '2階の給湯器を外したところ',
    processMaster: ['撤去', '据付', '試運転'],
  });
  assert.match(p, /2階の給湯器を外したところ/);
  assert.match(p, /撤去/);
  assert.match(p, /据付/);
  assert.match(p, /試運転/);
  assert.match(p, /JSON/);
  assert.match(p, /title/);
  assert.match(p, /process/);
});

test('工程マスタが空でも例外を投げない', () => {
  assert.doesNotThrow(() => buildClassifyPrompt({ spokenText: 'x', processMaster: [] }));
});
