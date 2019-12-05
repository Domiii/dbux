it('noop', () => { });
// import * as esprima from 'esprima';
// import * as estraverse from 'estraverse';

// function matchCodeToAST(code, ast) {
//   return expect(esprima.parseScript(code)).toMatchObject(ast);
// }


// describe('basic traversal', () => {
//   it('object traversal', () => {
//     const stack = [];
//     function getAncestor(i) {
//       return stack[stack.length-i-1];
//     }
//     const ast = esprima.parseScript(`x.y.z = 3;`);
//     let foundZ = false;
//     estraverse.replace(ast, {
//       enter: function (node, parent) {
//         const { ref } = this.__current;
//         stack.push(ref);

//         const { key } = ref;
//         if (node.name === 'z') {
//           foundZ = true;
//           expect(key).toStrictEqual('property');
//           expect(getAncestor(1).key).toStrictEqual('left');
//           expect(getAncestor(2).key).toStrictEqual('expression');
//         }
//       },
//       leave: function(node, visitor) {
//         stack.pop();
//       }
//     });
    
//     expect(foundZ).toBeTrue();
//   });
// });



// /**
//  * Generated using online demo parser.
//  * @see https://esprima.org/demo/parse.html
//  */
// describe('basic syntax sub-trees', () => {
//   it('Assignment', () => {
//     matchCodeToAST(`var c = a;`, {
//       "type": "Program",
//       "body": [
//         {
//           "type": "VariableDeclaration",
//           "declarations": [
//             {
//               "type": "VariableDeclarator",
//               "id": {
//                 "type": "Identifier",
//                 "name": "c"
//               },
//               "init": {
//                 "type": "Identifier",
//                 "name": "a"
//               }
//             }
//           ],
//           "kind": "var"
//         }
//       ],
//       "sourceType": "script"
//     });
//   });

//   it('DotExpression', () => {
//     matchCodeToAST(`x.y.z`, {
//       "type": "Program",
//       "body": [
//         {
//           "type": "ExpressionStatement",
//           "expression": {
//             "type": "MemberExpression",
//             "computed": false,
//             "object": {
//               "type": "MemberExpression",
//               "computed": false,
//               "object": {
//                 "type": "Identifier",
//                 "name": "x"
//               },
//               "property": {
//                 "type": "Identifier",
//                 "name": "y"
//               }
//             },
//             "property": {
//               "type": "Identifier",
//               "name": "z"
//             }
//           }
//         }
//       ],
//       "sourceType": "script"
//     });
//   });



//   it('FunctionDeclaration', () => {
//     matchCodeToAST(`function f(a) {}`, {
//       "type": "Program",
//       "body": [
//         {
//           "type": "FunctionDeclaration",
//           "id": {
//             "type": "Identifier",
//             "name": "f"
//           },
//           "params": [
//             {
//               "type": "Identifier",
//               "name": "a"
//             }
//           ],
//           "body": {
//             "type": "BlockStatement",
//             "body": []
//           },
//           "generator": false,
//           "expression": false,
//           "async": false
//         }
//       ],
//       "sourceType": "script"
//     });
//   });

//   it('object properties', () => {
//     expect(esprima.parseScript(`x.y.z = 3;`)).toMatchObject({
//       "type": "Program",
//       "body": [
//         {
//           "type": "ExpressionStatement",
//           "expression": {
//             "type": "AssignmentExpression",
//             "operator": "=",
//             "left": {
//               "type": "MemberExpression",
//               "computed": false,
//               "object": {
//                 "type": "MemberExpression",
//                 "computed": false,
//                 "object": {
//                   "type": "Identifier",
//                   "name": "x"
//                 },
//                 "property": {
//                   "type": "Identifier",
//                   "name": "y"
//                 }
//               },
//               "property": {
//                 "type": "Identifier",
//                 "name": "z"
//               }
//             },
//             "right": {
//               "type": "Literal",
//               "value": 3,
//               "raw": "3"
//             }
//           }
//         }
//       ],
//       "sourceType": "script"
//     });


//     expect(esprima.parseScript(`var b = 'b'; var o = {a:1, [b]: 2};`)).toMatchObject({
//       "type": "Program",
//       "body": [
//         {
//           "type": "VariableDeclaration",
//           "declarations": [
//             {
//               "type": "VariableDeclarator",
//               "id": {
//                 "type": "Identifier",
//                 "name": "b"
//               },
//               "init": {
//                 "type": "Literal",
//                 "value": "b",
//                 "raw": "'b'"
//               }
//             }
//           ],
//           "kind": "var"
//         },
//         {
//           "type": "VariableDeclaration",
//           "declarations": [
//             {
//               "type": "VariableDeclarator",
//               "id": {
//                 "type": "Identifier",
//                 "name": "o"
//               },
//               "init": {
//                 "type": "ObjectExpression",
//                 "properties": [
//                   {
//                     "type": "Property",
//                     "key": {
//                       "type": "Identifier",
//                       "name": "a"
//                     },
//                     "computed": false,
//                     "value": {
//                       "type": "Literal",
//                       "value": 1,
//                       "raw": "1"
//                     },
//                     "kind": "init",
//                     "method": false,
//                     "shorthand": false
//                   },
//                   {
//                     "type": "Property",
//                     "key": {
//                       "type": "Identifier",
//                       "name": "b"
//                     },
//                     "computed": true,
//                     "value": {
//                       "type": "Literal",
//                       "value": 2,
//                       "raw": "2"
//                     },
//                     "kind": "init",
//                     "method": false,
//                     "shorthand": false
//                   }
//                 ]
//               }
//             }
//           ],
//           "kind": "var"
//         }
//       ],
//       "sourceType": "script"
//     });
//   });
// });

