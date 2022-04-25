// import path from 'path';
import sh from 'shelljs';

/**
 * Produces the shell command to git clone a specific remote at a given commit.
 */
export function gitCloneCmd(gitPath, gitRemote, ref, targetFolder) {
  // const folderName = path.basename(targetFolder);
  sh.mkdir('-p', targetFolder);
  // git remote add origin https://github.com/webpack/webpack-cli.git ; 

  gitPath = `"${gitPath}"`;
  
  return [
    `${gitPath} init`,
    `${gitPath} remote add origin ${gitRemote}`,
    `${gitPath} fetch origin ${ref}:${ref} --no-tags`,
    `${gitPath} reset --hard ${ref}`
  ];
}

