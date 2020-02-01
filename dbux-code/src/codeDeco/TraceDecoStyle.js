import Enum from 'dbux-common/src/util/Enum';

let TraceDecoStyle = {
  Default: 1,
  PushContext: 2,
  PopContext: 3,
};
TraceDecoStyle = new Enum(TraceDecoStyle);
export default TraceDecoStyle;

/*

    test(dp: DataProvider, trace: Trace) {
      const {
        type
      } = trace;

      return isTracePush(type);
    },
    test(dp : DataProvider, trace : Trace) {
      const {
        type
      } = trace;

      return isTracePop(type);
    },
    */