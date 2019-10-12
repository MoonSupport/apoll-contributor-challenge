import RBAC from '../RBAC'

export default class Base {
  constructor(rbac, name) {
    if (!rbac || !name) {
      throw new Error('인자 필요.')
    }
    this.name = name
    this.rbac = rbac
  }

  async add() {
    const { rbac } = this
    return rbac.add(this)
  }

  async remove() {
    const { rbac } = this
    return rbac.remove(this)
  }
}
