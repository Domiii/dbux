import { newLogger } from '@dbux/common/src/log/logger';
import allApplications from '@dbux/data/src/applications/allApplications';
// eslint-disable-next-line no-unused-vars
import Application from '@dbux/data/src/applications/Application';
import { showWarningMessage } from '../codeUtil/codeModals';
import { runTaskWithProgressBar } from '../codeUtil/runTaskWithProgressBar';
import SocketClient from './SocketClient';

const Verbose = 1;
// const Verbose = true;

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('RuntimeClient');

export default class RuntimeClient extends SocketClient {
  /**
   * @type {Application}
   */
  application;

  constructor(server, socket) {
    super(server, socket);

    debug('connected');

    this.on('noop', () => {
      debug(`received NOOP`);
    });
    this.on('init', this._handleInit);
    this.on('data', this._handleData);
  }

  isReady() {
    return !!this.application;
  }

  /**
   * @return {Application}
   */
  _getOrCreateApplication(initialData) {
    const { applicationId } = initialData;
    let application;
    const firstTime = !applicationId;
    if (firstTime) {
      // first time
      application = allApplications.addApplication(
        initialData
      );
    }
    else {
      // reconnect
      application = allApplications.getById(applicationId);
    }

    log('init', firstTime ? '(new)' : '(reconnect)', application?.entryPointPath);
    return application;
  }

  _handleInit = (initialData) => {
    if (this.isReady()) {
      logError(`${initialData?.entryPointPath} - received init from client twice. Please restart application.`);
    }
    else {
      this.application = this._getOrCreateApplication(initialData);
      if (!this.application) {
        logError(`${initialData?.entryPointPath} - application claims to have reconnected but we don't have any of its previous information. Please restart application.`);
        return;
      }
    }

    this.socket.emit('init_ack', this.application.applicationId);
  }

  _handleData = async (data, ack) => {
    // debug(`handleData START`);
    try {
      await runTaskWithProgressBar(async (progress) => {
        progress.report({ message: 'Processing incoming runtime data...' });
        this.application.addData(data);
      }, { cancellable: false, title: `Application "${this.application.getPreferredName()}": ` });

      // hackfix: deal with unsupported stuff
      const dp = this.application.dataProvider;
      const { warnTraces } = dp.collections.traces;
      if (warnTraces.length) {
        showWarningMessage(`WARNING: ${warnTraces.length} unsupported traces detected`);
        warn(`  ${warnTraces.map(traceId => dp.util.makeTraceInfo(traceId)).join('\n  ')}`);
      }
    }
    catch (err) {
      logError(`WARNING: Error encountered while adding data. Analysis results might be incorrect.`, err);
    }
    finally {
      // debug(`handleData ACK, app time: ${Math.round(this.application.totalTimeSpent)}, ${Math.round(this.application.lastAddTimeSpent)}`);
      const timeSpent = this.application.lastAddTimeSpent;
      if (timeSpent > 500) {
        debug(`addData was a bit slow: ${Math.round(timeSpent / 1000).toFixed(2)}s`);
      }
      ack('data'); // send ack
    }
  }
}
