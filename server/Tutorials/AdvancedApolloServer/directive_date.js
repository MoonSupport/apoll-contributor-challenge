const { ApolloServer, gql, SchemaDirectiveVisitor } = require('apollo-server')
const formatDate = require('dateformat')
const { defaultFieldResolver, GraphQLString } = require('graphql')

const typeDefs = gql`
  directive @date(defaultFormat: String = "mmmm d, yyyy") on FIELD_DEFINITION

  scalar Date

  type Query {
    today: Date @date
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

    field.resolve = async function(source, { format, ...otherArgs }, context, info) {
      const date = await resolve.call(this, source, otherArgs, context, info)
      // If a format argument was not provided, default to the optional
      // defaultFormat argument taken by the @date directive:
      return formatDate(date, format || defaultFormat)
    }

    field.type = GraphQLString
  }
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
