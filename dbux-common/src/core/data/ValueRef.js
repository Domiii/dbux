export default class ValueRef {
  valueId: number;
  trackId: number;
  type: number;

  // when stored in DataProvider, serialized is taken out
  // serialized: any, 

  value: any;
}