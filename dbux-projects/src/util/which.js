import sh from 'shelljs';

/**
 * Get command executable path
 * @param {string} command the command being queried
 * @return {string} the actual path where `command` is
 */
export default function which(command) {
  return sh.which(command)?.toString();
}
