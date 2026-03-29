export type StorageMode = 'server' | 'browser';

export function getStorageMode(): StorageMode {
  const rawMode = process.env.REACT_APP_STORAGE_MODE?.trim().toLowerCase();
  return rawMode === 'browser' ? 'browser' : 'server';
}

export function isBrowserStorageMode(): boolean {
  return getStorageMode() === 'browser';
}