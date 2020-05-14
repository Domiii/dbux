export default class ValueRef {
  valueId: number;
  trackId: number;

  category: number;
  pruneState: number;
  typeName: string;

  // when stored in DataProvider, serialized is taken out
  // serialized: any,

  value: any;
}