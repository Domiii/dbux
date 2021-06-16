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
      dataFlowViewController.setSearchMode(DataFlowSearchModeType.ByAccessId);
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setSearchMode.ByValueId',
    (/* node */) => {
      dataFlowViewController.setSearchMode(DataFlowSearchModeType.ByValueId);
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setFilterMode.None',
    (/* node */) => {
      dataFlowViewController.setFilterMode(DataFlowFilterModeType.nextValue(DataFlowFilterModeType.None));
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setFilterMode.ReadOnly',
    (/* node */) => {
      dataFlowViewController.setFilterMode(DataFlowFilterModeType.nextValue(DataFlowFilterModeType.ReadOnly));
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setFilterMode.WriteOnly',
    (/* node */) => {
      dataFlowViewController.setFilterMode(DataFlowFilterModeType.nextValue(DataFlowFilterModeType.WriteOnly));
    }
  );
}