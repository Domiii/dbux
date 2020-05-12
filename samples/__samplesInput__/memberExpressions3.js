
e(1).get('hi');
e(2).get('hi').end();

e(3)
  .get('hi')
  .end(function (err, res) {
    e(app)
      .get('/user/123')
      .expect(404, done);
  });

function e() {
  return {
    get(a) {
      return {
        end(cb) {
        },
        expect() {
        }
      }
    }
  };
}
