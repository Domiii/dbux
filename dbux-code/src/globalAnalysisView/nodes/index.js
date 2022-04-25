import GlobalDebugNode from './GlobalDebugNode';
import GlobalErrorsNode from './GlobalErrorsNode';
import GlobalConsoleNode from './GlobalConsoleNode';
import { ImportsNode, RecordedPackagesNode } from './GlobalModulesNode';
import GlobalSearchNode from './GlobalSearchNode';
import GlobalStatsNode from './GlobalStatsNode';

const GlobalNodeClasses = [
  GlobalErrorsNode,
  GlobalConsoleNode,
  
  RecordedPackagesNode,
  // ImportsNode,

  GlobalStatsNode,

  GlobalSearchNode,
  
  GlobalDebugNode,
];

export default GlobalNodeClasses;
