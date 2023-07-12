
export default ({ store }, inject) => {
  inject('helper', {
    snackbar: (e, funcName) => {
      console.error(`${funcName} error `, e)
      const errorMsg = e.response?.data?.message
      store.commit('setSnackbar', { value: true, message: errorMsg, error: true })
    }
  })
}
