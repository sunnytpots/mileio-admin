export default (context, inject) => {
  inject('deliveryService', {
    addByCsv: data => context.$axios.$post('delivery/add-by-csv', data),
    returnToStorage: data => context.$axios.$post('delivery/return-to-storage', data),
    updateDeliveryStatus: data => context.$axios.$post('delivery/update-delivery-status', data),
    updateDeliveryToPreviousStatus: data => context.$axios.$post('delivery/update-delivery-to-previous-status', data),
    viewDeliveries: data => context.$axios.$post('delivery/admin-deliveries-view', data),
    viewDeliveriesCount: data => context.$axios.$post('delivery/admin-deliveries-view-count', data),
    viewSummaries: data => context.$axios.$post('delivery/admin-deliveries-summaries', data),
    associateToDriver: data => context.$axios.$post('delivery/associate-to-driver', data),
    cancelDrivers: data => context.$axios.$post('delivery/cancel-drivers', data),
    viewOne: data => context.$axios.$post('delivery/view-one', data),
    printed: data => context.$axios.$post('delivery/printed', data),
    timingAutoSorting: data => context.$axios.$post('delivery/timing-auto-sorting', data),
    saveDriverRoutesParts: data => context.$axios.$post('delivery/save-driver-routes-parts', data),
    approveRoutes: data => context.$axios.$post('delivery/approve-routes', data),
    cancelApproveRoutes: data => context.$axios.$post('delivery/cancel-approve-routes', data),
    viewByDriverId: data => context.$axios.$post('delivery/view-by-driver-id', data),
    update: (uid, data, params) => context.$axios.$post(`delivery/update/${uid}`, data, { params }),
    retrieveDeliveries: data => context.$axios.$post('delivery/retrieve-deliveries', data),
    deleteDeliveries: data => context.$axios.$post('delivery/delete-deliveries', data),
    getStatistics: data => context.$axios.$post('delivery/get-statistics', data),
    getDeployment: data => context.$axios.$post('delivery/get-deployment', data),
    getActivities: data => context.$axios.$post('delivery/get-activities', data),
    copyDelivery: deliveryId => context.$axios.$get(`delivery/copy-delivery/${deliveryId}`)
  })
  inject('driverService', {
    driverView: data => context.$axios.$post('driver/view', data),
    getSummary: data => context.$axios.$post('driver/get-summary', data),
    checkApprovalRoutes: data => context.$axios.$post('driver/check-approval-routes', data),
    getSummaries: data => context.$axios.$post('driver/get-summaries', data),
    changeStatus: data => context.$axios.$post('driver/change-status', data),
    deleteLogo: data => context.$axios.$post('driver/delete-logo', data),
    deleteDriver: driverId => context.$axios.$post(`driver/delete/${driverId}`),
    paymentList: data => context.$axios.$post('driver/payment-list', data)
  })
  inject('messagesByStatusesService', {
    emergencyTurnOff: () => context.$axios.$post('messages-by-statuses/emergency-turn-off'),
    viewMessagesHistory: data => context.$axios.$post('messages-by-statuses/view-messages-history', data),
    viewCustomerCustomMessages: data => context.$axios.$post('messages-by-statuses/view-customer-custom-messages', data),
    messagesByStatusesView: data => context.$axios.$post('messages-by-statuses/view', data),
    deleteCustomerCustomMessage: data => context.$axios.$post('messages-by-statuses/delete-customer-custom-message', data),
    deleteStatusMsg: data => context.$axios.$post('messages-by-statuses/delete-status-msg', data),
    addCustomerCustomMessage: data => context.$axios.$post('messages-by-statuses/add-customer-custom-message', data),
    addMessage: data => context.$axios.$post('messages-by-statuses/add', data),
    checkSms: data => context.$axios.$post('messages-by-statuses/check-sms', data),
    updateCustomerCustomMessage: data => context.$axios.$post('messages-by-statuses/update-customer-custom-message', data),
    updateMessage: data => context.$axios.$post('messages-by-statuses/update', data),
    sendMultipleSms: data => context.$axios.$post('messages-by-statuses/send-multiple-sms', data)
  })
  inject('distributionPointBagsService', {
    viewByBag: params => context.$axios.$get('distribution-point-bags/view-by-bag', { params }),
    addBag: data => context.$axios.$post('distribution-point-bags/add-bag', data),
    addPackageToBag: data => context.$axios.$post('distribution-point-bags/add-package-to-bag', data),
    checkUnblockedBag: data => context.$axios.$post('distribution-point-bags/check-unblocked-bag', data),
    removePackageFromBag: data => context.$axios.$post('distribution-point-bags/remove-package-from-bag', data),
    getSummaries: data => context.$axios.$post('distribution-point-bags/get-summaries', data),
    viewBags: data => context.$axios.$post('distribution-point-bags/view', data),
    associateToDriver: data => context.$axios.$post('distribution-point-bags/associate-to-driver', data),
    cancelOneDriver: data => context.$axios.$post('distribution-point-bags/cancel-driver', data),
    cancelMultipleBags: data => context.$axios.$post('distribution-point-bags/cancel-bags', data),
    viewOne: data => context.$axios.$post('distribution-point-bags/view-one', data),
    getBagList: data => context.$axios.$post('distribution-point-bags/get-bag-list', data),
    blockBag: data => context.$axios.$post('distribution-point-bags/block-bag', data)
  })
  inject('distributionDeliveriesPointsService', {
    getSummary: data => context.$axios.$post('distribution-deliveries-points/get-summary', data),
    viewTBoxes: data => context.$axios.$post('distribution-deliveries-points/view', data),
    getSummaries: data => context.$axios.$post('distribution-deliveries-points/get-summaries', data),
    updateStatus: data => context.$axios.$post('distribution-deliveries-points/update-status', data),
    paymentList: data => context.$axios.$post('distribution-deliveries-points/payment-list', data)
  })
  inject('distributionPointsService', {
    getDistributionPoints: () => context.$axios.$get('distribution-points'),
    postDistributionPoints: data => context.$axios.$post('distribution-points', data),
    deleteDistributionPoint: data => context.$axios.$post('distribution-points/delete', data),
    getUsers: uid => context.$axios.$get(`distribution-points/users/${uid}`),
    getCities: params => context.$axios.$get('distribution-points/cities', { params })
  })
  inject('authService', {
    checkAuthMobile: data => context.$axios.$post('auth/check-mobile', data),
    checkAuthOtpCode: data => context.$axios.$post('auth/check-otp-code', data),
    forgotPassword: data => context.$axios.$post('auth/forgot-password', data),
    resetPassword: data => context.$axios.$post('auth/reset-password', data),
    getPrintTypes: () => context.$axios.$get('auth/get-print-types'),
    releaseDriversApprovals: () => context.$axios.$post('auth/release-drivers-approvals'),
    logout: () => context.$axios.$post('auth/logout')
  })
  inject('pricingService', {
    findDeliveryTypePricing: params => context.$axios.$get('pricing/find-delivery-type-pricing', { params }),
    getPolygonPricing: () => context.$axios.$post('pricing/get-polygon-pricing'),
    deletePricing: id => context.$axios.$post(`pricing/delete/${id}`),
    deletePolygonPricingFromList: data => context.$axios.$post('pricing/delete-polygon-pricing-from-list', data)
  })
  inject('userService', {
    getTimingCommunicationPermission: () => context.$axios.$get('user/get-timing-communication-permission'),
    getSla: () => context.$axios.$get('user/get-sla'),
    viewUsers: data => context.$axios.$post('user/view', data)
  })
  inject('customersService', {
    findCustomers: data => context.$axios.$post('customers/find-customers', data),
    list: data => context.$axios.$post('customers/list', data),
    sendLoginSms: data => context.$axios.$post('customers/send-login-sms', data),
    viewCustomers: data => context.$axios.$post('customers/view', data),
    updateStatus: (uuid, data) => context.$axios.$post(`customers/view/${uuid}`, data),
    viewOne: id => context.$axios.$get(`customers/${id}`),
    deleteLogo: data => context.$axios.$get('customers/delete-logo', data),
    deleteBanner: data => context.$axios.$get('customers/delete-banner', data),
    getUsers: uuid => context.$axios.$get(`customers/get-users/${uuid}`),
    paymentList: data => context.$axios.$post('customers/payment-list', data),
    getSummary: data => context.$axios.$post('customers/get-summary', data),
    customersPaymentsList: data => context.$axios.$post('customers/customers-payments-list', data)
  })
  inject('systemUsersService', {
    updateUserStatus: data => context.$axios.$post('system-users/update-user-status', data),
    viewSystemUsers: data => context.$axios.$post('system-users/view', data),
    viewOne: data => context.$axios.$post('system-users/view-one', data)
  })
  inject('causesFailuresService', {
    viewFailures: () => context.$axios.$get('causes-failures')
  })
  inject('deliveryTypeStatusesService', {
    findByDeliveryStatus: data => context.$axios.$post('delivery-type-statuses/find-by-delivery-status', data),
    getDeliveryStatus: params => context.$axios.$get('delivery-type-statuses/view', { params })
  })
  inject('customerInvoicesPaymentsService', {
    findByCustomer: uuid => context.$axios.$get(`customer-invoices-payments/find-by-customer/${uuid}`),
    addPayment: data => context.$axios.$post('customer-invoices-payments/add', data),
    updatePayment: data => context.$axios.$post('customer-invoices-payments/update', data),
    activePaymentMethod: id => context.$axios.$post(`customer-invoices-payments/active-payment-method/${id}`),
    getSummaries: uuid => context.$axios.$get(`customer-invoices-payments/get-summaries/${uuid}`)
  })
  inject('cityService', {
    list: params => context.$axios.$get('city/list', { params })
  })
  inject('logsService', {
    list: params => context.$axios.$get('logs/list', { params }),
    writeInfoToLog: data => context.$axios.$post('logs/write-to-log', data)
  })
  inject('errorLogsService', {
    viewErrors: data => context.$axios.$post('error-logs/view', data)
  })
  inject('targetSatisfactionService', {
    viewQuestions: () => context.$axios.$get('target-satisfaction/view-questions'),
    viewAnsweredFeedbackForm: data => context.$axios.$post('target-satisfaction/view-answered-feedback-form', data)
  })
  inject('reportsService', {
    addReport: data => context.$axios.$post('reports/add', data),
    viewReport: data => context.$axios.$post('reports/view', data)
  })
  inject('collectionTasksService', {
    viewTasks: data => context.$axios.$post('collection-tasks/view', data),
    getSummaries: data => context.$axios.$post('collection-tasks/get-summaries', data),
    deleteCollectionTasks: data => context.$axios.$post('collection-tasks/delete-collection-tasks', data)
  })
  inject('collectionTaskSettingService', {
    findByCustomer: params => context.$axios.$get('collection-tasks-setting/find-by-customer', { params }),
    removeTask: uuid => context.$axios.$post(`collection-tasks-setting/remove/${uuid}`),
    addTask: data => context.$axios.$post('collection-tasks-setting/add', data),
    addSingular: data => context.$axios.$post('collection-tasks-setting/add-singular', data)
  })
  inject('refundsService', {
    viewRefunds: data => context.$axios.$post('refunds/view', data),
    getSummaries: data => context.$axios.$post('refunds/get-summaries', data)
  })
  inject('customerBagsService', {
    saveBagComments: data => context.$axios.$post('customer-bags/save-bag-comments', data),
    addPackageToBag: data => context.$axios.$post('customer-bags/add-package-to-bag', data),
    addBag: data => context.$axios.$post('customer-bags/add-bag', data),
    removePackageFromBag: data => context.$axios.$post('customer-bags/remove-package-from-bag', data),
    findBagByPackage: data => context.$axios.$post('customer-bags/find-bag-by-package', data),
    viewBag: data => context.$axios.$post('customer-bags/view', data),
    getSummaries: data => context.$axios.$post('customer-bags/get-summaries', data),
    cancelBag: data => context.$axios.$post('customer-bags/cancel-bag', data),
    blockBag: data => context.$axios.$post('customer-bags/block-bag', data),
    multipleAssociateToDriver: data => context.$axios.$post('customer-bags/multiple-associate-to-driver', data),
    multipleRemoveFromDriver: data => context.$axios.$post('customer-bags/multiple-remove-from-driver', data),
    associateToDriver: data => context.$axios.$post('customer-bags/associate-to-driver', data),
    getCities: params => context.$axios.$get('customer-bags/cities', { params })
  })
  inject('packagesBagService', {
    viewByCustomerBag: data => context.$axios.$post('packages-bag/view-by-customer-bag', data),
    viewByBag: params => context.$axios.$get('packages-bag/view-by-bag', { params })
  })
  inject('branchesService', {
    list: params => context.$axios.$get('branches/list', { params })
  })
  inject('apiSettingsService', {
    viewSettings: params => context.$axios.$get('api-setting/view', { params })
  })
  inject('customerApiKeysService', {
    generateNewKeys: data => context.$axios.$post('customer-api-keys/generate-new-Keys', data),
    resetAccessApi: data => context.$axios.$post('customer-api-keys/reset-access-api', data)
  })
  inject('customerBalanceCalculationService', {
    findCustomerBalance: uuid => context.$axios.$get(`customer-balance-calculation/find/${uuid}`),
    paymentDetails: (id, data = null) => context.$axios.$post(`customer-balance-calculation/payment-details/${id}`, data),
    billingAllCustomers: data => context.$axios.$post('customer-balance-calculation/billing-all-customers')
  })
  inject('polygonsService', {
    list: params => context.$axios.$get('polygons/list', { params }),
    viewOne: polygonUid => context.$axios.$get(`polygons/get/${polygonUid}`)
  })
  inject('newExitsManagementService', {
    getSorterSettings: () => context.$axios.$get('new-exits-management/get-sorter-settings'),
    triggerCallbacks: () => context.$axios.$get('new-exits-management/trigger-callbacks'),
    updateSorterCallbackUrl: data => context.$axios.$post('new-exits-management/update-sorter-callback-url', data),
    list: data => context.$axios.$post('new-exits-management/list', data),
    resetExit: data => context.$axios.$post('new-exits-management/reset-exit', data),
    addPolyLine: data => context.$axios.$post('new-exits-management/add-poly-line', data)
  })
  inject('polygonLinesService', {
    list: params => context.$axios.$get('polygon-lines/list', { params }),
    viewManualAssociation: data => context.$axios.$post('polygon-lines/view-manual-association', data),
    viewLines: () => context.$axios.$get('polygon-lines/view'),
    findByBranches: data => context.$axios.$post('polygon-lines/find-by-branches', data)
  })
  inject('exitsManagementService', {
    list: data => context.$axios.$post('exits-management/list', data),
    resetExit: data => context.$axios.$post('exits-management/reset-exit', data),
    addPolyLine: data => context.$axios.$post('exits-management/add-poly-line', data)
  })
  inject('permissionsService', {
    list: () => context.$axios.$get('permissions')
  })
  inject('deliveryTypeService', {
    list: () => context.$axios.$get('delivery-type/view')
  })
  inject('scansService', {
    list: params => context.$axios.$get('scans/view', { params }),
    addScan: data => context.$axios.$post('scans/add', data),
    deleteAll: data => context.$axios.$post('scans/delete-all', data)
  })
  inject('levelService', {
    list: () => context.$axios.$get('level/view')
  })
  inject('tagsService', {
    viewTags: data => context.$axios.$post('tags/view', data)
  })
}
