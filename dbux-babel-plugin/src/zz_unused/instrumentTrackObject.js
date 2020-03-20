/**
 * Old experiment for object identity tracking. 
 * Might revive this at some point...
 */

// import { __dbux_logObjectTrace, trackObject as __dbux_trackObject } from 'dbux-runtime/src/log/trackObject';


// // see: https://esprima.org/demo/parse.html
// // see: https://github.com/jquery/esprima/tree/master/src/syntax.ts

// function instrumentNode(origNode) {
//   // __dbux_logObjectTrace(x);
//   // return x;
//   const parseConfig = {};
//   const ast = babylon.parse('__dbux_logObjectTrace(1)', parseConfig);
//   const newNode = ast.body[0].expression;

//   console.assert(newNode.type === 'CallExpression');

//   // replace first argument with origNode
//   newNode.arguments[0] = origNode;

//   // console.log(JSON.stringify(newNode, null, 2));
//   return newNode;
// }

// export const identifierIgnoredParents = new Set([
//   'FunctionDeclaration'
// ]);

// // #######################################################################################
// // instrumentObjectTracker
// // #######################################################################################

// class ObjectTrackerTraverser extends ESTraverser {
//   leave(ref) {
//     const { node } = ref;
//     const parentRef = this.getStackRef(1);
//     const parent = parentRef && parentRef.node;
//     // only consider nodes that represent a possible get value
//     if (parent && 
//       node.type === "Identifier" &&
//       !identifierIgnoredParents.has(parent.type) &&
//       !this.isNonComputedProperty() &&
//       !this.isRightMostAssignmentLHS() &&
//       !this.isAssignmentLValue()
//     ) {
//       // see: https://github.com/estools/estraverse/blob/master/estraverse.js#L330
//       ref.replace(instrumentNode(node));
//       // node.name = 'aa';
//     }
//   }
// }

// export function instrumentObjectTracker(source, sourceURL) {
//   source = source + '';

//   const parseConfig = {
//     range: true,
//     loc: true
//   };
//   const ast = babylon.parse(source, parseConfig);
//   new ObjectTrackerTraverser().replace(ast);

//   // see: https://babeljs.io/docs/en/next/babel-generator.html
//   const genConfig = {
//     retainLines: true,
//     compact: "auto",
//     concise: false,  // reduces whitespace
//     minified: false,
//     quotes: "single",
//     fileName: sourceURL, // used in warning messages

//     sourceMaps: true,
//     //sourceRoot: '',
//     sourceFileName: sourceURL
//   };

//   let {
//     code,
//     map
//   } = generate(ast, genConfig, source);
//   // code += `\n${__dbux_logObjectTrace}`;

//   if (typeof window !== 'undefined') {
//     window.document.body.innerHTML = `<pre>${code}</pre>`;
//   }

//   // convert sourcemap to data URL
//   const mapBase64 = btoa(map.toString());
//   // const sourceMappingURL = `data:application/json;base64,${mapBase64}`;
//   const sourceMappingURL = 'http://localhost:3000/samples/test1.inst.js.map';

//   // console.log('sourceMappingURL', sourceMappingURL)
//   console.log('sourcemap', map.toString());

//   // produce code
//   return `${code}\n\n//# sourceMappingURL=${sourceMappingURL}`;
// }

// function noop(...args) { }

// export default async function instrumentTraackObject() {
//   // setup some globals
//   window.__dbux_logObjectTrace = __dbux_logObjectTrace;
//   window.__dbux_trackObject = __dbux_trackObject;
//   window.noop = noop;

//   // load code
//   const res = await fetch('/samples/test1.inst.js');
//   const sourceCode = await res.text();

//   // instrument code
//   // const code = instrumentObjectTracker(sourceCode, 'http://localhost:3000/samples/test1.js');

//   const code = sourceCode;
//   console.log('code', code);

//   // run code (while tracking object through code)
//   eval(code);
//   // eval(sourceCode);
// }