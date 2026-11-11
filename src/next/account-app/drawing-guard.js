// A best-effort browser warning, not storage or a guarantee against data loss.
export function createDrawingGuard(target) {
  let dirty = false;
  function warn(event) {
    event.preventDefault();
    event.returnValue = true;
  }
  return {
    markChanged() {
      if (dirty) return;
      dirty = true;
      target.addEventListener('beforeunload', warn);
    },
    clear() {
      if (!dirty) return;
      dirty = false;
      target.removeEventListener('beforeunload', warn);
    }
  };
}
