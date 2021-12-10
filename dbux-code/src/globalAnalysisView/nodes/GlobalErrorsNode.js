/* eslint-disable camelcase */
import isString from 'lodash/isString';
import allApplications from '@dbux/data/src/applications/allApplications';
import UserActionType from '@dbux/data/src/pathways/UserActionType';
import traceSelection from '@dbux/data/src/traceSelection';
import { makeContextLabel, makeContextLocLabel, makeTraceLabel } from '@dbux/data/src/helpers/makeLabels';
import TraceType from '@dbux/common/src/types/constants/TraceType';
import EmptyArray from '@dbux/common/src/util/EmptyArray';
import makeTreeItem, { makeTreeItems } from '../../helpers/makeTreeItem';
import BaseTreeViewNode from '../../codeUtil/treeView/BaseTreeViewNode';

/** @typedef {import('@dbux/common/src/types/Trace').default} Trace */

/** ###########################################################################
 * {@link GlobalErrorsNode}
 * ##########################################################################*/

export default class GlobalErrorsNode extends BaseTreeViewNode {
  static makeLabel(/*_, parent*/) {
    return `Errors`;
  }

  get collapseChangeUserActionType() {
    return UserActionType.GlobalErrorUse;
  }

  nodes() {
    
  }

  buildChildren() {
    return makeTreeItems(...this.nodes());
  }
}
