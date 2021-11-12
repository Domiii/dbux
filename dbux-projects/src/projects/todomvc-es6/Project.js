import { pathResolve } from '@dbux/common-node/src/util/pathUtil';
import WebpackBuilder from '../../buildTools/WebpackBuilder';
import Exercise from '../../projectLib/Exercise';
import Project from '../../projectLib/Project';

/** @typedef {import('../../projectLib/ExerciseConfig').ExerciseConfig} ExerciseConfig */


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

  /**
   * git diff --ignore-cr-at-eol --color=never | unix2dos > ../../dbux-projects/assets/_patches_/todomvc-es6/error.patch
   * @type {ExerciseConfig[]}
   */
  exercises = [
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
      tags: ['typo'],
      bugLocations: [
        {
          file: 'src/controller.js',
          line: 147
        }
      ],
      difficulty: {
        error: {
          atCause: true
        }
      }
    },
    {
      label: 'Completed TODO items are shown as not completed and vice versa (only during initial rendering)',
      patch: ['no-callbacks', 'error2'],
      domains: ['init', 'render'],
      stepsToReproduce: [
        'Have a non-empty list.',
        'Make sure, some items are completed, some not.',
        'Check whether they are rendered as "completed" correctly.'
      ],
      tags: ['boolean-logic', 'operator'],
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
      tags: ['Array.reduce'],
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
      label: 'List always renders as empty, but no error message',
      patch: ['no-callbacks', 'error4'],
      domains: ['render'],
      stepsToReproduce: ['Have a non-empty list.'],
      tags: [
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
      stepsToReproduce: [
        'Have a non-empty list.',
        'Make sure, exactly one item is not marked as "done" yet.',
        '-> It says "1 items left", but it should be "1 item left".'
      ],
      tags: ['wrong-condition'],
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
      stepsToReproduce: [
        'Have a non-empty list.',
        'Toggle the first item on/off/on/off while looking at the count at the bottom ("X items left").',
        'Toggle any other item on/off.',
        '-> The count is only wrong for the first item.'
      ],
      // notes: ['There are two hard problems in computer science: ... and off-by-one errors!'],
      tags: ['off-by-one'],
      bugLocations: [
        {
          file: 'src/store.js',
          line: 128
        }
      ]
    },
    {
      label: 'Edit changes are not saved anymore.',
      patch: ['no-callbacks', 'error7'],
      domains: ['store'],
      stepsToReproduce: [
        'Have a non-empty list.',
        'Toggle or edit any item.',
        'Re-load the page and find that it did not get saved.'
      ],
      tags: ['error', 'data-access-array', 'data-access-object'],
      bugLocations: [
        {
          file: 'src/store.js',
          line: 75
        }
      ],
      difficulty: {
        error: {
          atCause: true
        }
      }
    },
    {
      label: 'Editing corrupts the list.',
      patch: ['no-callbacks', 'error8'],
      domains: ['store'],
      stepsToReproduce: [
        'Have a non-empty list.',
        'Toggle or edit any item.',
        'Re-load to see that rendering has stopped working.'
      ],
      // eslint-disable-next-line max-len
      warnings: ['This bug may corrupt your `localStorage`. When that happens, you have to clear the `localStorage` manually (or if you don\t know how to: manually reset the exercise) before using the application again.'], // TODO: show warning at a relevant time. Maybe patch into the `store.js` load code.
      tags: ['error', 'data-access-array', 'data-access-object'],
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
          atCause: false
        }
      }
    },
    {
      label: 'Empty list initialization is broken.',
      patch: ['no-callbacks', 'error9'],
      domains: ['store'],
      // eslint-disable-next-line max-len
      stepsToReproduce: [
        'Start with an empty list.',
        'Items cannot be added.',
        'Reminder: there is a single-line bug fix.'
      ],
      tags: ['serialization'],
      hints: ['There is an error during initialization.', 'TODO'],
      courseNotes: ['Discuss how there are different valid approaches, but only one is single line.'],
      bugLocations: [
        {
          file: 'src/store.js',
          line: 24
        }
      ],
      difficulty: {
        error: {
          atCause: false
        }
      }
    },
    {
      label: '"X items left" counting the wrong items.',
      patch: ['no-callbacks', 'error10'],
      domains: ['controller', 'store'],
      stepsToReproduce: [
        'Have a non-empty list.',
        'Toggle items. Observe that the "X items left" count at the bottom is incorrect.'
      ],
      // eslint-disable-next-line max-len
      hints: [
        'Is there a pattern to how many "items left" there are?',
        'TODO'
      ],
      courseNotes: [
        ''
      ],
      tags: ['data-access-array'],
      bugLocations: [
        {
          file: 'src/store.js',
          line: 130
        },
        {
          file: 'src/controller.js',
          line: 147
        }
      ]
    },
    {
      label: 'N',
      patch: ['no-callbacks', 'error11'],
      domains: ['TODO'],
      stepsToReproduce: ['Have a non-empty list.', 'TODO'],
      tags: ['TODO'],
      bugLocations: [
        {
          file: 'src/TODO.js',
          line: TODO
        }
      ]
    },
    // {
    //   label: 'TODO',
    //   patch: ['no-callbacks', 'errorTODO'],
    //   domains: ['TODO'],
    //   stepsToReproduce: ['Have a non-empty list.', 'TODO'],
    //   tags: ['TODO'],
    //   bugLocations: [
    //     {
    //       file: 'src/TODO.js',
    //       line: TODO
    //     }
    //   ]
    // },
    // {
    //   label: 'TODO',
    //   patch: ['no-callbacks', 'errorTODO'],
    //   domains: ['TODO'],
    //   stepsToReproduce: ['Have a non-empty list.', 'TODO'],
    //   tags: ['TODO'],
    //   bugLocations: [
    //     {
    //       file: 'src/TODO.js',
    //       line: TODO
    //     }
    //   ]
    // },
    // {
    //   label: 'TODO',
    //   patch: ['no-callbacks', 'errorTODO'],
    //   domains: ['TODO'],
    //   stepsToReproduce: ['Have a non-empty list.', 'TODO'],
    //   tags: ['TODO'],
    //   bugLocations: [
    //     {
    //       file: 'src/TODO.js',
    //       line: TODO
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

  /**
   * 
   * @param {Exercise} exercise 
   */
  decorateExerciseForRun(exercise) {
    // fix relative file paths
    exercise.mainEntryPoint = this.builder.getEntryOutputPath('bundle', exercise);
    if (exercise.bugLocations) {
      exercise.bugLocations = exercise.bugLocations.map(loc => (loc && {
        ...loc,
        file: this.getAbsoluteFilePath(loc.file)
      }));
    }
  }

  async runCommand(bug, cfg) {
    // nothing to do yet
  }
}
