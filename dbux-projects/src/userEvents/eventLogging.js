import fs from 'fs';
import path from 'path';
import { onUserEvent } from '.';

/** @typedef {import('../ProjectsManager').default} ProjectsManager */

/**
 * @param {ProjectsManager} manager 
 */
export default function initUserEventLogging(manager) {
  onUserEvent(writeEventToFile);

  const logFolderPath = manager.externals.resources.getLogsDirectory();

  if (!fs.existsSync(logFolderPath)) {
    fs.mkdirSync(logFolderPath);
  }

  function writeEventToFile(e) {
    const filePath = path.join(logFolderPath, `${e.sessionId}.dbuxlog`);

    fs.appendFileSync(filePath, `${JSON.stringify(e)}\n`, { flag: 'a+' });
  }
}
