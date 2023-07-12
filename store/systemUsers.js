export const state = () => ({
  systemUsers: [],
  status: null,
  errors: null
})

export const mutations = {
  setUsers (state, users) {
    state.systemUsers = users
  },

  setStatus (state, status) {
    state.status = status
  },

  setErrors (state, errors) {
    state.errors = errors
  }
}

export const actions = {
  /**
   * Getting all users
   *
   * @param commit
   * @param rootGetters
   * @returns {Promise<void>}
   */
  async get ({ commit, rootGetters }, form) {
    try {
      const users = await this.$systemUsersService.viewSystemUsers(form)
      commit('setUsers', users)
    } catch (e) {
      commit('setStatus', false)
      commit('setErrors', e.response.data.message)
    }
  },

  /**
   * Create or Update user
   *
   * @param commit
   * @param dispatch
   * @param form
   * @returns {Promise<void>}
   */
  async create_Or_Update ({ commit, dispatch }, form) {
    try {
      commit('setErrors', null)
      console.log('form.id', form.id)
      const url = form.id ? `system-users/update/${form.id}` : 'system-users/add'
      const response = await this.$axios.$post(url, form)
      if (response.status) {
        commit('setStatus', response.status)
        await dispatch('get')
      }
    } catch (e) {
      const errorMsg = e?.response?.data?.results?.description || 'שגיאה'
      console.log('create_Or_Update error', errorMsg)
      commit('setStatus', false)
      commit('setErrors', e.response)
    }
  }
}
