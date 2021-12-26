import GlobalDebugNode from './GlobalDebugNode';
import GlobalErrorsNode from './GlobalErrorsNode';
import GlobalConsoleNode from './GlobalConsoleNode';
import { ImportsNode, RecordedProgramsNode } from './GlobalModulesNode';

const GlobalNodeClasses = [
  GlobalDebugNode,
  GlobalErrorsNode,
  GlobalConsoleNode,
  
  RecordedProgramsNode,
  ImportsNode
];

export default GlobalNodeClasses;
