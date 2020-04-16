import Enum from 'dbux-common/src/util/Enum';

const TraceMode = new Enum({
  AllTraces: 0,
  ParentTraces: 1,
  ContextOnly: 2
});

export default TraceMode;