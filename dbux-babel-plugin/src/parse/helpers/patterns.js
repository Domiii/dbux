import BaseNode from '../BaseNode';
import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';

/**
 * Cases:
 * 1. AssignmentLValPattern
 * 2. DefaultDeclaratorLVal (adds `Write` trace, while VariableDeclarator might add a hoisted `Declaration` trace)
 * 3. Params
 * 4. ForDeclaratorLVal (will probably use `Params` logic)
 * 
 * @param {BaseNode} patternNode
 * @param {NodePath} rvalPath
 */
export function buildAndInstrumentPatternTree(patternNode, rvalPath) {
  const patternNodes = [];
  /**
   * Only: AssignmenLValPattern
   * Used for preparing (nested) lval MEs.
   */
  const preInitSequenceAstNodes = [];

  patternNode.buildPatternNode(null, patternNodes, preInitSequenceAstNodes);

  // TODO: replace rvalPath with `tracePattern(patternNodes, rvalTid, rval)`

  if (preInitSequenceAstNodes.expressions.length) {
    // There are MEs in the pattern trees that need some work done before the lval.
    // → Replace assignment with sequence (add assignment to end of sequence).
    const parent = patternNode.getParent(); // AssignmentExpression
    preInitSequenceAstNodes.push(parent);
    const seq = t.sequenceExpression(preInitSequenceAstNodes);
    parent.path.replacePath(seq);
  }
}