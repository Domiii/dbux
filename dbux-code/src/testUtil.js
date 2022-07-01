import EmptyObject from '@dbux/common/src/util/EmptyObject';
import { get as mementoGet, set as mementoSet } from './memento';

const TestPDGKeyName = 'dbux.command.testPDG.params';

export async function setTestPDGArgs(args) {
  await mementoSet(TestPDGKeyName, args);
}

export async function getTestPDGArgs() {
  return mementoGet(TestPDGKeyName, EmptyObject);
}
