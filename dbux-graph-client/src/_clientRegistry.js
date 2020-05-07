import Highlighter from './components/controllers/Highlighter';
import HighlightManager from './components/controllers/HighlightManager';

const ContextNode = require('@/components/ContextNode').default;
const TraceNode = require('@/components/TraceNode').default;
const GraphDocument = require('@/components/GraphDocument').default;
const GraphRoot = require('@/components/GraphRoot').default;
const FocusController = require('@/components/controllers/FocusController').default;
const GraphNode = require('@/components/controllers/GraphNode').default;
const RunNode = require('@/components/RunNode').default;
const Toolbar = require('@/components/Toolbar').default;
const MiniMap = require('@/components/MiniMap').default;

export default {
  ContextNode,
  TraceNode,
  GraphDocument,
  GraphRoot,
  GraphNode,
  RunNode,
  Toolbar,
  MiniMap,
  FocusController,
  Highlighter,
  HighlightManager
};