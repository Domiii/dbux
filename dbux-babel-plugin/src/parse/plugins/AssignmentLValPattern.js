import * as t from '@babel/types';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import { buildTraceExpressionNoInput } from '../../instrumentation/builders/misc';
import { PatternBuildConfig } from '../helpers/patterns';
import BasePlugin from './BasePlugin';


class PatternTreeNode {
  /**
   * @type {BaseNode}
   */
  parseNode;
}

class PropPatternTraceNode extends PatternTreeNode {
  /**
   * @type {string}
   */
  prop;
}

class WriteVarNode extends PropPatternTraceNode {
  // declarationTid, inputs

  getValue() {
    // TODO
  }
}

class WriteMENode extends PropPatternTraceNode {
  // propValue, objectTid, propTid, inputs

  getValue() {
    // TODO
  }
}

/**
 * NOTE: Rest is a simpler version of spread (in that, it does not affect other indexes)
 * NOTE2: has no `prop`
 * TODO:
 * → makeSpreadableArgumentArrayCfg
 * → buildSpreadableArgArrayNoSpread
 * → 
 */
class RestNode extends PatternTreeNode {
}

export class PatternTree {
  /**
   * @type {PatternTreeNode}
   */
  root;
}

/**
 * Takes care of all patterns/pattern-likes.
 * 
 * @implements {PatternTree}
 * 
 * @see https://babeljs.io/docs/en/babel-types#patternlike
 * @see https://tc39.es/ecma262/#prod-BindingPattern
 */
export default class AssignmentLValPattern extends BasePlugin {
  /**
   * @type {PatternBuildConfig}
   */
  patternCfg;

  exit() {
    const { node } = this;
    const [lvalNode, rvalNode] = node.getChildNodes();
    const patternCfg = this.patternCfg = new PatternBuildConfig();

    // add rval trace
    rvalNode.addDefaultTrace();

    /**
     * PatternTree DSF traversal
     */
    lvalNode.addPatternNode(patternCfg, null);

    node.Traces.addTrace({
      node,
      path: node.path,
      staticTraceData: {
        type: TraceType.PatternAssignment
      },
      meta: {
        build: buildTraceExpressionNoInput,
        traceCall: 'tracePattern',
        /**
         * Replace rval
         */
        targetPath: rvalNode.path,
        // targetNode() { return rvalNode.path.node; },
        
        moreTraceCallArgs() {
          // add `treeNodes` array
          return [t.arrayExpression(
            patternCfg.lvalTreeNodeBuilders.map(build => build())
          )];
        }
      }
    });
  }

  /**
   * Build and insert preInit nodes before our actual nodes.
   * 
   * future-work: ensure correct stepping order:
   * 1. pre-init for lval -> 1b. (nothing else to do in lval) -> 2. rval -> 3. writes
   */
  instrument1() {
    // // TODO
    // if (preInitTraceCfgs.expressions.length) {
    //   // There are MEs in the pattern trees that need some work done before the lval.
    //   // → Replace assignment with sequence (add assignment to end of sequence).
    //   preInitTraceCfgs.push(node);
    //   const seq = t.sequenceExpression(preInitTraceCfgs);
    //   node.path.replacePath(seq);
    // }
  }
}
