
export default class StaticProgramContext {
  programId;
  filePath;
  fileName;

  constructor(programId, programData) {
    this.programId = programId;
    Object.assign(this, programData);
  }
}