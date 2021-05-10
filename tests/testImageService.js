const request = require('supertest');
const path = require('path');
const app = require('../app');

describe('POST /api/upload', function () {
    console.log(__dirname)
    it('responds with json', function(done) {
        request(app)
          .post('/api/upload')
          .attach('file', path.resolve('testImage.jpg'))
          .expect(200);
      });
});