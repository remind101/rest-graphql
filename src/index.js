/* @flow */
import express from 'express';

type RestAdapterConfigResponse = {
  body: Object,
  status: number,
};

export type Config = {
  isError: (response: Object) => boolean,
  transformError: (response: Object) => RestAdapterConfigResponse,
};

export type EndpointConfig = {
  path: string,
  getQuery(req: express.Request): string,
  transformSuccess: (response: Object) => RestAdapterConfigResponse,
};

export default class RestAdapter {
  config: Config
  app: *

  constructor(config: Config) {
    this.config = config;
    this.app = express();
  }

  addEndpoint(endpointConfig: EndpointConfig) {
    this.app.get(endpointConfig.path, (req: express.Request, res: express.Response, next: Function) => {
      req.url    = '/graphql';
      req.method = 'POST';
      req.body   = { query: endpointConfig.getQuery(req) };

      const config = this.config;
      const write  = res.write;

      res.write = function(grapqhRawResponse) {
        const grapqhResponse = JSON.parse(grapqhRawResponse);
        const isError = config.isError(grapqhResponse);

        const response = isError
          ? config.transformError(grapqhResponse)
          : endpointConfig.transformSuccess(grapqhResponse);

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
