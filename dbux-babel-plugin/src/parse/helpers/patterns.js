import * as t from '@babel/types';
import { NodePath } from '@babel/traverse';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import PatternAstNodeType from '@dbux/common/src/types/constants/PatternAstNodeType';
import { newLogger } from '@dbux/common/src/log/logger';
import EmptyObject from '@dbux/common/src/util/EmptyObject';
import TracePurpose from '@dbux/common/src/types/constants/TracePurpose';
import TraceCfg from '../../definitions/TraceCfg';
import { buildAddPurpose, buildTraceExpressionNoInput, doBuild, doBuildDefault } from '../../instrumentation/builders/misc';
import { buildTraceId } from '../../instrumentation/builders/traceId';
import { getDeclarationTid } from '../../helpers/traceUtil';
import { pathToStringAnnotated } from '../../helpers/pathHelpers';
import { makeMETraceData } from './me';
import { buildMELval, buildMEObject, buildMEProp, getMEpropVal } from '../../instrumentation/builders/me';
import { makeDeclarationVarStaticTraceData } from '../BindingIdentifier';
import { buildConstObjectProperties, ZeroNode } from '../../instrumentation/builders/buildUtil';


// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Pattern Instrumentation');

/** @typedef { import("@babel/types").Node } AstNode */
/** @typedef { import("@babel/traverse").NodePath } NodePath */
/** @typedef { import("@dbux/common/src/types/StaticTrace").default } StaticTrace */
/** @typedef { import("../BaseNode").default } BaseNode */

// const Verbose = 1;
const Verbose = 0;

export class PatternBuildConfig {
  /**
   * @type {Array.<Function>}
   */
  lvalTreeNodeBuilders = [];
  /**
   * Only: AssignmenLValPattern
   * Used for preparing (nested) lval MEs.
   * @type {Array.<Function>}
   */
  preInitNodeBuilders = [];

  lvalVarNodesByName = new Map();

  constructor(patternRoot) {
    this.patternRoot = patternRoot;
  }


  addBuilder(buildFn) {
    const index = this.lvalTreeNodeBuilders.length;
    this.lvalTreeNodeBuilders.push(buildFn);
    return index;
  }
}

// /**
//  * Cases:
//  * 1. AssignmentLValPattern
//  * 2. DefaultDeclaratorLVal (adds `Write` trace, while VariableDeclarator might add a hoisted `Declaration` trace)
//  * 3. Params
//  * 4. ForDeclaratorLVal (will probably use `Params` logic)
//  *
//  * @param {BaseNode} assignmentNode
//  * @param {BaseNode} patternLvalRoot
//  * @param {BaseNode} rvalNode
//  */
// export function buildPatternTree(assignmentNode, patternLvalRoot, rvalNode) {
// }

/**
 * @param {PatternBuildConfig} patternCfg
 * @return {TraceCfg}
 */
export function addPatternTraceCfg(patternCfg, buildFn, traceCfgInput) {
  const { node } = traceCfgInput;
  const traceCfg = node.Traces.addTrace(traceCfgInput);
  return patternCfg.addBuilder(() => buildFn(node.state, traceCfg));
}

/**
 * @param {PatternBuildConfig} patternCfg
 * @param {BaseNode} node
 * @return {number} Index of node in final `treeNodes` array.
 */
export function addPatternChildNode(patternCfg, patternProp, node, moreNodeData = EmptyObject) {
  const { path } = node;

  Verbose && debug(`addPatternChildNode at ${patternProp}: "${node.debugTag}"`);

  if (path.isIdentifier()) {
    /** ###########################################################################
     * // Var
     * ##########################################################################*/
    const traceType = patternCfg.patternRoot.isDeclarator ? TraceType.PatternWriteAndDeclareVar : TraceType.PatternWriteVar;
    let scope;
    if (!patternCfg.patternRoot.isHoisted) {
      // hackfix for `ForStatement.init`: prevent adding `tid` variable to own body
      scope = path.parentPath.scope;
    }

    // add node by var (to look up declaration later)
    patternCfg.lvalVarNodesByName.set(path.node.name, node);

    return addPatternTraceCfg(patternCfg, buildVarNodeAst, {
      node,
      path,
      scope,
      staticTraceData: {
        type: traceType,
        ...makeDeclarationVarStaticTraceData(path)
      },
      data: {
        patternProp,
        moreNodeData
      },
      meta: {
        instrument: null, // disable default instrumentation
      }
    });
  }
  else if (path.isMemberExpression()) {
    /** ###########################################################################
     * ME
     * ##########################################################################*/
    const meTraceData = makeMETraceData(node);
    const traceCfgInput = {
      node,
      path,
      staticTraceData: {
        type: TraceType.PatternWriteME
      },
      data: {
        patternProp,
        ...meTraceData,
        moreNodeData
      },
      meta: {
        build(state, traceCfg) {
          // replace original with object var instead
          const meAstNode = node.path.node;
          return buildMELval(meAstNode, traceCfg);
        },
      }
    };
    patternCfg.preInitNodeBuilders.push(() => buildMEPreInitNodes(node));
    return addPatternTraceCfg(patternCfg, buildMENodeAst, traceCfgInput);
  }
  else if (path.isAssignmentPattern()) {
    const [lvalNode, defaultValNode] = node.getChildNodes();

    // const data = {
    //   defaultValueTid: defaultTraceCfg.tidIdentifier || ZeroNode
    // };

    // trace lval
    const result = addPatternChildNode(patternCfg, patternProp, lvalNode);


    // trace default value as usual
    defaultValNode.addDefaultTrace();

    // NOTE: we cannot get `defaultValueTid` on time because of order of execution
    //  → hook up inputs in post instead
    const lvalTid = lvalNode.getTidIdentifier();
    if (lvalTid) {
      // defaultValNode.addPurpose(TracePurpose.PatternDefaultValue, lvalTid);
      defaultValNode.addPurpose(TracePurpose.ReverseInput, lvalTid);
    }

    return result;
  }
  else if (path.isRestElement()) {
    // Var or ME
    // TODO
    throw new Error(`Rest patterns not yet supported, in: "${node.getExistingParent().debugTag}"`);
  }
  else if (path.isPattern()) {
    /** ###########################################################################
     * Array + Object
     * ##########################################################################*/
    return node.addPatternNode(patternCfg, patternProp, moreNodeData);
  }
  throw new Error(`Unknown lval pattern node found: "${node.debugTag}"`);
}


