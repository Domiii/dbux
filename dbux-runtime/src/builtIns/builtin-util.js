
export function addPurpose(trace, purpose) {
  // [edit-after-send]
  trace.purposes = trace.purposes || [];
  if (purpose.constructor === Number) {
    purpose = {
      type: purpose
    };
  }
  trace.purposes.push(purpose);
}
