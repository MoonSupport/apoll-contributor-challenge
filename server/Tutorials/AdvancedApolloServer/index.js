const { GraphQLScalarType } = require('graphql')
const { Kind } = require('graphql/language')
const { gql, ApolloServer } = require('apollo-server')

const typeDefs = gql`
  scalar Odd

  enum AllowedColor {
    RED
    GREEN
    BLUE
  }

  type MyType {
    oddValue: Odd
  }

  type Query {
    myType: MyType
    favoriteColor: AllowedColor # As a return value
    avatar(borderColor: AllowedColor): String # As an argument
  }
`
var cursor = 1

function oddValue(value) {
  console.log(value)
  return value % 2 === 1 ? value : null
}

const resolvers = {
  Odd: new GraphQLScalarType({
    name: 'Odd',
    description: 'Odd custom scalar type',
    parseValue: oddValue,
    serialize: oddValue,
    parseLiteral(ast) {
      if (ast.kind === Kind.INT) {
        return oddValue(parseInt(ast.value, 10))
      }
      return null
    },
  }),

  AllowedColor: {
    RED: '#f00',
    GREEN: '#0f0',
    BLUE: '#00f',
  },

  Query: {
    myType: () => {
      return {
        oddValue: 1,
      }
    },
    favoriteColor: () => '#f00',
    avatar: (parent, args) => {
      if (args.borderColor == 'RED') {
        return 'HOT'
      }
      if (args.borderColor == 'GREEN') {
        return 'RELAX'
      }
      if (args.borderColor == 'BLUE') {
        return 'COOL'
      }
      return 'NO!'
    },
  },
}

const server = new ApolloServer({ typeDefs, resolvers })

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
