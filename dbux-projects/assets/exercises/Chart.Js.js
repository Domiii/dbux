// TODO: load automatically from BugsJs bug database
// NOTE: some bugs have multiple test files, or no test file at all
// see: https://github.com/BugsJS/express/releases?after=Bug-4-test
const configs = [
  {
    label: 'baseline',
    description: 'Baseline: select sample page.',
    runArgs: [],
    website: 'http://localhost:10001/samples/index.html'
  },
  {
    label: 'baseline_vertical_bar',
    description: 'Baseline: vertical bar graph.',
    runArgs: [],
    website: 'http://localhost:10001/samples/charts/bar/vertical.html'
  },
  // more bugs:
  // {
  // * easingFunction is not a function (v2 only?) - https://github.com/chartjs/Chart.js/issues/7180
  // * maxTicksLimit does not work for gridlines when ticks are not displayed - https://github.com/chartjs/Chart.js/issues/7302
  // }
  // bugs not suited for learning:
  // * Right-most point gets cut off in line chart: more of a layout bug or feature change - https://github.com/chartjs/Chart.js/issues/6414
  //
  // bugs that seem good but...:
  // * only on ipad, iphone; also not reliably reproducible - https://github.com/chartjs/Chart.js/issues/6235
];

module.exports = configs;