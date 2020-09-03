import FirestoreContainer from '../FirestoreContainer';

/** @typedef {import('../db').Db} Db */

const Verbose = true;

export default class Survey1Container extends FirestoreContainer {
  /**
   * @param {Db} db 
   */
  constructor(db) {
    super(db, 'survey1');
  }

  async init() {
    super.init();
  }

  storeSurveyResult = async (data) => {
    data = {
      ...data,
      createdAt: new Date()
    };

    Verbose && this.logger.debug('storeSurveyResult', data.installId, data);

    try {
      return await this.addDoc(data);
    }
    catch (err) {
      this.logger.logError(err);
      return undefined;
    }
  }
}