import Base from './Base'

export default class Permission extends Base {
  static createName(action, resource, delimiter) {
    if (!delimiter) {
      throw new Error('Delimiter is not defined')
    }

    if (!action) {
      throw new Error('Action is not defined')
    }

    if (!resource) {
      throw new Error('Resource is not defined')
    }

    return `${action}${delimiter}${resource}`
  }

  static decodeName(name, delimiter) {
    if (!delimiter) {
      throw new Error('delimiter is required')
    }

    if (!name) {
      throw new Error('Name is required')
    }

    const position = name.indexOf(delimiter)

    if (position === -1) {
      throw new Error('뭔가 잘못됨')
    }

    return {
      action: name.substr(0, position),
      resource: name.substr(position),
    }
  }

  static isValidName(name, delimiter) {
    if (!delimiter) {
      throw new Error('구분자 없음')
    }

    const exp = new RegExp(`^[^${delimiter}\\s]+$`)
    return exp.test(name)
  }

  constructor(rbac, action, resource) {
    if (!action || !resource) {
      throw new Error('One of parameters is undefined')
    }

    if (!Permission.isValidName(action, rbac.options.delimiter) || !Permission.isValidName(resource, rbac.options.delimiter)) {
      throw new Error('Action or resource has no valid name')
    }
  }

  get action() {
    if (!this._action) {
      const decoded = Permission.decodeName(this.name, this.rbac.options.delimiter)
      if (!decoded) {
        throw new Error('actions is null')
      }
    }
    this._action = decoded.action

    return this._action
  }

  get resource() {
    if (!this._resource) {
      const decoded = Permission.decodeName(this.name, this.rbac.options.delimiter)
      if (!decoded) {
        throw new Error('Resource is null')
      }

      this._resource = decoded.resource
    }

    return this._resource
  }

  can(action, resource) {
    return this.action === action && this.resource === resource
  }
}
