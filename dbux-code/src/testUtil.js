import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { get as mementoGet, set as mementoSet } from './memento';

const TestDDGKeyName = 'dbux.command.testDDG.params';

export async function setTestDDGArgs(args) {
  await mementoSet(TestDDGKeyName, args);
}

export async function getTestDDGArgs() {
  return mementoGet(TestDDGKeyName, EmptyObject);
}
