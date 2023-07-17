export const state = () => ({
  delivery_types: [],
  customers: [],
  delivery_type_statuses: [],
  customerBagsCities: [],
  failureList: [],
  distribution_point_cities: [],
  cities: [],
  drivers: [],
  tagList: [],
  lineList: [],
  branches: [],
  exits: [],
  lines: [],
  driversSelected: [],
  onRemoveDriverSelected: false,
  distribution_points: [],
  driver: null,
  onUploadByCsv: false,
  footerProps: {
    "items-per-page-options": [
      100,
      200,
      300,
      400,
      500,
      600,
      700,
      800,
      900,
      1000,
      2000
    ],
    "items-per-page-text": "מספר פריטים מקסימלי בעמוד:"
  }
});

export const mutations = {
  setDeliveryTypes(state, deliveryTypes) {
    state.delivery_types = deliveryTypes;
  },
  setCustomerList(state, customers) {
    state.customers = customers;
  },
  setDistributionPoints(state, distributionPoints) {
    state.distribution_points = distributionPoints;
  },
  setDeliveryTypeStatusList(state, statuses) {
    state.delivery_type_statuses = statuses;
  },
  setDistributionPointCities(state, statuses) {
    state.distribution_point_cities = statuses;
  },
  setCustomerBagsCities(state, statuses) {
    state.customerBagsCities = statuses;
  },
  setFailureList(state, failureList) {
    state.failureList = failureList;
  },
  setDriverList(state, drivers) {
    state.drivers = drivers;
  },
  setTagList(state, tags) {
    state.tagList = tags;
  },
  setBranchList(state, branches) {
    state.branches = branches;
  },
  setLineList(state, lines) {
    state.lines = lines;
  },
  setDriverSelected(state, driver) {
    state.driver = driver;
  },
  setToDriversArraySelected(state, driverUids) {
    state.driversSelected = driverUids;
    state.onRemoveDriverSelected = false;
  },
  setOnRemoveDriverSelected(state, value) {
    state.onRemoveDriverSelected = value;
  },
  removeFromDriversArraySelected(state, driverId) {
    if (state.driversSelected && state.driversSelected.length > 1) {
      state.driversSelected = state.driversSelected.filter(e => e !== driverId);
    } else {
      state.driversSelected = [];
    }
    state.onRemoveDriverSelected = true;
  },
  clearDriversArraySelected(state) {
    state.driversSelected = [];
  },
  setCities(state, cities) {
    state.cities = cities;
  },
  setBranches(state, branches) {
    state.branches = branches;
  },
  setExits(state, exits) {
    state.exits = exits;
  },
  setOnUploadByCsv(state, value) {
    state.onUploadByCsv = value;
  }
};

export const actions = {
  /**
   * Made authorization on the system
   *
   * @param commit
   * @param dispatch
   * @param form
   * @returns {Promise<void>}
   */
  async getDeliveryTypes({ commit, state }) {
    try {
      const deliveryTypes = await this.$deliveryTypeService.list(
        "delivery-type/view"
      );
      commit("setDeliveryTypes", deliveryTypes);
      // response.status && commit('setAuthUser', response.authUser)
    } catch (e) {
      this.$helper.snackbar(e, "getDeliveryTypes");
    }
  },
  async getCustomerList({ commit, state }, data) {
    try {
      const customers = await this.$customersService.list(data);
      commit("setCustomerList", customers);
    } catch (e) {
      this.$helper.snackbar(e, "getCustomerList");
    }
  },
  async getDistributionPoints({ commit, state }) {
    try {
      const distributionPoints = await this.$distributionPointsService.getDistributionPoints();
      commit("setDistributionPoints", distributionPoints);
    } catch (e) {
      this.$helper.snackbar(e, "getDistributionPoints");
    }
  },
  async getDeliveryTypeStatuses({ commit, state }, data) {
    try {
      const statuses = await this.$deliveryTypeStatusesService.getDeliveryStatus(
        data
      );
      commit("setDeliveryTypeStatusList", statuses);
    } catch (e) {
      this.$helper.snackbar(e, "getDeliveryTypeStatuses");
    }
  },
  async getDistributionPointCities({ commit, state }, data) {
    try {
      const statuses = await this.$distributionPointsService.getCities(data);
      commit("setDistributionPointCities", statuses);
    } catch (e) {
      this.$helper.snackbar(e, "getDistributionPointCities");
    }
  },
  async getCustomerBagsCities({ commit, state }, data) {
    try {
      const statuses = await this.$customerBagsService.getCities(data);
      commit("setCustomerBagsCities", statuses);
    } catch (e) {
      this.$helper.snackbar(e, "getCustomerBagsCities");
    }
  },
  async getFailureList({ commit, state }, data) {
    try {
      const res = await this.$causesFailuresService.viewFailures();
      const failureList = res.map(failure => ({
        key: failure.id,
        name: failure.value
      }));
      commit("setFailureList", failureList);
    } catch (e) {
      this.$helper.snackbar(e, "getFailureList");
    }
  },
  async getDriverList({ commit, state }, data) {
    try {
      const response = await this.$driverService.driverView(data);
      commit("setDriverList", response?.items);
    } catch (e) {
      this.$helper.snackbar(e, "getDriverList");
    }
  },
  async getTagsList({ commit, state }) {
    try {
      const tags = await this.$tagsService.viewTags();
      commit("setTagList", tags?.items);
    } catch (e) {
      this.$helper.snackbar(e, "getTagsList");
    }
  },
  async getBranchList({ commit, state }) {
    try {
      const branches = await this.$branchesService.list();
      commit("setBranchList", branches);
    } catch (e) {
      this.$helper.snackbar(e, "getBranchList");
    }
  },
  async getLineList({ commit, state }, item) {
    try {
      const lines = await this.$polygonLinesService.list({
        polygon_uid: item.polygon_uid
      });
      commit("setLineList", lines);
    } catch (e) {
      this.$helper.snackbar(e, "getLineList");
    }
  },
  async getAllLines({ commit, state }) {
    try {
      const lines = await this.$polygonLinesService.viewLines();
      commit("setLineList", lines);
    } catch (e) {
      this.$helper.snackbar(e, "getAllLines");
    }
  },
  /**
   * Getting all branches by customer
   *
   * @param commit
   * @param rootGetters
   * @returns {Promise<void>}
   */
  async getBranches({ commit, rootGetters }, form) {
    try {
      const branches = await this.$branchesService.list(form);
      commit("setBranches", branches);
    } catch (e) {
      this.$helper.snackbar(e, "getBranches");
    }
  },
  async getExits({ commit, rootGetters }) {
    try {
      const exits = await this.$exitsManagementService.list();
      commit("setExits", exits);
    } catch (e) {
      this.$helper.snackbar(e, "getExits");
    }
  },
  async getCities({ commit, rootGetters }) {
    try {
      const cities = await this.$cityService.list({ params: { chars: " " } });
      commit("setCities", cities);
    } catch (e) {
      this.$helper.snackbar(e, "getCities");
    }
  }
};
