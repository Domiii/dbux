import GlobalDebugNode from './GlobalDebugNode';
import GlobalErrorsNode from './GlobalErrorsNode';
import GlobalConsoleNode from './GlobalConsoleNode';
import GlobalPDGNode from './GlobalPDGNode';
import { ImportsNode, RecordedPackagesNode } from './GlobalModulesNode';
import GlobalSearchNode from './GlobalSearchNode';
import GlobalStatsNode from './GlobalStatsNode';

const GlobalNodeClasses = [
  GlobalErrorsNode,
  GlobalConsoleNode,

  GlobalPDGNode,
  
  RecordedPackagesNode,
  // ImportsNode,

  GlobalStatsNode,

  GlobalSearchNode,
  
  GlobalDebugNode,
];

export default GlobalNodeClasses;
