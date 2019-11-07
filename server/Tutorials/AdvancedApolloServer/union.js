const { gql, ApolloServer } = require('apollo-server')

const typeDefs = gql`
  union Result = Book | Author

  type Book {
    title: String
    sale: Boolean
  }

  type Author {
    name: String
    age: Int
  }

  type Query {
    search: [Result]
  }
`

const resolvers = {
  Result: {
    __resolveType(obj, context, info) {
      if (obj.name) {
        return 'Author'
      }

      if (obj.title) {
        return 'Book'
      }
      return null
    },
  },
  Query: {
    search: () => [{ name: 'Yes I am Author', age: 22 }, { title: 'Yes My Book', sale: false }],
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
