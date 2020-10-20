
import merge from 'lodash/merge';
import commonTranslation from '@dbux/common/src/lang/en';

const translation = {
  backend: {
    loginSuccess: 'Login successed.',
  }
};

merge(translation, commonTranslation);

export default translation;