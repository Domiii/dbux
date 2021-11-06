import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import WebpackBuilder from '../../buildTools/WebpackBuilder';
import Bug from '../../projectLib/Bug';
import Project from '../../projectLib/Project';


const RelativeRoot = 'examples/vanilla-es6';

export default class TodomvcEs6Project extends Project {
  gitRemote = 'real-world-debugging/todomvc-es6';
  gitTargetRef = 'v1';
  // gitCommit = 'fed8e56';

  rmFiles = [
    'package.json'
  ];

  get actualProjectRoot() {
    return pathResolve(this.projectPath, RelativeRoot);
  }

  getAbsoluteFilePath(fpath) {
    return pathResolve(this.actualProjectRoot, fpath);
  }

  makeBuilder() {
    const projectRoot = this.actualProjectRoot;
    return new WebpackBuilder({
      websitePort: 3842,
      projectRoot,
      // websitePath: ,
      // context: this.actualProjectRoot,
      entry: {
        bundle: 'src/app.js',
        // vendor: ['todomvc-app-css/index.css'],
      },
      webpackConfig: {
        devServer: {
          contentBase: [projectRoot]
        }
      }
    });
  }

  async afterInstall() {
    await this.applyPatch('baseline');
  }

  loadBugs() {
    // git diff --ignore-cr-at-eol --color=never | unix2dos > ../../dbux-projects/assets/_patches_/todomvc-es6/error2.patch
    return [
      {
        label: 'Baseline',
        description: 'Working sample.',
        patch: ['no-callbacks']
      },
      {
        label: 'Empty list with clear error message',
        description: 'TODO items never show up. Luckily there is a clear error message.',
        patch: ['no-callbacks', 'error1'],
        domains: ['init', 'controller'],
        bugLocations: [
          {
            file: 'src/controller.js',
            line: 147
          }
        ]
      },
      {
        // label: 'Empty list with clear error message',
        // description: 'TODO items never show up. Luckily there is a clear error message.',
        patch: ['no-callbacks', 'error2'],
        domains: ['init', 'controller'],
        bugLocations: [
          {
            file: 'src/controller.js',
            line: 123
          }
        ]
      },


      // {
      //   label: 'Empty list with silenced exception',
      //   patch: 'error3',
      //   description: 'TODO items never show up. Sadly no error message is given. Luckily dbux displays an error indicator.',
      //   runArgs: [],
      //   bugLocations: [
      //     {
      //       file: 'src/controller.js',
      //       line: 65
      //     },
      //     {
      //       // empty catch statement
      //       file: 'src/controller.js',
      //       line: 244
      //     }
      //   ]
      // },
      // {
      //   // for-loop, off-by-one
      //   label: 'Last TODO item always missing',
      //   patch: 'error6',
      //   description: 'TODO list never renders the last item.',
      //   runArgs: [],
      //   bugLocations: [
      //     {
      //       file: 'src/template.js',
      //       line: 65
      //     }
      //   ]
      // },
      // {
      //   label: 'Empty list with symptomatic error message',
      //   patch: 'error2',
      //   description: 'TODO items never show up. We see an error message, but it is not the actual bug cause, only a symptom.',
      //   runArgs: [],
      //   bugLocations: [
      //     {
      //       file: 'src/controller.js',
      //       line: 12
      //     },
      //     {
      //       file: 'src/controller.js',
      //       line: 13
      //     }
      //   ]
      // },
      // {
      //   // ternary, css, branch logic reversed
      //   label: 'Reversed strikethrough',
      //   patch: 'error7',
      //   description: 'Check and uncheck items to see that strikethrough logic for TODO items is incorrect.',
      //   runArgs: [],
      //   bugLocations: [
      //     {
      //       file: 'src/view.js',
      //       line: 188
      //     }
      //   ]
      // },
      // {
      //   // incorrect-variable,DOM
      //   label: 'After editing, TODO text is incorrect',
      //   patch: 'error9',
      //   description: 'Edit any existing TODO, then save it (press ENTER).',
      //   runArgs: [],
      //   bugLocations: [
      //     {
      //       file: 'src/view.js',
      //       line: 55
      //     }
      //   ]
      // },
      // {
      //   // typo,variable,DOM
      //   label: 'Incorrect "items left" amount',
      //   patch: 'error8',
      //   description: '1) Mark some items as done. 2) The "items left" amount is incorrect.',
      //   runArgs: [],
      //   bugLocations: [
      //     {
      //       file: 'src/model.js',
      //       line: 106
      //     }
      //   ]
      // },
      // {
      //   // for-loop,indexing
      //   label: 'Changing existing TODOs does not persist anymore',
      //   patch: 'error10',
      //   description: '1) change name of TODO or check/uncheck a TODO. 2) Refresh page. 3) After refresh, TODO item renders incorrectly.',
      //   runArgs: [],
      //   bugLocations: [
      //     {
      //       file: 'src/store.js',
      //       line: 100
      //     }
      //   ]
      // },
      // {
      //   // omission,callbacks,wrong-arguments
      //   label: 'Empty list #3',
      //   patch: 'error11',
      //   description: 'Again, TODO items just won\'t show up, but for yet another very different reason.',
      //   runArgs: [],
      //   bugLocations: [
      //     {
      //       file: 'src/model.js',
      //       line: 51
      //     },
      //     {
      //       file: 'src/model.js',
      //       line: 52
      //     }
      //   ]
      // },
      // {
      //   // for-loop,variable declaration,scope
      //   label: 'Only last TODO item shows up',
      //   patch: 'error5',
      //   description: 'TODO list is not rendered completely if it contains more than one element.',
      //   runArgs: [],
      //   bugLocations: [
      //     {
      //       file: 'src/template.js',
      //       line: 62
      //     },
      //     {
      //       file: 'src/template.js',
      //       line: 63
      //     },
      //     {
      //       file: 'src/template.js',
      //       line: 65
      //     }
      //   ]
      // },
      // {
      //   label: 'Broken "Clear completed" button',
      //   patch: 'error4',
      //   description: '"Clear completed" button does not do anything. No error message.',
      //   runArgs: [],
      //   bugLocations: [
      //     {
      //       file: 'src/controller.js',
      //       line: 164
      //     }
      //   ]
      // },
      // // more bugs:

      // // template.show -> template has a minor render defect
      // // template.show -> incorrect variable scope causes only one item to be rendered

      {
        // see: https://github.com/kentcdodds/es6-todomvc/issues/39
        label: 'After switching between filters, the old filter still applies.',
        // eslint-disable-next-line max-len
        description: 'Add a todo item -> Go to "Completed" filter -> Reload the page -> Select "All" -> Mark item as completed. -> Observe bug: It won\'t show up anymore, even though we are in "All".',
        runArgs: []
      }

    ];
  }

  /**
   * 
   * @param {Bug} bug 
   */
  decorateBugForRun(bug) {
    // fix relative file paths
    bug.mainEntryPoint = this.builder.getEntryOutputPath('bundle', bug);
    if (bug.bugLocations) {
      bug.bugLocations = bug.bugLocations.map(loc => (loc && {
        ...loc,
        file: this.getAbsoluteFilePath(loc.file)
      }));
    }
  }

  async testBugCommand(bug, cfg) {
    // nothing to do yet
  }
}
