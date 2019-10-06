import { ApolloServer } from 'apollo-server'
import typeDefs from './schema'

const server = new ApolloServer({
  typeDefs,
})

server.listen().then(({ url }: any) => {
  console.log(`🚀 Server ready at ${url}`)
})
