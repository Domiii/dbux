export default class CaseStudy {
  async install() {
  }

  async run() {
  }

  async installAndRun() {
    await this.install();
    return this.run();
  }
}