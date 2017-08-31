import express from 'express';
import request from 'supertest';
import RestAdapter from '../index';

const PRESIDENTS_QUERY = `
  query PresidentQuery {
    presidents {
      name
    }
  }
`;

const CHEESES_QUERY = `
  query CheesesQuery {
    cheeses {
      name
      location
    }
  }
`;

function setup(options = {}) {
  const adapter = new RestAdapter({
    isError:         (response) => !!response.errors,
    transformError:  (response) => response.errors[0].__http_secret__,
  });

  adapter.addEndpoint({
    path: '/presidents',
    getQuery: (request) => PRESIDENTS_QUERY,
    transformSuccess: response => ({ status: 200, body: response.presidents }),
  });

  adapter.addEndpoint({
    path: '/cheeses',
    getQuery: (request) => CHEESES_QUERY,
    transformSuccess: response => ({ status: 200, body: response.cheeses }),
  });

  const app = express();

  app.use(adapter.app);

  app.use('/graphql', (req, res) => {
    const response = options[req.body.query];
    res.setHeader('Content-Type', 'application/json');
    res.write(JSON.stringify(response));
    res.end();
  });

  return { app };
}

describe('requests', () => {
  describe('when the graphql return the query result', () => {
    it('return the response', () => {
      const { app } = setup({
        [PRESIDENTS_QUERY]: {
          presidents: [
            { name: 'Jacques Chirac' },
            { name: 'George Washington'},
          ],
        },
        [CHEESES_QUERY]: {
          cheeses: [
            { name: 'Camembert' },
            { name: 'Brie' },
          ]
        }
      });

      return request(app).get('/presidents').expect(200).expect(res => {
        expect(JSON.parse(res.text)).toEqual([
          { name: 'Jacques Chirac' },
          { name: 'George Washington'},
        ]);
      });

      return request(app).get('/cheeses').expect(200).expect(res => {
        expect(JSON.parse(res.text)).toEqual([
          { name: 'Camembert' },
          { name: 'Brie'},
        ]);
      });
    });
  });

  describe('when the graphql query errors ', () => {
    describe('and the error is JSON', () => {
      it('return the error', () => {
        const { app } = setup({
          [PRESIDENTS_QUERY]: {
            presidents: null,
            errors: [{
              message: 'No presidents found',
              __http_secret__: {
                status: 404,
                body: {
                  message: 'No presidents found',
                  code:    'monarchy',
                }
              },
            }]
          }
        });

        return request(app).get('/presidents').expect(404).expect(res => {
          expect(JSON.parse(res.text)).toEqual({
            message: 'No presidents found',
            code:    'monarchy',
          });
        });
      });
    });

    describe('and the error is text', () => {
      it('return the error', () => {
        const { app } = setup({
          [CHEESES_QUERY]: {
            presidents: null,
            errors: [{
              message: 'No cheeses found',
              __http_secret__: {
                status: 404,
                body: "<html>No cheeses found</html>"
              },
            }]
          }
        });

        return request(app).get('/cheeses').expect(404).expect(res => {
          expect(res.text).toEqual("<html>No cheeses found</html>");
        });
      });
    });
  });
});
