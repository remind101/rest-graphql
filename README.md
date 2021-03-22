# DEPRECATED

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

Let's say you're building out a new profile page and have defined a GraphQL schema for it.  
You can fetch the necessary data via:

```graphql
query PresidentQuery {
  presidents {
    name
  }
}
```

Create a new RestAdapter and add the middleware to your express server:

```js
import RestAdapter from 'rest-graphql';

/* Build a new adapter
 *
 * isError        - Detect is the graphql query has failed.
 * transformError - Transform the failed query response into a RestAdapterResponse.
 *
 */
const adapter = new RestAdapter({
  isError:         (response) => !!response.errors,
  transformError:  (response) => response.errors[0].__http_secret__,
});

/* Add endpoints to the adapter:
 *
 * path             - The REST endpoint.
 * getQuery         - Function returning a Graphql query as a String.
 * transformSuccess - Transform the successful query response into a RestAdapterResponse.
 */
adapter.addEndpoint({
  path: '/presidents',
  getQuery: (request) => PRESIDENTS_QUERY,
  transformSuccess: response => ({ status: 200, body: response.presidents }),
});

const graphql = express();

graphql.use(adapter.app);
graphql.use('/graphql', graphqlExpress(/* ... */));
```

Which would result in:

**1. HTTP Request:**
```
GET https://api.test.com/presidents
```

**2. Graphql Query:**
```
query PresidentQuery {
  presidents {
    name
  }
}
```

**3. Graphql Response:**
```
{
  presidents: [
    { name: "Jacques Chirac" },
    { name: "George Washington" }
  ]
}
```

**4. HTTP Response:**
```
["Jacques Chirac", "George Washington"]
```

## Error Handling

To transform Graphql query errors into the REST responses we recommend using something similar to
[apollo-server](https://github.com/apollographql/apollo-server#options) formatError options. In the above example we format the HTTP errors like the following:

```json
{
  "presidents": null,
  "errors": [
    {
      "message": "Internal server error",
      "__http_secret__": {
        "status": 500,
        "body": {
          "message": "Internal server error"
        }
      },
    },
  ]
}
