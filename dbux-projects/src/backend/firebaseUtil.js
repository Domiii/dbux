export function getFirebaseDate(obj, propName = 'createdAt') {
  const prop = obj[propName];
  if (!prop || !prop.toDate || typeof prop.toDate !== "function") {
    // eslint-disable-next-line no-console
    console.warn(`object's date prop (${propName}) is not a valid firebase date object (missing 'toDate' method):`, obj);
    return new Date();
  }
  return prop.toDate();
}


/**
 * Return a new object that is document data, with an additional `_id` prop.
 */
export function docToSimpleObject(docOrDocId, docData = null) {
  let docId;
  if (!docData && docOrDocId && docOrDocId.data) {
    // only a single argument (the doc itself)
    docData = docOrDocId.data();
    docId = docOrDocId.id;
  }
  else {
    // passed in id and data as separate arguments
    docId = docOrDocId;
  }
  if (docData) {
    // lets do some evil stuff here
    Object.defineProperty(docData, '_id', {
      value: docId,
      writable: false,
      enumerable: false,
      configurable: false
    });
  }
  else {
    // doc probably got deleted?
    // debugger;
  }
  return docData;
}