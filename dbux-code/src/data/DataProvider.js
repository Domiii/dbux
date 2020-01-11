export default class DataProvider {
  staticContextCollection;
  staticTraceCollection;

  executionContextCollection;
  traceCollection;

  constructor() {
    staticContextCollection = new StaticContextCollection();
    staticTraceCollection;

    executionContextCollection;
    traceCollection;
  }
}