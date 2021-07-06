import BaseNode from './BaseNode';

/**
 * Notes:
 * 
 * * Private names cannot be destructured (limited to `LiteralPropertyName` - https://tc39.es/ecma262/#prod-LiteralPropertyName)
 * * 
 */
export default class ObjectPattern extends BaseNode {
  static children = ['properties'];
}
