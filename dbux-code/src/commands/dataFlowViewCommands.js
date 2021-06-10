import DataFlowViewModeType from '../dataFlowView/DataFlowViewModeType';
import { registerCommand } from './commandUtil';

/** @typedef {import('../dataFlowView/dataFlowViewController').DataFlowViewController} DataFlowViewController */

/**
 * @param {DataFlowViewController} dataFlowViewController 
 */
export function initDataFlowViewCommands(context, dataFlowViewController) {
  registerCommand(context,
    'dbuxDataFlowView.setByAccessIdMode',
    (/* node */) => {
      dataFlowViewController.setMode(DataFlowViewModeType.ByAccessId);
    }
  );

  registerCommand(context,
    'dbuxDataFlowView.setByValueIdMode',
    (/* node */) => {
      dataFlowViewController.setMode(DataFlowViewModeType.ByValueId);
    }
  );
}