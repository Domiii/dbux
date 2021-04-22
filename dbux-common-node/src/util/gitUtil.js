// import path from 'path';
import sh from 'shelljs';

/**
 * Produces the shell command to git clone a specific remote at a given commit.
 */
export function gitCloneCmd(gitRemote, ref, targetFolder) {
  // const folderName = path.basename(targetFolder);
  sh.mkdir('-p', targetFolder);
  // git remote add origin https://github.com/webpack/webpack-cli.git ; 
  return [
    'git init',
    `git remote add origin ${gitRemote}`,
    `git fetch origin ${ref}:${ref} --no-tags`,
    `git reset --hard ${ref}`
  ];
}