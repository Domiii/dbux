export default class HasValue {  
  /**
   * value is set for primitive value type vars
   */
  value;

  /**
   * valueId is set for non-primitive value type vars, and refers to a `ValueRef` entry in `valuesCollection`
   */
  valueId;
}