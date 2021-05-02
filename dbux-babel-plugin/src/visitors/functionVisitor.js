import template from '@babel/template';
import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import VarOwnerType from '@dbux/common/src/core/constants/VarOwnerType';
import { buildWrapTryFinally, buildSource, buildBlock } from '../helpers/builders';
import { injectContextEndTrace } from '../helpers/contextHelper';
import { traceWrapExpressionStatement } from '../helpers/traceHelpers';
import { getNodeNames } from './nameVisitors';

// ###########################################################################
// visitor
// ###########################################################################

/**
 * NOTE: this only instruments the `bodyPath` of a function, thus thats what we expect
 */
export function functionVisitEnter(bodyPath, state) {
  
}