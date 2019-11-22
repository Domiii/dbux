import * as esprima from 'esprima';
import * as estraverse from 'estraverse';

describe('basic traversal', () => {
  test('object traversal', () => {
    const stack = [];
    function getAncestor(i) {
      return stack[stack.length-i-1];
    }
    const ast = esprima.parseScript(`x.y.z = 3;`);
    let foundZ = false;
    estraverse.replace(ast, {
      enter: function (node, parent) {
        const { ref } = this.__current;
        stack.push(ref);

        const { key } = ref;
        if (node.name === 'z') {
          foundZ = true;
          expect(key).toEqual('property');
          expect(getAncestor(1).key).toEqual('left');
          expect(getAncestor(2).key).toEqual('expression');
        }
      },
      leave: function(node, visitor) {
        stack.pop();
      }
    });
    expect(foundZ).toBeTrue();
  });
});

describe('basic syntax sub-trees', () => {
  test('object properties', () => {
    expect(esprima.parseScript(`x.y.z = 3;`)).toMatchObject({
      "type": "Program",
      "body": [
        {
          "type": "ExpressionStatement",
          "expression": {
            "type": "AssignmentExpression",
            "operator": "=",
            "left": {
              "type": "MemberExpression",
              "computed": false,
              "object": {
                "type": "MemberExpression",
                "computed": false,
                "object": {
                  "type": "Identifier",
                  "name": "x"
                },
                "property": {
                  "type": "Identifier",
                  "name": "y"
                }
              },
              "property": {
                "type": "Identifier",
                "name": "z"
              }
            },
            "right": {
              "type": "Literal",
              "value": 3,
              "raw": "3"
            }
          }
        }
      ],
      "sourceType": "script"
    });


    expect(esprima.parseScript(`var b = 'b'; var o = {a:1, [b]: 2};`)).toMatchObject({
      "type": "Program",
      "body": [
        {
          "type": "VariableDeclaration",
          "declarations": [
            {
              "type": "VariableDeclarator",
              "id": {
                "type": "Identifier",
                "name": "b"
              },
              "init": {
                "type": "Literal",
                "value": "b",
                "raw": "'b'"
              }
            }
          ],
          "kind": "var"
        },
        {
          "type": "VariableDeclaration",
          "declarations": [
            {
              "type": "VariableDeclarator",
              "id": {
                "type": "Identifier",
                "name": "o"
              },
              "init": {
                "type": "ObjectExpression",
                "properties": [
                  {
                    "type": "Property",
                    "key": {
                      "type": "Identifier",
                      "name": "a"
                    },
                    "computed": false,
                    "value": {
                      "type": "Literal",
                      "value": 1,
                      "raw": "1"
                    },
                    "kind": "init",
                    "method": false,
                    "shorthand": false
                  },
                  {
                    "type": "Property",
                    "key": {
                      "type": "Identifier",
                      "name": "b"
                    },
                    "computed": true,
                    "value": {
                      "type": "Literal",
                      "value": 2,
                      "raw": "2"
                    },
                    "kind": "init",
                    "method": false,
                    "shorthand": false
                  }
                ]
              }
            }
          ],
          "kind": "var"
        }
      ],
      "sourceType": "script"
    });
  });
});

