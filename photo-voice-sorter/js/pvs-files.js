const IMAGE_EXT = new Set(['jpg', 'jpeg', 'png']);

export function isFileAccessSupported() {
  return typeof globalThis.showDirectoryPicker === 'function';
}

export async function pickImageDir() {
  const dirHandle = await globalThis.showDirectoryPicker();
  const files = [];
  for await (const [name, handle] of dirHandle.entries()) {
    if (handle.kind !== 'file') continue;
    const dot = name.lastIndexOf('.');
    const ext = dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
    if (!IMAGE_EXT.has(ext)) continue;
    const file = await handle.getFile();
    files.push({ name, ext, handle, url: URL.createObjectURL(file) });
  }
  files.sort((a, b) => a.name.localeCompare(b.name));
  return { dirHandle, files };
}

export async function renameFile(dirHandle, oldName, newName) {
  if (oldName === newName) return;
  const srcHandle = await dirHandle.getFileHandle(oldName);
  const file = await srcHandle.getFile();
  const destHandle = await dirHandle.getFileHandle(newName, { create: true });
  const writable = await destHandle.createWritable();
  await writable.write(await file.arrayBuffer());
  await writable.close();
  await dirHandle.removeEntry(oldName);
}
