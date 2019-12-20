
export default class ProgramStaticContext {
  programId;
  filePath;
  fileName;

  constructor(programId, programData) {
    this.programId = programId;
    Object.assign(this, programData);
  }
}