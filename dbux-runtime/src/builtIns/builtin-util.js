
export function addPurpose(trace, purpose) {
  // [edit-after-send]
  trace.purposes = trace.purposes || [];
  trace.purposes.push(purpose);
}
