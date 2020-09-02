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

  storeSurveyResult = async ({ installId, ...data }) => {
    data = {
      ...data,
      createdAt: new Date()
    };

    Verbose && this.logger.debug('storeSurveyResult', installId, data);

    try {
      await this.setDoc(installId, data);
    }
    catch (err) {
      this.logger.logError(err);
    }
  }
}