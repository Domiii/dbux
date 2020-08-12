/**
 * Returns the full path of anything on the $PATH system variable.
 * For that we use
 *  1. which on nix (Linux, BSD, MAC etc.)
 *  2. where.exe on Windows
 */
export default async function which(relativePath) {
  const which = await lookupWhich();
  // TODO: use which (could be "which" or "where.exe") to look up actual path. If we use which on windows, further resolve the path with cygpath
}

/**
 * For more information on where.exe: https://superuser.com/questions/49104/how-do-i-find-the-location-of-an-executable-in-windows
 */
export async function lookupWhich() {
  // TODO: on Windows use where.exe, on Linux use which
  // TODO: make sure, it works by looking up itself and check with fs.realfileSync
}

export async function hasWhich() {
  return !!await lookupWhich();
}