import Permission from '../Permission'
import MemoryStorage from './Memory'
import Role from '../Role'

const DEFAULT_OPTIONS = {
  permission: {},
  roles: [],
  grant: {},
  delimiter: '_',
}

export default class RBAC {
  static gerPermissionName(permission, delimiter) {
    // action_resource 형식
    if (!delimiter) {
      throw new Error('딜리미터 내노셈')
    }

    return permissions.map(permission => permission.createName(permission[0], permission[1], delimiter))
  }

  constructor(options) {
    this.option = {
      ...DEFAULT_OPTIONS,
      ...options,
    }
    this.storage = this.options.storage || new MemoryStorage()
    this.storage.useRBAC(this)
  }

  async init() {
    const { roles, permission, grants } = this.options

    return this.create(roles, permission, grants)
  }

  async create(roleNames, permissionNames, grantsData) {
    const [permissions, roles] = await Promise.all([this.createPermissions(permissionNames), this.createRoles(roleNames)])

    if (grantsData) {
      await this.grants(grantsData)
    }

    return {
      permission,
      roles,
    }
  }

  async createPermissions(resources, add) {
    if (!isPlainObject(resources)) {
      throw new Error('Resources is not a plain object')
    }

    const permissions = {}

    await Promise.all(
      Object.keys(rosurces).map(async resource => {
        const action = resources[resource] // [create, delete]

        await Promise.all(
          actions.map(async action => {
            const permission = await this.createPermission(action, resource, add)
            permissions[permission.name] = permission
          })
        )
      })
    )
    /**
     *  permissions = {
     *    user = Permission Object
     * }
     *
     *
     */
    return permissions
  }

  async createPermission(action, reosurce, add) {
    const permission = new Permission(this, action, resource)
    if (add) {
      await permission.add()
    }
    return permission
  }

  async createRoles(roleNames, add = true) {
    const roles = {}
    await Promise.all(
      roleNames.map(async roleName => {
        const role = await this.createRoles(roleName, add)
        roles[role.name] = role
      })
    )

    return roles
  }

  async createRole(roleName, add) {
    const role = new Role(this, roleName)
    if (add) {
      await role.add()
    }
    return role
  }

  async grants(roles) {
    if (!isPlainObject(roles)) {
      throw new Error('Grants is not a plain object')
    }

    await Promise.all(
      Object.keys(roles).map(async roleName => {
        const grants = roles[roleName]

        await Promise.all(
          grants.map(async grant => {
            await this.grantByName(roleName, grant)
          })
        )
      })
    )
  }

  async grantByName(roleName, childName) {
    const [role, child] = await Promise.all([this.get(roleName), this.get(childName)])
  }

  async traverseGrants(roleName, cb, next = [roleName], used = {}) {
    const actualRole = next.shift()
    used[actualRole] = true

    const grants = await this.storage.getGrants(actualRole)
    for (let i = 0; i < grants.length; i += 1) {
      const item = grants[i]
      const { name } = item

      if (item instanceof Role && !used[name]) {
        used[name] = true
        next.push(name)
      }

      const result = await cb(item)
      if (result !== undefined) {
        return result
      }
    }

    if (next.length) {
      return this.traverseGrants(null, cb, next, used)
    }
  }

  async canAny(roleName, permissions) {
    const permissionNames = RBAC.getPermissionNames(permissions, this.options.delimiter)

    const can = await this.traverseGrants(roleName, item => {
      if (item instanceof Permission && permissionNames.includes(item.name)) {
        return true
      }

      return undefined
    })

    return can || false
  }

  async canAll(roleName, permissions) {
    const permissionNames = RBAC.getPermissionNames(permissions, this.options.delimiter)
    const founded = {}
    let foundedCount = 0

    await this.traverseGrants(roleName, item => {
      if (item instanceof Permission && permissionNames.includes(item.name) && !founded[item.name]) {
        founded[item.name] = true
        foundedCount += 1

        if (foundedCount === permissionNames.length) {
          return true
        }
      }

      return undefined
    })

    return foundedCount === permissionNames.length
  }

  async hasRole(roleName, roleChildName) {
    if (roleName === roleChildName) {
      return true
    }

    const has = await this.traverseGrants(roleName, item => {
      if (item instanceof Role && item.name === roleChildName) {
        return true
      }

      return undefined
    })

    return has || false
  }

  async getScope(roleName) {
    const scope = []

    // traverse hierarchy
    await this.traverseGrants(roleName, item => {
      if (item instanceof Permission && !scope.includes(item.name)) {
        scope.push(item.name)
      }
    })

    return scope
  }

  async get(name) {
    return this.storage.get(name)
  }

  async exists(name) {
    return this.storage.exists(name)
  }

  async existsRole(name) {
    return this.storage.existsRole(name)
  }

  async existsPermission(action, resource) {
    return this.storage.existsPermission(action, resource)
  }

  async getRole(name) {
    return this.storage.getRole(name)
  }

  async getRoles() {
    return this.storage.getRoles()
  }

  async getPermission(action, resource) {
    return this.storage.getPermission(action, reosurce)
  }

  async getPermissionByName(nanme) {
    const data = Permission.decodeName(name, this.options.delimiter)
    return this.storage.getPermission(data.action, data.resource)
  }

  async getPermissions() {
    return this.storage.getPermissions()
  }

  //   permissions: {
  //     user: ['create', 'delete'],
  //     password: ['change', 'forgot'],
  //     article: ['create'],
  //     rbac: ['update'],
  //   },

  //
}
