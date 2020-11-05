
import merge from 'lodash/merge';
import commonTranslation from '@dbux/common/src/lang/zh';

const translation = {
  backend: {
    loginSuccess: '登入成功。',
  },
  uploadLog: {
    nothing: '沒有需要上傳的紀錄檔',
    uploadOne: '上傳最近的一個紀錄檔',
    uploadAll: '上傳所有紀錄檔',
    askForUpload: '有 {{count}} 個準備上傳的紀錄檔。',
    showCanceled: '已取消。',
    done: '上傳完畢。',
  },
};

merge(translation, commonTranslation);

export default translation;