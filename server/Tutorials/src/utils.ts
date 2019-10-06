import Sequelize from 'sequelize'

export const someThing = ({
  after: cursor,
  pageSize = 20,
  results,
  // can pass in a function to calculate an item's cursor
  getCursor = () => null,
}: any) => {
  if (pageSize < 1) return []

  if (!cursor) return results.slice(0, pageSize)
  const cursorIndex = results.findIndex((item: any) => {
    // if an item has a `cursor` on it, use that, otherwise try to generate one
    let itemCursor = item.cursor ? item.cursor : getCursor(item)

    // if there's still not a cursor, return false by default
    return itemCursor ? cursor === itemCursor : false
  })

  return cursorIndex >= 0
    ? cursorIndex === results.length - 1 // don't let us overflow
      ? []
      : results.slice(cursorIndex + 1, Math.min(results.length, cursorIndex + 1 + pageSize))
    : results.slice(0, pageSize)
}

export const createStore = () => {
  const Op = Sequelize.Op
  const operatorsAliases = {
    $in: Op.in,
  }

  const db = new Sequelize('database', 'username', 'password', {
    dialect: 'sqlite',
    storage: './store.sqlite',
    operatorsAliases,
    logging: false,
  })

  const users = db.define('user', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
    email: Sequelize.STRING,
    token: Sequelize.STRING,
  })

  const trips = db.define('trip', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
    launchId: Sequelize.INTEGER,
    userId: Sequelize.INTEGER,
  })

  return { users, trips }
}
