

export function makeArrayLengthLabel(arr, label) {
  return `${label && (label + ' ') || ''}(${arr?.length || 0})`;
}

export function makeObjectArrayNodes(obj) {
  return Object.fromEntries(
    Object.entries(obj)
      .map(([name, arr]) => [makeArrayLengthLabel(arr, name), arr || {}])
  );
}