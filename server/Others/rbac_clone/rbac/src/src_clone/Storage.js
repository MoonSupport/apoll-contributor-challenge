export default class Storage {
  useRBAC(rbac) {
    if (this.rbac) {
      throw new Error('이미 있슴')
    }
    this.rbac = rbac
  }

  async get(name) {
    throw new Error('get이 구현되지 않았습니다??????')
  }

  async exists(name) {
    const item = await this.get(name)
    return !!item
  }

  async existsRole(name) {
    const role = await this.getRole(name)
    return !!role
  }

  async getRole(name) {
    const role = await this.get(name)
    if (role && role instanceof Role) {
      return role
    }

    return undefined
  }

  async getPermission(action, resource) {
    const name = Permission.createName(action, resource, this.rbac.options.delimiter)
    const item = await this.get(name)
    if (item && item instanceof Permission) {
      return item
    }

    return undefined
  }

  async exists(name) {
    const item = await this.get(name)
    return !!item
  }

  async existsRole(name) {
    const role = await this.getRole(name)
    return !!role
  }

  async existsPermission(action, resource) {
    const permission = await this.getPermission(action, resource)
    return !!permission
  }
}
