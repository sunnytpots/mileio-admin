export const state = () => ({
  polygons: [],
  polygon: {},
  status: null,
  errors: null
})

export const mutations = {
  setPolygons (state, polygons) {
    state.polygons = polygons
  },

  setPolygon (state, polygon) {
    state.polygon = polygon
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
   * Getting all polygons
   *
   * @param commit
   * @returns {Promise<void>}
   */
  async get ({ commit }) {
    try {
      const polygons = await this.$polygonsService.list()
      commit('setPolygons', polygons)
    } catch (e) {
      commit('setStatus', false)
    }
  },

  /**
   * Getting one polygon by uuid
   *
   * @param commit
   * @param uuid
   * @returns {Promise<void>}
   */
  async show ({ commit }, uuid) {
    try {
      const polygon = await this.$polygonsService.viewOne(uuid)
      commit('setPolygon', polygon)
    } catch (e) {
      commit('setStatus', false)
      commit('setErrors', e)
    }
  },

  /**
   * Create or Update polygon
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
      const url = form.uuid ? `polygons/update/${form.uuid}` : 'polygons/add'
      const response = await this.$axios.$post(url, form)
      if (response.status) {
        form.uuid ? await dispatch('show', form.uuid) : await dispatch('get')

        commit('setStatus', response.status)
      }
    } catch (e) {
      commit('setStatus', false)
      commit('setErrors', e.response.data.message)
      alert(e.response.data.message)
    }
  }
}
