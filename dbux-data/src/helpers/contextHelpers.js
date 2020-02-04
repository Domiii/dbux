
export function isContextRoot(context) {
  return !context.parentContextId;
}