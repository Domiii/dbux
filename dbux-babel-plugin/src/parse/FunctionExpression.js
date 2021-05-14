import template from '@babel/template';
import * as t from "@babel/types";
import TraceType from '@dbux/common/src/core/constants/TraceType';
import VarOwnerType from '@dbux/common/src/core/constants/VarOwnerType';
import { buildWrapTryFinally, buildSource, buildBlock } from '../helpers/builders';
import { injectContextEndTrace } from '../helpers/contextHelper';
import { traceWrapExpressionStatement } from '../helpers/traceHelpers.old';
import { getNodeNames } from '../visitors/nameVisitors';

import BaseNode from './BaseNode';

export default class FunctionExpression extends BaseNode {
  pluginConfigs = [
    'Function',
    'StaticContext'
  ];
}
