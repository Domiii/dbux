/** @typedef {import('./DDGNode').default} DDGNode */

/**
 * Control groups are contexts + branches.
 * Can be collapsed/expanded.
 */
export class ControlGroupNode {
  controlGroupType;

  /**
   * @type {Array.<DDGNode | ControlGroupNode>}
   */
  children;
}

export class BaseBranchNode extends ControlGroupNode {
  // statementStaticTraceId;
  /**
   * This uniquely identified the statement's execution.
   * This is also the `pushTraceId`.
   */
  statementTraceId;
  popTraceId;
}

/**
 * NOTE: has no `controlTraceIds`.
 */
export class ContextCotrolGroupNode extends BaseBranchNode {
  contextId;
}

/**
 * For `if`, ternaries and switch/case.
 * NOTE: nested if else and ternaries are merged into one.
 * NOTE: a single switch/case can go through multiple controlTraceIds
 */
export class ConditionalBranchNode extends BaseBranchNode {
  controlTraceIds;
  blockStaticTraceId;
}


export class LoopBranchNode extends BaseBranchNode {
  /**
   * One controlTraceId per iteration.
   * Contains `0` for first iteration of `DoWhileLoop`.
   */
  controlTraceIds;
}

// class StaticControlStatement {
//   statementStaticTraceId;

//   decisionStaticTraceIds;

//   /**
//    * @type {StaticControlBlock[]}
//    */
//   blocks;

//   /**
//    * NOTE: if it has no `parentStatement`, it belongs to the control scope of `staticContextId`
//    * @type {StaticControlStatement}
//    */
//   parentStatement;
// }

// class StaticControlBlock {
//   // TODO
//   decisionStaticTraceId;
// }

// /**
//  * A ControlStatement that executed with given blocks.
//  */
// class ControlStatement {
//   controlStatementId;

//   /**
//    * TODO
//    */
//   decisions;

//   /**
//    * TODO: derive blocks from the result sequence of decision values.
//    * 
//    * @type {ControlBlock[]}
//    */
//   blocks;
// }

// /**
//  * A (possibly conditional) block that actually executed.
//  */
// class ControlBlock {
//   controlStatementId;

//   /**
//    * TODO
//    */
//   staticBlockId;

//   /**
//    * 
//    */
//   conditionTraceIds;

//   /**
//    * Executed traces in block.
//    */
//   traceIds;


//   /**
//    * @type {ControlStatement[]}
//    */
//   childStatements;
// }
