import sh from 'shelljs';

function fixShellJs() {
  // hackfix, see: https://github.com/shelljs/shelljs/issues/704#issuecomment-504747414
  sh.config.execPath = (
    sh.which('node') || 
    sh.which('nodejs') ||
    ''
  ).toString();

  if (!sh.config.execPath) {
    console.error('node executable not found');
  }

  // NOTE: this next part is technically not a hackfix, just setting a mode :)
  sh.set('+v');
}

export function installHackfixes() {
  fixShellJs();
}