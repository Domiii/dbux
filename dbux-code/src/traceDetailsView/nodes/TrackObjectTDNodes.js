// import allApplications from '@dbux/data/src/applications/allApplications';
// import objectTracker from '@dbux/data/src/objectTracker';
// import UserActionType from '@dbux/data/src/pathways/UserActionType';

// import BaseTreeViewNode from '../../codeUtil/BaseTreeViewNode';
// import ObjectNode from './ObjectNode';

// export default class TrackObjectTDNode extends BaseTreeViewNode {
//   static makeProperties(trace/* , parent, props */) {
//     const dp = allApplications.getById(trace.applicationId).dataProvider;

//     const trackedTraces = dp.util.getAllTracesOfObjectOfTrace(trace.traceId);

//     const label = `Object Traces`;

//     return {
//       trackedTraces,
//       label
//     };
//   }

//   static makeLabel(trace, parent, props) {
//     return props.label;
//   }

//   get collapseChangeUserActionType() {
//     return UserActionType.TDTrackObjectUse;
//   }

//   get trace() {
//     return this.entry;
//   }
  
//   canHaveChildren() {
//     return !!this.trackedTraces?.length;
//   }

//   init() {
//     const { 
//       trace: {
//         applicationId, traceId
//       },
//       trackedTraces
//     } = this;

//     const dp = allApplications.getById(applicationId).dataProvider;

//     if (trackedTraces) {
//       this.contextValue = 'dbuxTraceDetailsView.traceObjectTDNodeRoot.withObjectValue';
//       this.description = `${trackedTraces.length}x`;
//     }
//     else if (!dp.util.doesTraceHaveValue(traceId)) {
//       this.description = '(trace has no value)';
//     }
//     else {
//       // if (!dp.util.isTraceTrackableValue(traceId)) {
//       this.description = '(trace\'s value is not an object/array/function)';
//     }
//   }
  
//   selectObject() {
//     objectTracker.selectTrace(this.trace);
//   }


//   buildChildren() {
//     const { trackedTraces } = this;

//     if (!trackedTraces) {
//       return null;
//     }

//     const children = trackedTraces.map(this.buildObjectNode);
//     return children;
//   }

//   buildObjectNode = (trace) => {
//     return this.treeNodeProvider.buildNode(ObjectNode, trace, this);
//   }
// }