
import merge from 'lodash/merge';
import commonTranslation from '@dbux/common/src/lang/en';

const translation = {
  backend: {
    loginSuccess: 'Login successed.',
  },
  uploadLog: {
    alreadyUploading: 'There are files is uploading.',
    nothing: 'There is no log files to be uploaded.',
    uploadOne: 'Upload',
    uploadOne_plural: 'Upload single most recent file',
    uploadAll: 'Upload all missing files',
    askForUpload: 'You have {{count}} log file that have not been uploaded yet. Do you want to upload them now?',
    askForUpload_plural: 'You have {{count}} log files that have not been uploaded yet. Do you want to upload them now?',
    showCanceled: 'Canceled.',
    uploading: 'Uploading...',
    done: 'Upload done.',
  },
};

merge(translation, commonTranslation);

export default translation;