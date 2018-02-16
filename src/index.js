/* @flow */
import express from 'express';

type RestAdapterResponse = {
  body: Object,
  status: number,
};

export type RestAdapterConfig = {
  isError: (response: Object) => boolean,
  transformError: (response: Object) => RestAdapterResponse,
};

export type RestAdapterEndpointConfig = {
  path: string,
  getQuery(req: express.Request): string,
  transformSuccess: (response: Object) => RestAdapterResponse,
};

export default class RestAdapter {
  config: RestAdapterConfig
  app: *

  constructor(config: RestAdapterConfig) {
    this.config = config;
    this.app = express();
  }

  addEndpoint(endpointConfig: RestAdapterEndpointConfig) {
    this.app.get(endpointConfig.path, (req: express.Request, res: express.Response, next: Function) => {
      req.url    = '/graphql';
      req.method = 'POST';
      req.body   = { query: endpointConfig.getQuery(req) };

      const config = this.config;
      const write  = res.write;

      res.write = function(graphqlRawResponse) {
        const graphqlResponse = JSON.parse(graphqlRawResponse);
        const isError = config.isError(graphqlResponse);

        const response = isError
          ? config.transformError(graphqlResponse)
          : endpointConfig.transformSuccess(graphqlResponse);

        if (response.body instanceof Object) {
          res.setHeader('Content-Type', 'application/json');
        } else {
          res.setHeader('Content-Type', 'text/html');
        }

        const body = response.body instanceof Object ? JSON.stringify(response.body) : response.body;

        res.status(response.status);
        write.call(this, body);
      };

      next();
    });
  }
}
