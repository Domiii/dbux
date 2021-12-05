// NOTE: Jest forcefully exits if asynchronous operations don't finish within 1s.
// We can use this workaround (with `setupFilesAfterEnv`) to make sure, it will wait for Dbux to finish.
afterAll(() => {
  return global.__dbux__?.client.waitForQueue();
});