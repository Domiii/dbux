import caseStudyRegistry from './_projectRegistry';
import ProjectList from './projectLib/ProjectList';
import BugRunner from './projectLib/BugRunner';

/**
 * Retrieves all case study objects, 
 * sorted by name (in descending order).
 */
function buildDefaultProjectList() {
  // fix up names
  for (const name in caseStudyRegistry) {
    const Clazz = caseStudyRegistry[name];

    // NOTE: function + class names might get mangled by Webpack
    Clazz.constructorName = name;
  }

  // sort all classes by name
  const classes = Object.values(caseStudyRegistry);
  classes.sort((a, b) => {
    const nameA = a.constructorName.toLowerCase();
    const nameB = b.constructorName.toLowerCase();
    return nameB.localeCompare(nameA);
  });

  return new ProjectList(this, classes);
}

class ProjectsManager {
  buildDefaultProjectList = buildDefaultProjectList;

  newBugRunner() {
    return new BugRunner(this);
  }
}

export default ProjectsManager;