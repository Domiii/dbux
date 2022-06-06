
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


export class PatternWriteNodeBase extends PatternNodeBase {
  tid;
}

export class VarPatternNode extends PatternWriteNodeBase {
  declarationTid;
}

export class MEPatternNode extends PatternWriteNodeBase {
  propValue;
  propTid;
  objectNodeId
}

export class RestArrayPatternNode extends PatternWriteNodeBase {
  innerType;
  startIndex;
}

export class RestObjectPatternNode extends PatternWriteNodeBase {
  innerType;
  excluded;
}
