import GlobalDebugNode from './GlobalDebugNode';
import GlobalErrorsNode from './GlobalErrorsNode';
import GlobalConsoleNode from './GlobalConsoleNode';
import { ImportsNode, RecordedPackagesNode } from './GlobalModulesNode';

const GlobalNodeClasses = [
  GlobalErrorsNode,
  GlobalConsoleNode,
  
  RecordedPackagesNode,
  ImportsNode,

  GlobalDebugNode
];

export default GlobalNodeClasses;
