import sh from 'shelljs';

function fixShellJs() {
  // hackfix, see: https://github.com/shelljs/shelljs/issues/704#issuecomment-504747414
  sh.config.execPath = (
    sh.which('node') || 
    sh.which('nodejs') ||
    ''
  ).toString();

  if (!sh.config.execPath) {
    // eslint-disable-next-line no-console
    console.error('node executable not found on your system. Make sure to install node and have it in system $PATH first.');
  }

  // NOTE: this next part is technically not a hackfix, just setting a mode :)
  sh.set('+v');
}

export function installHackfixes() {
  fixShellJs();
}