import { getAllCaseStudies } from '.';

(async function main() {
  const caseStudy1 = getAllCaseStudies()[0];

  await caseStudy1.installAndRun();

})();