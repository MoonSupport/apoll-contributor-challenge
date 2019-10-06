import { ApolloServer } from 'apollo-server'
import typeDefs from './schema'
import { createStore } from './utils'

import LaunchAPI from './datasources/launch'
import UserAPI from './datasources/user'

const store = createStore()

const server = new ApolloServer({
  typeDefs,
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store }),
  }),
})

server.listen().then(({ url }: any) => {
  console.log(`🚀 Server ready at ${url}`)
})
