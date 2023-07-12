export const state = () => ({
  statusOriginalPricingChanged: []
})

export const mutations = {
  setStatusOriginalPricingChanged (state, deliveryTypesPricingId) {
    state.statusOriginalPricingChanged.push(deliveryTypesPricingId)
  },
  spliceFromStatusOriginalPricingChanged (state, deliveryTypesPricingId) {
    const i = state.statusOriginalPricingChanged.indexOf(deliveryTypesPricingId)
    state.statusOriginalPricingChanged.splice(i, 1)
  }
}

export const actions = {
  /**
   * Made authorization on the system
   *
   * @param commit
   * @param dispatch
   * @param form
   * @returns {Promise<void>}
   */
  addToStatusOriginalPricingChanged ({ commit, state }, id) {
    try {
      commit('setStatusOriginalPricingChanged', id)
    } catch (e) {
      console.log('Catch error', e)
    }
  },

  removeFromStatusOriginalPricingChanged ({ commit, state }, id) {
    try {
      commit('spliceFromStatusOriginalPricingChanged', id)
    } catch (e) {
      console.log('Catch error', e)
    }
  }
}
