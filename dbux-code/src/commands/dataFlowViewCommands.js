import { emitDataFlowViewFilterModeChangedAction, emitDataFlowViewSearchModeChangedAction } from '../userActions';
import DataFlowFilterModeType from '../dataFlowView/DataFlowFilterModeType';
import DataFlowSearchModeType from '../dataFlowView/DataFlowSearchModeType';
import { registerCommand } from './commandUtil';

/** @typedef {import('../dataFlowView/dataFlowViewController').DataFlowViewController} DataFlowViewController */

/**
 * @param {DataFlowViewController} dataFlowViewController 
 */
export function initDataFlowViewCommands(context, dataFlowViewController) {
  registerCommand(context,
    'dbuxDataFlowView.nextSearchMode.ByAccessId',
    (/* node */) => {
      dataFlowViewController.setSearchMode(DataFlowSearchModeType.nextValue(DataFlowSearchModeType.ByAccessId));
      emitDataFlowViewSearchModeChangedAction(dataFlowViewController.searchMode);
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.nextSearchMode.ByValueId',
    (/* node */) => {
      dataFlowViewController.setSearchMode(DataFlowSearchModeType.nextValue(DataFlowSearchModeType.ByValueId));
      emitDataFlowViewSearchModeChangedAction(dataFlowViewController.searchMode);
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setFilterMode.None',
    (/* node */) => {
      dataFlowViewController.setFilterMode(DataFlowFilterModeType.nextValue(DataFlowFilterModeType.None));
      emitDataFlowViewFilterModeChangedAction(DataFlowFilterModeType.None);
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setFilterMode.ReadOnly',
    (/* node */) => {
      dataFlowViewController.setFilterMode(DataFlowFilterModeType.nextValue(DataFlowFilterModeType.ReadOnly));
      emitDataFlowViewFilterModeChangedAction(DataFlowFilterModeType.ReadOnly);
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setFilterMode.WriteOnly',
    (/* node */) => {
      dataFlowViewController.setFilterMode(DataFlowFilterModeType.nextValue(DataFlowFilterModeType.WriteOnly));
      emitDataFlowViewFilterModeChangedAction(DataFlowFilterModeType.WriteOnly);
    }
  );
}