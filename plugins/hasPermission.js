
export default ({ store }, inject) => {
  inject('hasPermission', (key, type = 'read') => {
    const permissions = store.state.auth.permissions
    if (permissions?.[key]) {
      return permissions[key][type]
    }

    return false
  })
}
