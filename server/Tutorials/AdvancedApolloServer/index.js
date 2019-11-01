const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')
const { gql, ApolloServer } = require('apollo-server')

const typeDefs = gql`
  scalar Date

  type MyType {
    created: Date
  }

  type Query {
    myType: MyType
  }

  type Mutation {
    update(value: Date): MyType
  }
`

var date = new Date()

const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue(value) {
      console.log('parseValue')
      return new Date(value) // value from the client
    },
    serialize(value) {
      console.log('serialize')
      return value.getTime() // value sent to the client
    },
    parseLiteral(ast) {
      console.log('parseLiteral : ', ast)

      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10) // ast value is always in string format
      }
      return null
    },
  }),

  MyType: {
    created: value => value,
  },

  Query: {
    myType: () => date,
  },
  Mutation: {
    update: (_, { value }) => {
      date = new Date(value)
      return date
    },
  },
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
