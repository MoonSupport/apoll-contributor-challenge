const { gql, ApolloServer } = require('apollo-server')

const typeDefs = gql`
  union Result = Book | Author

  interface BookInterface {
    title: String
    author: String
  }

  type Book {
    title: String
    sale: Boolean
  }

  type TextBook implements BookInterface {
    title: String
    author: String
    classes: String
  }

  type ColoringBook implements BookInterface {
    title: String
    author: String
    colors: String
  }

  type Author {
    name: String
    age: Int
  }

  type Query {
    search: [Result]
    schoolBooks: [BookInterface]
  }
`

const resolvers = {
  BookInterface: {
    __resolveType(book, context, info) {
      if (book.classes) {
        return 'TextBook'
      }

      if (book.colors) {
        return 'ColoringBook'
      }

      return null
    },
  },
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
    schoolBooks: () => [{ title: 'colorTitle', author: 'colorAuthor', colors: 'RED' }],
  },
}

const server = new ApolloServer({
  typeDefs,
  resolvers,
})

server.listen().then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`)
})
