export class StaticContextCollection {
  _staticContexts = [null];

  addContexts(programStaticId, list) {
    // make sure, array is pre-allocated
    for (let i = this._staticContexts.length; i <= programStaticId; ++i) {
      this._staticContexts.push(null);
    }

    // add program static contexts
    this._staticContexts[programStaticId] = list;
  }
}

const staticContextCollection = new StaticContextCollection();
export default staticContextCollection;