import i18next from 'i18next';
import { newLogger } from '@dbux/common/src/log/logger';
import enTranslation from './en';
import zhTranslation from './zh';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('lang');

let i18nextInstance;
async function _init(lng) {
  try {
    i18nextInstance = i18next.createInstance();

    await i18nextInstance.init({
      debug: true,
      fallbackLng: 'en',
      lng,
      interpolation: {
        /**
         * @see https://stackoverflow.com/a/40866604
         */
        escapeValue: false
      },
      resources: {
        en: {
          translation: enTranslation,
        },
        zh: {
          translation: zhTranslation,
        },
      },
    });
  }
  catch (e) {
    throw new Error(`Init language support failed: ${e.message}`);
  }
}

let initPromise;
export default async function (lang) {
  if (initPromise) {
    return initPromise;
  }

  return initPromise = _init(lang);
}

export function translate(key, data) {
  return i18nextInstance.t(key, data);
}