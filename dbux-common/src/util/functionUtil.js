
export function getPrettyFunctionName(f) {
  return (f.name || '').replace(/[_]/g, ' ');
}