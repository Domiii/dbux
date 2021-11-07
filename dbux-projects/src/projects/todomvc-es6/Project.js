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
    // git diff --ignore-cr-at-eol --color=never | unix2dos > ../../dbux-projects/assets/_patches_/todomvc-es6/error.patch
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
        stepsToReproduce: ['Have a non-empty list.'],
        bugTags: ['typo'],
        bugLocations: [
          {
            file: 'src/controller.js',
            line: 147
          }
        ],
        difficulty: {
          error: {
            closeToCause: true
          }
        }
      },
      {
        // TODO: stepsToReproduce: 
        label: 'Completed TODO items are shown as not completed and vice versa (only during initial rendering)',
        patch: ['no-callbacks', 'error2'],
        domains: ['init', 'render'],
        stepsToReproduce: ['Have a non-empty list.', 'Make sure, some items are completed, some not.', 'Check whether they are rendered as "completed" correctly.'],
        bugTags: ['boolean-logic', 'operator'],
        bugLocations: [
          {
            file: 'src/template.js',
            line: 21
          }
        ],
        difficulty: {
          obviousStartingPoint: false
        }
      },
      {
        label: 'Only the last TODO item is shown',
        patch: ['no-callbacks', 'error3'],
        domains: ['render'],
        stepsToReproduce: ['Have a list with 2, 3 or more items.'],
        bugTags: ['Array.reduce'],
        bugLocations: [
          {
            file: 'src/template.js',
            line: 20
          }
        ],
        difficulty: {
          obviousStartingPoint: false
        }
      },
      {
        label: 'Empty list, but no error message',
        patch: ['no-callbacks', 'error4'],
        domains: ['render'],
        stepsToReproduce: ['Have a non-empty list.'],
        bugTags: [
          'typo',
          ['api', 'DOM'] // https://www.google.com/search?hl=en&q=mdn+dom
        ],
        bugLocations: [
          {
            file: 'src/view.js',
            line: 51
          }
        ],
        difficulty: {
          obviousStartingPoint: false
        }
      },
      {
        label: '"X items left" is always plural, but should also support singular.',
        patch: ['no-callbacks', 'error5'],
        domains: ['render'],
        stepsToReproduce: ['Have a non-empty list.', 'Make sure, exactly one item is not marked as "done" yet.'],
        bugTags: ['wrong-condition'],
        bugLocations: [
          {
            file: 'src/template.js',
            line: 38
          }
        ]
      },
      {
        label: '"X items left" not counting first item in list.',
        patch: ['no-callbacks', 'error6'],
        domains: ['store'],
        stepsToReproduce: ['Have a non-empty list.', 'Toggle the first item on/off/on/off while looking at the count at the bottom ("X items left").'],
        // notes: ['There are two hard problems in computer science: ... and off-by-one errors!'],
        bugTags: ['off-by-one'],
        bugLocations: [
          {
            file: 'src/store.js',
            line: 128
          }
        ]
      },
      {
        label: 'TODO',
        patch: ['no-callbacks', 'error7'],
        domains: ['store'],
        stepsToReproduce: ['Have a non-empty list.', 'Toggle or edit any item.', 'Re-load the page and find that it did not get saved.'],
        bugTags: ['error', 'data-access-array', 'data-access-object'],
        bugLocations: [
          {
            file: 'src/store.js',
            line: 75
          }
        ],
        difficulty: {
          error: {
            closeToCause: true
          }
        }
      },
      {
        label: '',
        patch: ['no-callbacks', 'error8'],
        domains: ['store'],
        stepsToReproduce: ['Have a non-empty list.', 'Toggle or edit any item.', 'Re-load to see that rendering has stopped working.'],
        // eslint-disable-next-line max-len
        warnings: ['This exercise may corrupt your `localStorage`. When that happens, you have to clear the `localStorage` manually (or if you don\t know how to: manually reset the exercise) before using the application again.'], // TODO: show at a relevant time? maybe patch into the `store.js` load code?
        bugTags: ['error', 'data-access-array', 'data-access-object'],
        sln: ['Merge, instead of override.'],
        bugLocations: [
          {
            file: 'src/store.js',
            line: 75
          }
        ],
        difficulty: {
          hard: 1,    // relatively hard, for this project
          notes: ['More difficult to reproduce, since each retry requires clearing `localStorage`.'],
          error: {
            closeToCause: false
          }
        }
      },
      // {
      //   label: '',
      //   patch: ['no-callbacks', 'errorX'],
      //   domains: [''],
      //   stepsToReproduce: ['Have a non-empty list.'],
      //   bugTags: [''],
      //   bugLocations: [
      //     {
      //       file: 'src/.js',
      //       line: 
      //     }
      //   ]
      // },



      // TODO: re-arrange `[total, total - completed, completed];`
      // TODO: Concept(accessing third-party data structures (DOM)) - `const elem = qs(`[data-id="${id}"]`);`

      // {
      //   // see: https://github.com/kentcdodds/es6-todomvc/issues/39
      //   label: 'After switching between filters, the old filter still applies.',
      //   // eslint-disable-next-line max-len
      //   description: 'Add a todo item -> Go to "Completed" filter -> Reload the page -> Select "All" -> Mark item as completed. -> Observe bug: It won\'t show up anymore, even though we are in "All".',
      //   runArgs: []
      // }

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
