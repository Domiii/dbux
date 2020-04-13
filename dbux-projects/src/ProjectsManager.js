import caseStudyRegistry from './_projectRegistry';
import ProjectList from './projectLib/ProjectList';
import BugRunner from './projectLib/BugRunner';
import EditorApi from './projectLib/EditorApi';


class ProjectsManager {
  config;
  externals;

  constructor(cfg, externals) {
    this.config = cfg;
    this.externals = externals;

    this.editor = new EditorApi();
  }

  /**
   * Retrieves all case study objects, 
   * sorted by name (in descending order).
   */
  buildDefaultProjectList() {
    // fix up names
    for (const name in caseStudyRegistry) {
      const Clazz = caseStudyRegistry[name];

      // NOTE: function/class names might get mangled by Webpack (or other bundlers/tools)
      Clazz.constructorName = name;
    }

    // sort all classes by name
    const classes = Object.values(caseStudyRegistry);
    classes.sort((a, b) => {
      const nameA = a.constructorName.toLowerCase();
      const nameB = b.constructorName.toLowerCase();
      return nameB.localeCompare(nameA);
    });

    // build + return ProjectList
    const list = new ProjectList(this);
    list.add(...classes.map(ProjectClazz => new ProjectClazz(this)));
    return list;
  }

  newBugRunner() {
    return new BugRunner(this);
  }
}

export default ProjectsManager;