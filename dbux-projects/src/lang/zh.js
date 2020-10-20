
import merge from 'lodash/merge';
import commonTranslation from '@dbux/common/src/lang/zh';

const translation = {
  backend: {
    loginSuccess: '登入成功。',
  },
};

merge(translation, commonTranslation);

export default translation;