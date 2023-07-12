export const state = () => ({
  users: [],
  status: null,
  errors: null
})

export const mutations = {
  setUsers (state, users) {
    state.users = users
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
  async get ({ commit, rootGetters }) {
    try {
      const users = await this.$userService.viewUsers({ customer_uid: rootGetters['auth/customer'].uuid })
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
  async createOrUpdate ({ commit, dispatch }, form) {
    commit('setStatus', null)
    commit('setErrors', null)

    try {
      const url = form.id ? `user/update/${form.id}` : 'user/add'
      const response = await this.$axios.$post(url, form)
      if (response.status) {
        commit('setStatus', response.status)
        await dispatch('get')
      }
    } catch (e) {
      console.log(e.response)
      commit('setStatus', false)
      commit('setErrors', e.response)
    }
  }
}
