import fs from 'fs';

/**
 * TODO: recursion
 */
export function getAllFilesInFolders(folderOrFolders) {
  const folders = Array.isArray(folderOrFolders) ? folderOrFolders : [folderOrFolders];
  return Array.from(new Set(
    folders.flatMap(folder =>
      fs.readdirSync(folder)
    )
  ));
}