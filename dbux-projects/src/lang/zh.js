
import merge from 'lodash/merge';
import commonTranslation from '@dbux/common/src/lang/zh';

const translation = {
  backend: {
    loginSuccess: '登入成功。',
  },
  uploadLog: {
    alreadyUploading: '已經正在上傳了。',
    nothing: '沒有需要上傳的紀錄檔。',
    uploadOne: '上傳最近的一個紀錄檔',
    uploadAll: '上傳所有尚未上傳的紀錄檔',
    askForUpload: '有 {{count}} 個尚未上傳的紀錄檔。要現在上傳嗎？',
    showCanceled: '已取消。',
    uploading: '上傳中…',
    done: '上傳完畢。',
  },
};

merge(translation, commonTranslation);

export default translation;