/** ###########################################################################
 * instrument1
 * ##########################################################################*/

/**
 * @param {BaseNode} meNode 
 */
function buildMEPreInitNodes(meNode) {
  const { state, traceCfg } = meNode;
  const [objectNode, propNode] = meNode.getChildNodes();
  const meAstNode = meNode.path.node;

  // don't further instrument object or prop node
  //    (there are issues with ordering, that lead to object node not getting built on time, so we do it here instead)
  objectNode.traceCfg && (objectNode.traceCfg.instrument = null);
  propNode.traceCfg && (propNode.traceCfg.instrument = null);

  const objectAstNode = doBuild(state, objectNode.traceCfg);

  // hackfix: store in meAstNode, so it will get picked up by buildMEProp
  meAstNode.property = doBuild(state, propNode.traceCfg);

  const {
    data: {
      objectVar
    }
  } = traceCfg;
  return [
    t.assignmentExpression('=', objectVar, objectAstNode),
    buildMEProp(meAstNode, traceCfg)
  ];
  // return buildMEObject(meNode, traceCfg);
}

/** ###########################################################################
 * instrument
 * ##########################################################################*/

export function buildGroupNodeAst(childIndexes, patternType, prop, moreData) {
  return t.objectExpression([
    t.objectProperty(t.stringLiteral('type'), t.numericLiteral(patternType)),
    t.objectProperty(t.stringLiteral('prop'), t.stringLiteral(prop ? (prop + '') : '')),
    t.objectProperty(t.stringLiteral('children'),
      t.arrayExpression(childIndexes.map(childIndex => t.numericLiteral(childIndex)))
    ),
    ...buildConstObjectProperties(moreData)
  ]);
}

function buildVarNodeAst(state, traceCfg) {
  const tid = buildTraceId(state, traceCfg);
  const declarationTid = getDeclarationTid(traceCfg);
  const {
    patternProp,
    moreNodeData
  } = traceCfg.data;
  return t.objectExpression([
    t.objectProperty(t.stringLiteral('type'), t.numericLiteral(PatternAstNodeType.Var)),
    t.objectProperty(t.stringLiteral('prop'), t.stringLiteral(patternProp + '')),
    t.objectProperty(t.stringLiteral('tid'), tid),

    t.objectProperty(t.stringLiteral('declarationTid'), declarationTid),

    ...buildConstObjectProperties(moreNodeData)
  ]);
}

function buildMENodeAst(state, traceCfg) {
  const tid = buildTraceId(state, traceCfg);
  const {
    patternProp,
    objectTid,
    propertyVar,
    propTid,
    moreNodeData
  } = traceCfg.data;
  return t.objectExpression([
    t.objectProperty(t.stringLiteral('type'), t.numericLiteral(PatternAstNodeType.ME)),
    t.objectProperty(t.stringLiteral('prop'), t.stringLiteral(patternProp + '')),
    t.objectProperty(t.stringLiteral('tid'), tid),

    t.objectProperty(t.stringLiteral('objectTid'), objectTid),
    t.objectProperty(t.stringLiteral('propValue'), getMEpropVal(traceCfg.node, traceCfg, propertyVar)),
    t.objectProperty(t.stringLiteral('propTid'), propTid),

    ...buildConstObjectProperties(moreNodeData)
  ]);
}
