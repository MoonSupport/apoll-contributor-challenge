const { ApolloServer, gql, SchemaDirectiveVisitor } = require('apollo-server')

class DeprecatedDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    field.isDeprecated = true
    field.deprecationReason = this.args.reason
  }

  visitEnumValue(value) {
    value.isDeprecated = true
    value.deprecationReason = this.args.reason
  }
}

const typeDefs = gql`
  type ExampleType {
    newField: String
    oldField: String @deprecated(reason: "Use \`newField\`.")
  }

  type Query {
    example: ExampleType
  }
`

const resolvers = {
  ExampleType: {
    newField: () => 'newField',
    oldField: () => 'oldField',
  },
  Query: {
    example: (_, args) => args,
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
  schemaDirectives: {
    deprecated: DeprecatedDirective,
  },
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
