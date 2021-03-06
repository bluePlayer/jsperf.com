const path = require('path');

const Lab = require('lab');
const Code = require('code');
const Hapi = require('hapi');
const sinon = require('sinon');

const BrowsePlugin = require('../../../../../server/web/browse/index');

const MockRepo = {
  register: (server, options, next) => {
    server.expose('getLatestVisible', function () {});
    server.expose('getLatestVisibleForAuthor', function () {});
    next();
  }
};

MockRepo.register.attributes = {
  name: 'repositories/pages'
};

const lab = exports.lab = Lab.script();
let request, server, getLatestVisibleStub, getLatestVisibleForAuthorStub;

lab.beforeEach(function (done) {
  const plugins = [ MockRepo, BrowsePlugin ];
  server = new Hapi.Server();
  server.connection();
  server.register(require('vision'), () => {
    server.views({
      engines: {
        hbs: require('handlebars')
      },
      path: './server/web',
      layout: true,
      helpersPath: 'templates/helpers',
      partialsPath: 'templates/partials',
      relativeTo: path.join(__dirname, '..', '..', '..', '..', '..')
    });
    server.register(plugins, (err) => {
      if (err) return done(err);

      getLatestVisibleStub = sinon.stub(server.plugins['repositories/pages'], 'getLatestVisible');
      getLatestVisibleForAuthorStub = sinon.stub(server.plugins['repositories/pages'], 'getLatestVisibleForAuthor');

      done();
    });
  });
});

lab.experiment('browse', function () {
  lab.experiment('page', function () {
    lab.beforeEach(function (done) {
      request = {
        method: 'GET',
        url: '/browse'
      };

      done();
    });

    lab.test('it responds with the browse page', function (done) {
      getLatestVisibleStub.returns(Promise.resolve([]));

      server.inject(request, function (response) {
        Code.expect(response.statusCode).to.equal(200);

        done();
      });
    });

    lab.test('it responds with generic error', function (done) {
      getLatestVisibleStub.returns(Promise.reject(new Error()));

      server.inject(request, function (response) {
        Code.expect(response.statusCode).to.equal(200);

        done();
      });
    });
  });

  lab.experiment('atom', function () {
    lab.beforeEach(function (done) {
      request = {
        method: 'GET',
        url: '/browse.atom'
      };

      done();
    });

    lab.test('it responds with atom feed', function (done) {
      getLatestVisibleStub.returns(Promise.resolve([
        {
          updated: new Date(),
          published: new Date()
        }
      ]));

      server.inject(request, function (response) {
        Code.expect(response.statusCode).to.equal(200);
        Code.expect(response.headers['content-type']).to.equal('application/atom+xml;charset=UTF-8');
        Code.expect(response.result).to.be.string().and.to.startWith('<feed').and.to.contain('<entry>');

        done();
      });
    });

    lab.test('it responds with empty atom feed', function (done) {
      getLatestVisibleStub.returns(Promise.resolve([]));

      server.inject(request, function (response) {
        Code.expect(response.statusCode).to.equal(200);
        Code.expect(response.headers['content-type']).to.equal('application/atom+xml;charset=UTF-8');
        Code.expect(response.result).to.be.string().and.to.startWith('<feed').and.to.not.contain('<entry>');

        done();
      });
    });

    lab.test('it responds with generic error', function (done) {
      getLatestVisibleStub.returns(Promise.reject(new Error()));

      server.inject(request, function (response) {
        Code.expect(response.statusCode).to.equal(500);

        done();
      });
    });
  });

  lab.experiment('author page', function () {
    lab.beforeEach(function (done) {
      request = {
        method: 'GET',
        url: '/browse/test-author'
      };

      done();
    });

    lab.test('it responds with the browse page', function (done) {
      var testTitle = 'My First Test';
      getLatestVisibleForAuthorStub.returns(Promise.resolve([{
        updated: new Date(),
        published: new Date(),
        title: testTitle,
        testCount: 1,
        revision: 1,
        revisionCount: 1
      }]));

      server.inject(request, function (response) {
        Code.expect(response.statusCode).to.equal(200);
        Code.expect(response.result).to.be.string().and.to.contain(testTitle);

        done();
      });
    });

    lab.test('it responds with not found if no results for author', function (done) {
      getLatestVisibleForAuthorStub.returns(Promise.resolve([]));
      server.inject(request, function (response) {
        Code.expect(response.statusCode).to.equal(404);

        done();
      });
    });

    lab.test('it responds with generic error', function (done) {
      getLatestVisibleForAuthorStub.returns(Promise.reject(new Error()));

      server.inject(request, function (response) {
        Code.expect(response.statusCode).to.equal(500);

        done();
      });
    });
  });

  lab.experiment('author atom', function () {
    lab.beforeEach(function (done) {
      request = {
        method: 'GET',
        url: '/browse/test-author.atom'
      };

      done();
    });

    lab.test('it responds with atom feed', function (done) {
      getLatestVisibleForAuthorStub.returns(Promise.resolve([
        {
          updated: new Date(),
          published: new Date()
        }
      ]));

      server.inject(request, function (response) {
        Code.expect(response.statusCode).to.equal(200);
        Code.expect(response.headers['content-type']).to.equal('application/atom+xml;charset=UTF-8');
        Code.expect(response.result).to.be.string().and.to.startWith('<feed').and.to.contain('<entry>');

        done();
      });
    });

    lab.test('it responds with empty atom feed', function (done) {
      getLatestVisibleForAuthorStub.returns(Promise.resolve([]));

      server.inject(request, function (response) {
        Code.expect(response.statusCode).to.equal(200);
        Code.expect(response.headers['content-type']).to.equal('application/atom+xml;charset=UTF-8');
        Code.expect(response.result).to.be.string().and.to.startWith('<feed').and.to.not.contain('<entry>');

        done();
      });
    });

    lab.test('it responds with generic error', function (done) {
      getLatestVisibleForAuthorStub.returns(Promise.reject(new Error()));

      server.inject(request, function (response) {
        Code.expect(response.statusCode).to.equal(500);

        done();
      });
    });
  });
});
