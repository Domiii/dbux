
const ContextNode = require('@/components/ContextNode').default;
const TraceNode = require('@/components/TraceNode').default;
const GraphDocument = require('@/components/GraphDocument').default;
const GraphRoot = require('@/components/GraphRoot').default;
const ContextNodeManager = require('@/components/controllers/ContextNodeManager').default;
const FocusController = require('@/components/controllers/FocusController').default;
const PopperController = require('@/components/controllers/PopperController').default;
const PopperManager = require('@/components/controllers/PopperManager').default;
const GraphNode = require('@/components/controllers/GraphNode').default;
const Highlighter = require('@/components/controllers/Highlighter').default;
const HighlightManager = require('@/components/controllers/HighlightManager').default;
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
  ContextNodeManager,
  FocusController,
  PopperController,
  PopperManager,
  Highlighter,
  HighlightManager
};