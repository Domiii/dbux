import caseStudyRegistry from './_caseStudyRegistry';

/**
 * Retrieves all case study objects, 
 * sorted by name (in descending order).
 */
export function getAllCaseStudies() {
  // fix up names
  //    NOTE: function + class names might get mangled by Webpack
  for (const name in caseStudyRegistry) {
    const Clazz = caseStudyRegistry[name];
    Clazz.constructorName = name;
  }

  // sort all classes by name
  const classes = Object.values(caseStudyRegistry);
  classes.sort((a, b) => {
    const nameA = a.constructorName.toLowerCase();
    const nameB = b.constructorName.toLowerCase();
    return nameB.localeCompare(nameA);
  });

  // instantiate all classes!?

  return classes;
}