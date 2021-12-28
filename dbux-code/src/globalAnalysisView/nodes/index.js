import GlobalDebugNode from './GlobalDebugNode';
import GlobalErrorsNode from './GlobalErrorsNode';
import GlobalConsoleNode from './GlobalConsoleNode';
import { ImportsNode, RecordedProgramsNode } from './GlobalModulesNode';

const GlobalNodeClasses = [
  GlobalErrorsNode,
  GlobalConsoleNode,
  
  RecordedProgramsNode,
  ImportsNode,

  GlobalDebugNode
];

export default GlobalNodeClasses;
