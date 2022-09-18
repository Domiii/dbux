// future-work: load automatically from BugsJs bug database
// NOTE: some bugs have multiple test files, or no test file at all
// see: https://github.com/BugsJS/express/releases?after=Bug-4-test

const configs = [
  {
    // https://github.com/BugsJS/express/releases/tag/Bug-1-test
    // https://github.com/BugsJS/express/commit/8bd36202bef586889d20bd5fa0732d3495da54eb
    // https://github.com/expressjs/express/issues/2458
    id: 1,
    name: 'get-put-get',
    label: 'options: GET,PUT,GET',
    testRe: 'OPTIONS should only include each method once',
    testFilePaths: ['test/app.options.js'],
    bugLocations: [
      {
        fileName: 'lib/router/index.js',
        line: 156
      },
      {
        fileName: 'lib/router/index.js',
        line: 210
      }
    ]
  },

  {
    // https://github.com/BugsJS/express/releases/tag/Bug-2-test
    // https://github.com/BugsJS/express/commit/3260309b422cd964ce834e3925823c80b3399f3c
    id: 2,
    name: 'hop-count-https',
    label: 'hop count + HTTPS',
    testRe: [
      'req .protocol when "trust proxy" is enabled when trusting hop count should respect X-Forwarded-Proto',
      // 'when "trust proxy" trusting hop count should respect X-Forwarded-Proto'
    ],
    testFilePaths: ['test/req.protocol.js', 'test/req.secure.js'],
    bugLocations: [
      {
        fileName: 'lib/request.js',
        line: 361
      },
      {
        fileName: 'lib/utils.js',
        line: 383
      }
    ]
  },


  // ###########################################################################
  // more bugs
  // ###########################################################################
  // {
  //   // NOTE: this test passes by default
  //   // https://github.com/BugsJS/express/commit/4a59ea5dd0a7cb5b8cce80be39a5579876993cf1
  //   id: 3,
  //   testRe: 'res .* should work when only .default is provided',
  //   testFilePaths: ['test/res.format.js']
  // },
  {
    // https://github.com/BugsJS/express/commit/337662df8c02d379e5a14b4f0155ecb29b4aa81e
    id: 4,
    name: 'ip-subdomains',
    label: 'ip vs. subdomains',
    testRe: [
      'should work with IPv[46] address',
      'should return an array with the whole IPv[46]',
    ],
    testFilePaths: ['test/req.subdomains.js'],
    bugLocations: [
      {
        fileName: 'lib/request.js',
        line: 457
      }
    ]
  },
  {
    // https://github.com/BugsJS/express/commit/796657f6f67bd8f8dfae8d25a2d353c8d657da50
    id: 5,
    name: 'file-paths-slashes',
    label: 'Windows file paths and slashes',
    testRe: 'utils\\.isAbsolute\\(\\) should support windows',
    testFilePaths: ['test/utils.js'],
    bugLocations: [
      {
        fileName: 'lib/utils.js',
        line: 70
      }
    ]
  },
  // {
  //   // NOTE: passing by default
  //   // https://github.com/BugsJS/express/commit/f07f197a3cc7805bce37b3a4908e844b8d7f7455
  //   id: 6,
  //   testRe: 'app.head\\(\\) should override prior',
  //   testFilePaths: ['test/app.head.js'],
  //   require: []
  // },
  {
    // NOTE: more programming than debugging problem
    id: 7,
    testRe: '.sendFile.* (should invoke the callback without error when HEAD|should invoke the callback without error when 304)',
    testFilePaths: ['test/res.sendFile.js'],
    // bugLocations: [
    //   {
    //     fileName: 'lib/.js',
    //     line: 
    //   }
    // ]
  },
  {
    id: 8,
    label: 'Router.use: empty path',
    testRe: 'should support empty string path',
    testFilePaths: ['test/app.use.js'],
    bugLocations: [
      {
        fileName: 'lib/application.js',
        line: 168
      }
    ]
  },
  {
    // https://github.com/BugsJS/express/commit/af824af13e1594e33ca76b9df5983cc4c8ad1b70
    id: 9,
    label: 'empty mountpath',
    testRe: 'should return the mounted path',
    testFilePaths: ['test/app.js'],
    bugLocations: [
      {
        fileName: 'lib/application.js',
        line: 171
      }
    ]
  },
  // {
  //   // https://github.com/BugsJS/express/commit/690be5b929559ab4590f45cc031c5c2609dd0a0f
  //   id: 10,
  //   testRe: 'should be called for any URL when "*"',
  //   testFilePaths: ['test/Router.js']
  // },
  // NOTE: multiple tests per bug
  // see: https://github.com/BugsJS/express/releases/tag/Bug-10-test 
  //    -> https://github.com/BugsJS/express/commit/690be5b929559ab4590f45cc031c5c2609dd0a0f
  {
    id: 11,
    label: 'send numbers as json',
    testRe: 'should send number as json',
    testFilePaths: ['test/res.send.js'],
    solutionCommit: 'da7b0cdf2abd82c31b1f561d49eb23da81284ae7',
    bugLocations: [
      ...[98, 101, 102, 108, 109, 110, 111].map(line => ({
        fileName: 'lib/response.js',
        line
      }))
    ]
  },
  {
    id: 12,
    label: 'param indexes',
    testRe: [
      'should keep correct parameter indexes',
      // 'should work following a partial capture group'
    ],
    testFilePaths: ['test/app.router.js'],
    bugLocations: [
      {
        fileName: 'lib/router/layer.js',
        line: 122
      }
    ]
  },
  // {
  //   // NOTE: requires too many changes
  //   id: 13,
  //   label: 'param override (loki)',
  //   testRe: 'should support altering req.params across routes',
  //   testFilePaths: ['test/app.param.js'],
  //   // bugLocations: [
  //   //   {
  //   //     fileName: 'lib/.js',
  //   //     line: 
  //   //   }
  //   // ]
  // },
  {
    id: 14,
    label: 'empty url in request',
    testRe: 'should handle blank URL',
    testFilePaths: ['test/Router.js'],
    bugLocations: [
      ...[190, 286, 288].map(line => ({
        fileName: 'lib/router/index.js',
        line
      })
      ),
      ...[98, 102].map(line => ({
        fileName: 'lib/router/layer.js',
        line
      }))
    ]
  },
  {
    /**
     * NOTE: shutdown delayed for 2 mins
     * 
     * https://github.com/BugsJS/express/releases/tag/Bug-15-full
     */
    id: 15,
    label: 'default Content-Type',
    testRe: [
      'with canonicalized mime types should default the Content-Type'
      // 'should set the correct  charset for the Content[-]Type',
      // 'should default the Content-Type'
    ],
    testFilePaths: ['test/res.format.js'],
    // TODO: need to also add some pseudo test file, to keep the process running a little longer, so data gets sent out.
    // keepAlive: false,
    require: [],
    bugLocations: [
      {
        fileName: 'lib/response.js',
        line: 471
      },
      ...[90, 91, 92].map(line => ({
        fileName: 'lib/utils.js',
        line
      }))
    ]
  },
  /**
   * Bug locations should be at line 821 "and" 826 of 'test/res.redirect.js'(`url` should be replaced with `address`).
   * Currently we do not support bugs that require fixes on multiple line in the same time, needs further design.
   */
  // {
  //   id: 16,
  //   label: 'redirect with custom status code',
  //   testRe: [
  //     'should include the redirect type'
  //   ],
  //   testFilePaths: ['test/res.redirect.js'],
  //   bugLocations: [798, 799, 801].map(line => ({
  //     fileName: 'lib/response.js',
  //     line
  //   }))
  // },
  {
    id: 17,
    label: 'missing "view engine"',
    testRe: [
      'should error without "view engine" set and file extension to a non\\-engine module'
    ],
    testFilePaths: ['test/res.render.js'],
    bugLocations: [
      {
        fileName: 'lib/view.js',
        line: 79
      }
    ]
  },

  {
    id: 18,
    label: 'param treats next("route") as error',
    testRe: [
      'should not call when values differ on error',
      'should call when values differ when using "next"'
    ],
    testFilePaths: ['test/app.param.js'],
    bugLocations: [
      {
        fileName: 'lib/router/index.js',
        line: 360
      }
    ]
  },

  {
    id: 19,
    label: 'req.params should support array of paths',
    testRe: ['should work in array of paths'],
    testFilePaths: ['test/app.router.js'],
    bugLocations: [
      ...[99, 119, 121, 122].map(line => ({
        fileName: 'lib/router/layer.js',
        line
      }))
    ]
  },
  {
    id: 20,
    testRe: 'should throw when Content\\-Type is an array',
    testFilePaths: ['test/res.set.js'],
    bugLocations: [720].map(line => ({
      fileName: 'lib/response.js',
      line
    }))
  },
  {
    id: 21,
    testRe: 'should provide req\\.params to all handlers',
    testFilePaths: ['test/app.router.js'],
    // bugLocations: [720].map(line => ({
    //   fileName: 'lib/response.js',
    //   line
    // }))
  },
  {
    id: 22,
    testRe: [
      'should strip port number',
      'should work with IPv6 Host'
    ],
    testFilePaths: ['test/req.host.js'],
    testArgs: '--globals setImmediate,clearImmediate',
    require: [], // has no test.env
    bugLocations: [
      {
        fileName: 'lib/request.js',
        line: 479
      }
    ]
  },
  {
    // https://github.com/BugsJS/express/commit/6a0221553b49938da5d18d4afcbd5e29ebb363ee
    id: 23,
    testRe: [
      'should support array of paths with middleware array',
      'should accept.* array.* of middleware.*'
    ],
    testFilePaths: ['test/app.use.js'],
    bugLocations: [160, 161, 162].map(line => ({
      fileName: 'lib/application.js',
      line
    }))
  },
  {
    id: 24,
    testRe: 'when error occurs in respone handler should pass error to callback',
    testFilePaths: ['test/app.options.js'],
    require: [],
    bugLocations: [156, 157].map(line => ({
      fileName: 'lib/router/index.js',
      line
    }))
  },
  {
    id: 25,
    testRe: 'should ignore object callback parameter with jsonp',
    testFilePaths: ['test/res.jsonp.js'],
    testArgs: '--globals setImmediate,clearImmediate',
    require: [],
    bugLocations: [241, 242].map(line => ({
      fileName: 'lib/response.js',
      line
    }))
  },
  {
    id: 26,
    testRe: 'should ignore FQDN in path',
    testFilePaths: ['test/Router.js'],
    bugLocations: [
      {
        fileName: 'lib/router/index.js',
        line: 129
      }
    ]
  },
  {
    id: 27,
    testRe: 'should defer all the param routes',
    testFilePaths: ['test/app.param.js'],
    // bugLocations: [
    //   {
    //     fileName: 'lib/.js',
    //     line: 
    //   }
    // ]
  }
];

module.exports = configs;