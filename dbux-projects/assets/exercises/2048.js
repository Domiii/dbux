const configs = [
  {
    label: 'baseline',
    patch: null,
    description: 'The original game',
    runArgs: [],
    // bugLocations: [
    //   {
    //     file: 'src/controller.js',
    //     line: 65
    //   }
    // ]
  },
  {
    label: 'Error when starting',
    description: 'Game does not start. An error is reported.',
    patch: 'error1',
    bugLocations: [
      {
        file: 'js/html_actuator.js',
        line: 82
      }
    ]
  },
  {
    label: 'Right arrow button does not work anymore.',
    description: 'You can still use D to move right, but the right arrow button does not work.',
    patch: 'error2',
    bugLocations: [
      {
        file: 'js/keyboard_input_manager.js',
        line: Array.from({ length: 50 - 38 }, (_, i) => i + 38)
      }
    ]
  },
  {
    label: 'The reset key is now Q. But it should be R.',
    description: 'Usually, if you press R, the game resets. But that does not work anymore. It uses Q instead. But we want R!',
    patch: 'error3',
    bugLocations: [
      {
        file: 'js/keyboard_input_manager.js',
        line: 66
      }
    ]
  },
  // {
  //   label: '',
  //   description: '',
  //   patch: 'error4',
  //   bugLocations: [
  //     {
  //       file: 'js/.js',
  //       line: 0
  //     }
  //   ]
  // }
];

module.exports = configs;