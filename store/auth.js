import Cookie from 'cookie'
import Cookies from 'js-cookie'
// import jwtDecode from 'jwt-decode'

export const state = () => ({
  token: null,
  authUser: null,
  permissions: null,
  branches: null,
  branchSelected: null,
  branchNameSelected: null,
  status: null,
  errors: null
})

export const mutations = {
  setAuthUser (state, authUser) {
    state.authUser = authUser
  },

  setPermissions (state, permissions) {
    state.permissions = permissions
  },

  setBranches (state, branches) {
    state.branches = branches
  },

  setBranchSelected (state, branchId) {
    state.branchSelected = branchId
  },

  setBranchNameSelected (state, branchName) {
    state.branchNameSelected = branchName
  },

  setToken (state, token) {
    state.token = token
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
   * Made authorization on the system
   *
   * @param commit
   * @param dispatch
   * @param form
   * @param typeUrl
   * @returns {Promise<void>}
   */
  async login ({ commit, dispatch }, { form, typeUrl }) {
    try {
      commit('setStatus', null)
      commit('setErrors', null)

      const response = await this.$axios.$post(`auth/${typeUrl}`, form)
      if (response.token) {
        dispatch('setTokenDispatch', response.token)
        commit('setStatus', true)
        commit('setErrors', null)
        await dispatch('getUser')
      }
    } catch (e) {
      commit('setStatus', false)
      commit('setErrors', e.response.data.message)
    }
  },
  restore ({ commit, dispatch }, form) {
    try {
      commit('setStatus', null)
      commit('setErrors', null)

      return this.$authService.forgotPassword(form)
    } catch (e) {
      commit('setStatus', false)
      commit('setErrors', e.response.data.message)
    }
  },
  resetPassword ({ commit, dispatch }, form) {
    try {
      commit('setStatus', null)
      commit('setErrors', null)

      return this.$authService.resetPassword(form)
    } catch (e) {
      commit('setStatus', false)
      commit('setErrors', e.response.data.message)
    }
  },

  /**
   * Logout from system and delete token from cookies
   *
   * @param commit
   * @returns {Promise<void>}
   */
  async logout ({ commit }) {
    try {
      const response = await this.$authService.logout()
      if (!response) {
        return
      }

      await this.$axios.setToken(false)
      commit('setToken', null)
      commit('setAuthUser', null)
      Cookies.remove('token')
    } catch (e) {
      this.$helper.snackbar(e, 'logout')
    }
  },

  /**
   * Getting user by token
   *
   * @param commit
   * @param state
   * @returns {Promise<void>}
   */
  async getUser ({ commit, state }) {
    try {
      const authUser = await this.$systemUsersService.viewOne()
      commit('setAuthUser', authUser)
      commit('setPermissions', authUser.permissions)
      commit('setBranches', authUser.branches)
      commit('setBranchSelected', authUser.branches && authUser.branches.length && authUser.branches[0].id)
      commit('setBranchNameSelected', authUser.branches && authUser.branches.length && authUser.branches[0].name)
    } catch (e) {
      console.log(e.response, 'getUser')
      // if(e.response.status === 401) {
      //   await this.$axios.setToken(false)
      //   commit('clearToken')
      //   Cookies.remove('token')
      //
      //   this.$router.push({ name: 'login' })
      //   commit('setAuthUser', null)
      // }
    }
  },

  /**
   * Save token on cookies
   *
   * @param commit
   * @param token
   */
  setTokenDispatch ({ commit }, token) {
    // await this.$axios.setToken(token, 'Bearer')
    commit('setToken', token)
    Cookies.set('token', token)
  },

  /**
   * Getting token from cookies
   *
   * @param dispatch
   */
  autoLogin ({ dispatch }) {
    const cookieStr = process.browser ? document.cookie : this.app.context.req.headers.cookie
    const cookies = Cookie.parse(cookieStr || '') || {}
    const token = cookies.token

    // const validToken = isValidToken(token)

    dispatch('setTokenDispatch', token)
  }
}

export const getters = {
  isAuth: state => !!state.authUser,

  customer: state => state.authUser ? state.authUser.customer : {},

  branchSelected: state => state.branchSelected ? state.branchSelected : null,

  branchNameSelected: state => state.branchNameSelected ? state.branchNameSelected : null
}

// function isValidToken (token) {
//   if (!token) {
//     return false
//   }
//
//   const jwtData = jwtDecode(token) || {}
//   const expires = jwtData.iat || 0
//
//   return new Date().getTime() < expires
// }
