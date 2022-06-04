
export class PatternNodeBase {
  type;
}

export class PatternGroupNode extends PatternNodeBase {
  prop;
  /**
   * @type {Array.<number>}
   */
  children;
}

export class ArrayPatternNode extends PatternGroupNode { }
export class ObjectPatternNode extends PatternGroupNode { }


export class PatternWriteNode extends PatternNodeBase {
  tid;
}

export class VarPatternNode extends PatternWriteNode {
  declarationTid;
}

export class MEPatternNode extends PatternWriteNode {
  propValue;
  propTid;
  objectNodeId
}

export class RestArrayPatternNode extends PatternWriteNode {
  innerType;
  startIndex;
}

export class RestObjectPatternNode extends PatternWriteNode {
  innerType;
  excluded;
}
