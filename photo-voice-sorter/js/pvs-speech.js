/* © 2026 Nozomi Sakurada. All rights reserved. */
export function isSpeechSupported() {
  return typeof (globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition) === 'function';
}

export function createRecognizer({ lang = 'ja-JP', onResult, onError } = {}) {
  const Ctor = globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  if (!Ctor) throw new Error('speech_unsupported');
  const rec = new Ctor();
  rec.lang = lang;
  rec.interimResults = false;
  rec.maxAlternatives = 1;
  rec.onresult = (e) => {
    const text = e.results?.[0]?.[0]?.transcript || '';
    onResult && onResult(text);
  };
  rec.onerror = (e) => onError && onError(e.error || 'speech_error');
  return { start: () => rec.start(), stop: () => rec.stop() };
}
