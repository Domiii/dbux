
import merge from 'lodash/merge';
import commonTranslation from '@dbux/common/src/lang/zh';

const translation = {
  newOnDbux: {
    message: '嗨，看起來你剛剛安裝了 Dbux。你需要一些協助嗎？',
    yes: '好啊！',
    no: '不。請不要打擾我。',
  },
  onError: {
    show: '顯示紀錄',
    suck: '這爛透了！',
    // eslint-disable-next-line max-len
    suckMessage: `如果這個問題造成你的困擾，你可以\n→ 加入 Discord 並尋求幫助\n→ 查看 Dbux 網站以獲取更多資訊\n→ 如果這是一個未預期的錯誤，你可以在 github 上回報一個 issue 並附上相關的 log 和系統資訊。`,
  },
  showHelp: {
    defaultMessage: '如果你需要一些幫助，你可以：',
    discord: '打開 Dbux 的 Discord',
    manual: '打開手冊',
    readDbux: '了解 Dbux 的限制',
    report: '回報問題',
    tutorial: '開始教學模式',
    survey: '參與調查',
  },
  busyNow: '[dbux] 忙碌中...',
  noTrace: '鍵盤游標位置沒有 trace。',
  savedSuccessfully: '檔案儲存成功: {{fileName}}。',
  noApplication: '[Dbux] 未選擇 application。',
  projectView: {
    stopPractice: {
      giveUp: '確定要放棄計時挑戰嗎？',
      stop: '確定要停止練習嗎？',
    },
    existBug: {
      message: '[Dbux] 你正在練習 {{bug}}',
      ok: '好',
      giveUp: '放棄',
    },
    cancelPractice: {
      message: '繼續此操作將會使練習階段停止，確定繼續嗎？',
      giveUp: '繼續',
    },
  },
};

merge(translation, commonTranslation);

export default translation;