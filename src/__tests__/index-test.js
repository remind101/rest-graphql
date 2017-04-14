import express from 'express';
import request from 'supertest';
import { createApp, RestAdapterConfig } from '../index';

const testQuery = `
  query TestQuery {
    user {
      id
      name
    }
  }
`;

const testConfig = {
  path: '/user',
  getQuery: (request) => testQuery,
  transformResponse: response => response.user,
}

describe('requests', () => {
  const app = express();
  app.use(createApp([testConfig]));
  app.use('/graphql', (req, res) => {
    return Promise.resolve(req.body.query).then(query => {
      expect(query).toEqual(testQuery);
      res.setHeader('Content-Type', 'application/json');
      res.json({ user: { id: 1, name: 'test' } });
      res.end();
    });
  });

  it('transforms requests', () => request(app).get('/user').expect(200).expect(res => {
    expect(JSON.parse(res.text)).toEqual({ id: 1, name: 'test' });
  }));
});
