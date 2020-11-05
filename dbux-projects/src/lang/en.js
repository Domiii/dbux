
import merge from 'lodash/merge';
import commonTranslation from '@dbux/common/src/lang/en';

const translation = {
  backend: {
    loginSuccess: 'Login successed.',
  },
  uploadLog: {
    nothing: 'There is no log files to be uploaded.',
    uploadOne: 'Upload',
    uploadOne_plural: 'Upload one recent file',
    uploadAll: 'Upload all files',
    askForUpload: 'There are {{count}} log file to be upload.',
    askForUpload_plural: 'There are {{count}} log files to be upload.',
    showCanceled: 'Canceled.',
    done: 'Upload done.',
  },
};

merge(translation, commonTranslation);

export default translation;