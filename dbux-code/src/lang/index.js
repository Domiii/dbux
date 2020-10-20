import i18next from 'i18next';
import { newLogger } from '@dbux/common/src/log/logger';
import enTranslation from './en';
import zhTranslation from './zh';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('Lang@Code');

async function _init(lng) {
  try {
    await i18next.init({
      debug: true,
      fallbackLng: 'en',
      lng,
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

export function translate(key) {
  return i18next.t(key);
}