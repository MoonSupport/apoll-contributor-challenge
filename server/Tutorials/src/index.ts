import { ApolloServer } from 'apollo-server'
import typeDefs from './schema'
import { createStore } from './utils'
import resolvers from './resolvers'

import LaunchAPI from './datasources/launch'
import UserAPI from './datasources/user'

import isEmail from 'isemail'

const store = createStore() // Model

const server = new ApolloServer({
  context: async ({ req }) => {
    const auth = (req.headers && req.headers.authorization) || ''
    const email = Buffer.from(auth, 'base64').toString('ascii')
    if (!isEmail.validate(email)) return { user: null }
    const users = await store.users.findOrCreate({ where: { email } })
    const user: any = (users && users[0]) || null

    return { user: { ...user.dataValues } }
  }, //컨텍스트에는 권한을 부여했다.

  typeDefs,
  resolvers,
  dataSources: () => ({
    launchAPI: new LaunchAPI(),
    userAPI: new UserAPI({ store }),
  }),
})

server.listen(4048).then(({ url }: any) => {
  console.log(`🚀 Server ready at ${url}`)
})
