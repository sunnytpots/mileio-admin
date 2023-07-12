export default function ({ store, route, redirect }) {
  if (!store.state.auth.token) {
    if (route.name !== 'login' && route.name !== 'forgot-password' && route.name !== 'confirm-password') {
      redirect('/login?message=login')
    }
  } else if (route.name === 'login') {
    redirect('/coordinator')
  }
}
