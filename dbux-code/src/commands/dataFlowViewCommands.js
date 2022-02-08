import UserActionType from '@dbux/data/src/pathways/UserActionType';
import { emitUserAction } from '../userEvents';
import DataFlowFilterModeType from '../dataFlowView/DataFlowFilterModeType';
import DataFlowSearchModeType from '../dataFlowView/DataFlowSearchModeType';
import { registerCommand } from './commandUtil';

/** @typedef {import('../dataFlowView/dataFlowViewController').DataFlowViewController} DataFlowViewController */

/**
 * @param {DataFlowViewController} dataFlowViewController 
 */
export function initDataFlowViewCommands(context, dataFlowViewController) {
  registerCommand(context,
    'dbuxDataFlowView.setSearchMode.ByAccessId',
    (/* node */) => {
      dataFlowViewController.setSearchMode(DataFlowSearchModeType.nextValue(DataFlowSearchModeType.ByAccessId));
      emitUserAction(UserActionType.DataFlowViewSearchModeChanged, DataFlowSearchModeType.ByAccessId);
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setSearchMode.ByValueId',
    (/* node */) => {
      dataFlowViewController.setSearchMode(DataFlowSearchModeType.nextValue(DataFlowSearchModeType.ByValueId));
      emitUserAction(UserActionType.DataFlowViewSearchModeChanged, DataFlowSearchModeType.ByValueId);
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setFilterMode.None',
    (/* node */) => {
      dataFlowViewController.setFilterMode(DataFlowFilterModeType.nextValue(DataFlowFilterModeType.None));
      emitUserAction(UserActionType.DataFlowViewFilterModeChanged, DataFlowFilterModeType.None);
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setFilterMode.ReadOnly',
    (/* node */) => {
      dataFlowViewController.setFilterMode(DataFlowFilterModeType.nextValue(DataFlowFilterModeType.ReadOnly));
      emitUserAction(UserActionType.DataFlowViewFilterModeChanged, DataFlowFilterModeType.ReadOnly);
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setFilterMode.WriteOnly',
    (/* node */) => {
      dataFlowViewController.setFilterMode(DataFlowFilterModeType.nextValue(DataFlowFilterModeType.WriteOnly));
      emitUserAction(UserActionType.DataFlowViewFilterModeChanged, DataFlowFilterModeType.WriteOnly);
    }
  );
}