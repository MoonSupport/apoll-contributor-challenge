const { ApolloServer, gql, SchemaDirectiveVisitor } = require('apollo-server')

const typeDefs = gql`
  directive @rest(url: String) on FIELD_DEFINITION

  type Person {
    name: String
  }

  type Query {
    people: [Person] @rest(url: "/api/v1/people")
  }
`

class RestDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { url } = this.args
    console.log(url)
    field.resolve = () => fetch(url)
  }
}

const server = new ApolloServer({
  typeDefs,
  schemaDirectives: {
    rest: RestDirective,
  },
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
