# rest-graphql
Middleware for Express to adapt REST requests to GraphQL queries

[![NPM](https://nodei.co/npm/rest-graphql.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/rest-graphql/)

## Motivation
- You've built a GraphQL server, and it's ready to use. 
- Not all your clients speak GraphQL. At the very least, legacy mobile clients can't make GraphQL requests. 
- You don't want to support both legacy and GraphQL client/server contracts simultaneously

`rest-graphql` provides middleware that lets you define mappers from REST requests to graphql queries that fetch the same data, letting you normalize all client queries into something your GraphQL server can handle.

## Quick Start
Install the package

`npm install --save rest-graphql`

Let's say you're building out a new profile page and have defined a GraphQL schema for it. You can fetch the necessary data via:
```
query ProfileQuery {
  user(id: 1) {
    profile_photo {
      url
    }
    first_name
    last_name
  }
}
```

Create a new config and add the middleware to your express server:
```
import { createAdapter } from 'rest-graphql';
import type { RestAdapterConfig } from 'rest-graphql'; // If you use flow

/**
 * This is the config that defines the mapping. It contains:
 *
 * path: string - the REST endpoint your client will hit. This follow expressjs route handling conventions
 * getQuery: (request) => string -  A mapping from the REST request to a GraphQL query
 * transformResponse: (response) => Object - Often the raw JSON from GraphQL doesn't make sense for the client, so perform any transform you want here
 */
const profileConfig: RestAdapterConfig = {
  path: '/profile/:id',
  getQuery: request => `
    user(id: ${request.params.id}) {
      profile_photo {
        url
      }
      first_name
      last_name
    }
  `,
  transformResponse: response => response.data.me,
}

const app = express();
app.use(createAdapter([profileConfig])); // The rest-graphql middleware. It takes an array of RestAdapterConfigs

// Any other middleware or route handlers to process graphql requests.
```

Which would result in:

**Request:**
```
GET https://api.test.com/profile/9
```

**Response:** 
```
{ profile_photo: { url: "someurl" }, first_name: "Gaurav", last_name: "Kulkarni"}
```
