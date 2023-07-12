export default function ({ store, route, redirect, $hasPermission, error }) {
  if (!$hasPermission(route.name)) {
    if (route.matched.length > 1) {
      if (!$hasPermission(route.matched[0].name)) {
        error({ statusCode: 403, message: 'Forbidden 1' })
      }
    } else {
      error({ statusCode: 403, message: 'Forbidden 2' })
    }
  } else if (route.matched.length > 1) {
    if (!$hasPermission(route.matched[0].name)) {
      error({ statusCode: 403, message: 'Forbidden 3' })
    }
  }
}
