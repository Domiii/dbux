import * as t from '@babel/types';
import TraceType from '@dbux/common/src/core/constants/TraceType';
import { buildTraceExpression } from '../instrumentation/builders/misc';
import BaseNode from './BaseNode';

/**
 * 
 */
export default class ClassMethod extends BaseNode {
  static children = [
    'key',
    'params',
    'body'
  ];
  static plugins = [
    'Function',
    'StaticContext'
  ];
}