import { instrumentFunctionEventStream } from './eventStreams';

export function instrumentFunctionRegister(path) {
  // TODO
}

export function instrumentFunction(path) {
  instrumentFunctionRegister(path);
  instrumentFunctionEventStream(path);
}