/* @flow */
import express from 'express';
import { map } from 'lodash';

type RestAdapterConfig = {
  path: string, 
  getQuery: (request: express.Request) => string,
  transformResponse: (response: Object) => Object,
};

export type { RestAdapterConfig };

export const createAdapter = (configs: Array<RestAdapterConfig>) => {
  const app = express();

  map(configs, config => {
    app.get(config.path, (req, res, next) => {
      const query = config.getQuery(req);
      req.url = '/graphql';
      req.method = 'POST';
      req.body = { query };

      // Replace response writer with writer that transforms to a REST compatible response
      const write = res.write;
      res.write = function transformedWrite(string) {
        const writeError = err => {
          const [status, message] = err.message.split(' - ');
          res.status(status);
          write.call(this, message);
        };

        const messageJSON = JSON.parse(string);
        if (messageJSON.errors) {
          writeError(messageJSON.errors[0]);
        } else {
          try {
            const transformedJSON = config.transformResponse(messageJSON);
            write.call(this, JSON.stringify(transformedJSON));
          } catch (err) {
            writeError(err);
          }
        }
      };

      next();
    });
  });

  return app;
};
