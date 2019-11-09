const { ApolloServer, gql, SchemaDirectiveVisitor } = require('apollo-server')
const formatDate = require('dateformat')
const { defaultFieldResolver, GraphQLString } = require('graphql')

const typeDefs = gql`
  directive @date(defaultFormat: String = "mmmm d, yyyy") on FIELD_DEFINITION

  scalar Date

  type Query {
    today: Date @date @cacheControl(maxAge: 1, scope: PUBLIC)
  }
`

class FormattableDateDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field
    const { defaultFormat } = this.args

    field.args.push({
      name: 'format',
      type: GraphQLString,
    })
    console.log(field)

    field.resolve = async function(source, { format, ...otherArgs }, context, info) {
      const date = await resolve.call(this, source, otherArgs, context, info)
      console.log(date)
      // If a format argument was not provided, default to the optional
      // defaultFormat argument taken by the @date directive:
      return formatDate(date, format || defaultFormat)
    }

    field.type = GraphQLString
  }
}

const resolvers = {
  Query: {
    today: () => new Date(),
  },
}

const server = new ApolloServer({
  typeDefs,
  schemaDirectives: {
    date: FormattableDateDirective,
  },
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
