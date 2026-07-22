export function buildClassifyPrompt({ spokenText, processMaster }) {
  const list = (processMaster || []).map((p) => `- ${p}`).join('\n');
  return [
    'あなたは建設現場写真の分類アシスタントです。',
    '作業者の口頭説明から、簡潔な写真タイトルと工程を1つ決めてください。',
    '',
    '# 口頭説明',
    spokenText,
    '',
    '# 選べる工程（必ずこの中から1つだけ選ぶ）',
    list || '(なし)',
    '',
    '# 出力',
    '次のJSONのみを返す。前後に文章やコードフェンスを付けない。',
    '{"title": "簡潔なタイトル", "process": "上のリストの工程名"}',
  ].join('\n');
}
