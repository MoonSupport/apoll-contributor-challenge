import { ApolloServer } from 'apollo-server'

const server = new ApolloServer({})

server.listen().then(({ url }: any) => {
  console.log(`🚀 Server ready at ${url}`)
})
