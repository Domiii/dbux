import { newLogger } from '@dbux/common/src/log/logger';
import PathwaysDataBuffer from './PathwaysDataBuffer';

// eslint-disable-next-line no-unused-vars
const { log, debug, warn, error: logError } = newLogger('PathwaysDataContainer');

// const Verbose = true;
const Verbose = false;

export class PathwaysDataContainer {
  /**
   * @type {Object<string, PathwaysDataBuffer>}
   */
  buffers;

  constructor() {
    this.prevListener = null;
    this.reset();
  }

  reset(sessionId = null) {
    Verbose && log(`Reset with sessionId ${sessionId}`);
    this.buffers = {};
    if (sessionId) {
      this.buffers = {
        applications: new PathwaysDataBuffer(sessionId, 'applications'),
        testRuns: new PathwaysDataBuffer(sessionId, 'testRuns'),
        steps: new PathwaysDataBuffer(sessionId, 'steps'),
        actionGroups: new PathwaysDataBuffer(sessionId, 'actionGroups'),
        userActions: new PathwaysDataBuffer(sessionId, 'userActions'),
      };
    }
  }

  onSessionChanged = async (session) => {
    if (this.sessionId !== session?.sessionId) {
      this.sessionId = session?.sessionId;

      // stop listening on previous events
      this.prevListener?.();

      // flush all current data
      const flushOldPromise = this.flushAll();

      // make new buffers
      this.reset(this.sessionId);

      // listen on new events
      this.prevListener = session?.pdp.onAnyData((allData) => {
        const serializedData = session?.pdp.serializeJson(Object.entries(allData));
        this.addAllData(serializedData);
      });

      await flushOldPromise;
    }
  }

  addAllData = ({ collections }) => {
    for (const collectionName of Object.keys(collections)) {
      this.buffers[collectionName].add(collections[collectionName]);
    }
  }

  async maybeFlushAll() {
    return await Promise.all(Object.values(this.buffers).map((buffer) => buffer.maybeFlush()));
  }

  async flushAll() {
    return await Promise.all(Object.values(this.buffers).map((buffer) => buffer.flush()));
  }
}

/**
 * @type {PathwaysDataContainer}
 */
let container;

export function initPathwaysDataContainer() {
  container = new PathwaysDataContainer();

  return container;
}
