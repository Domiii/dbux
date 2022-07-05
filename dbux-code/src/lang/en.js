
import merge from 'lodash/merge';
import commonTranslation from '@dbux/common/src/lang/en';

const translation = {
  newOnDbux: {
    message: 'Hi! You have recently installed Dbux. Do you need some help?',
    yes: 'Yes',
    no: 'No. Please don\'t bother me.',
  },
  onError: {
    show: 'Show Log',
    suck: 'This sucks! (❔)',
    // eslint-disable-next-line max-len
    suckMessage: `If this error is causing you trouble, you can:\n→ Join Discord and ask for help\n→ Check out the Dbux website for more information\n→ If this is an unexpected error, grab the log, your system's basic information and report an issue on Github`,
  },
  showHelp: {
    defaultMessage: 'If you need help with Dbux, here are a few places to go:',
    discord: 'Ask on Discord',
    manual: 'Open Manual',
    readDbux: 'Read Dbux\'s known limitations',
    report: 'Report Issue',
    tutorial: 'Start Tutorial',
    survey: 'Take Survey',
  },
  busyNow: 'busy now...',
  noTrace: 'No traces at cursor.',
  savedSuccessfully: 'File saved successfully: {{fileName}}',
  noApplication: 'No application selected',
  projectView: {
    stopPractice: {
      giveUp: 'Are you sure you want to give up the timed challenge?',
      stop: 'Do you want to stop the practice session?',
    },
    existBug: {
      message: 'You are currently practicing {{bug}}',
      ok: 'OK',
      giveUp: 'Give Up',
    },
    cancelPractice: {
      message: 'Do you want to stop your current practice session to continue?',
      giveUp: 'Give up',
    },
  },
};

merge(translation, commonTranslation);

export default translation;