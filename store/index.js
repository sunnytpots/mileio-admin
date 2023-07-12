export const state = () => ({
  status: null,
  drawerUi: false,
  errors: {},

  /**
   * @param value<boolean>
   * @param message<String>
   * @param error<boolean>
   * @param success<boolean>
   */
  snackbar: {
    value: false,
    message: '',
    error: false,
    success: false,
    timeout: null
  }
})

export const mutations = {
  setErrors (state, errors) {
    state.errors = errors
  },

  setDrawerUi (state, drawerUi) {
    state.drawerUi = drawerUi
  },

  setSnackbar (state, { value, message, error, success }) {
    state.snackbar.value = value
    state.snackbar.message = message
    state.snackbar.error = error
    state.snackbar.success = success
  },

  setStatus (state, status) {
    state.status = status
  }
}

export const actions = {
  /**
   * Nuxt will call it with the context (only from the server-side)
   *
   * @param dispatch
   * @param state
   * @returns {Promise<void>}
   */
  async nuxtServerInit ({ dispatch, state }) {
    dispatch('auth/autoLogin')
    state.auth.token && await dispatch('auth/getUser')
  }
}
