import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';
import { __dbgs_logObjectTrace, trackObject } from './trackObject';
import { identifierIgnoredParents } from './estests';

const { Identifier, CallExpression, Syntax } = esprima;

test('identifierIgnoredParents only contains valid types', () => {
  expect(
    Array.from(identifierIgnoredParents).
      find(x => !Syntax[x])
  ).toBeFalsy();
});