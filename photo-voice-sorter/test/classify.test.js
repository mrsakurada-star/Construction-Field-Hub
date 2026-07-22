import { test } from 'node:test';
import assert from 'node:assert';
import { validateProcess, classifyPhoto } from '../js/pvs-classify.js';

test('マスタ内はそのまま、マスタ外はnull', () => {
  assert.strictEqual(validateProcess(' 撤去 ', ['撤去', '据付']), '撤去');
  assert.strictEqual(validateProcess('謎工程', ['撤去']), null);
});

test('AI応答のprocessをマスタで検証して返す', async () => {
  const fakeFetch = async () => ({
    ok: true,
    json: async () => ({ title: '2階 給湯器 撤去', process: '撤去' }),
  });
  const r = await classifyPhoto({
    proxyUrl: 'http://x/classify', spokenText: 's', processMaster: ['撤去'], fetchFn: fakeFetch,
  });
  assert.strictEqual(r.title, '2階 給湯器 撤去');
  assert.strictEqual(r.process, '撤去');
});

test('AIがマスタ外を返したらprocessはnull', async () => {
  const fakeFetch = async () => ({ ok: true, json: async () => ({ title: 't', process: 'X' }) });
  const r = await classifyPhoto({
    proxyUrl: 'http://x/classify', spokenText: 's', processMaster: ['撤去'], fetchFn: fakeFetch,
  });
  assert.strictEqual(r.process, null);
});
