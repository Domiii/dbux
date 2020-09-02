import { v4 as uuidv4 } from 'uuid';
import { get, set } from './memento';

const installIdKeyName = 'dbux.installId';

let installId;

export async function initInstallId() {
  installId = get(installIdKeyName);
  if (!installId) {
    installId = uuidv4();
    await set(installIdKeyName, installId);
  }
}

export function getInstallId() {
  return installId;
}