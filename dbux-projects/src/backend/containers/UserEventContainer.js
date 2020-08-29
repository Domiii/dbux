import FirestoreContainer from '../FirestoreContainer';

export default class UserEventContainer extends FirestoreContainer {
  constructor(db) {
    super(db, 'userEvents');
  }

  async init() {
    // TODO: start listen on dbux-code/src/userEvents
    // TODO: start listen on dbux-projects/src/userEvents
    // TODO: data format of `userEvents` collection is just a single array of events { events: [...] }
    // TODO: write an event handler for when an event occurs:
    //    - add `event.createdAt = new Date()` to it
    //    - store it in a "buffer" array to reduce writes (in Firestore every read or write incurs a cost).
    //    - Store the buffer array to DB (1) if it contains at least 100 events or (2) 5 minutes after receiving the first event. Make sure, that buffer never gets lost (use Memento etc.)
    //      - return this.addDoc(data);
    //    - wrap the event handler with try/catch (because no one will await on it)

    // NOTE: The maximum document size in Firestore is 1MiB (see: https://firebase.google.com/docs/firestore/quotas)
  }
}