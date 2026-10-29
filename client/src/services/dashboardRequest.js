export function createDashboardRequest(fetchDashboard) {
  let pending
  return function requestDashboard() {
    if (!pending) {
      pending = Promise.resolve()
        .then(fetchDashboard)
        .finally(() => {
          pending = null
        })
    }
    return pending
  }
}
