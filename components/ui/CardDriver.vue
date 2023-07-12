<template>
  <div class="row" id="driver-cards">
    <div v-for="(item, index) of selectedArray" :key="index" class="card-driver">
      <v-row class="main-card-driver" style="position: relative">
        <div>
          <i class=" img-delete fa fa-times" aria-hidden="true" @click.prevent="removeSelectedDriver(item.id)" />
          <img
            class="img-avatar"
            :src="item.driver_logo || 'https://cdn.vuetifyjs.com/images/lists/1.jpg'"
            alt="driver image">
          <span class="card-driver-name"><small>{{ item && item.first_name + ' ' + item.last_name }}</small></span>
          <span class="card-driver-car"><small>{{ item && item.car_type }}</small></span>
        </div>
      </v-row>
    </div>
  </div>
</template>

<script>

import { mapState } from 'vuex'

export default {
  name: 'CardDriver',

  props: {
    selectedArray: { type: Array, default: () => ([]) }
  },

  computed: {
    ...mapState('global', ['drivers', 'driversSelected'])
  },

  methods: {
    removeSelectedDriver (driverUid) {
      this.$store.commit('global/removeFromDriversArraySelected', driverUid)
    }
  }
}
</script>

<style lang="scss" scoped>
#driver-cards {
  justify-content: center;
  width: 895px;
  height: 84px;
  margin: 0 30px 0 30px;
}
.row {
  overflow-y: auto;
  height: 80px;
  margin-left: 0;
}
.card-driver-name{
  right: 86px;
  position: absolute;
  font-size: 15px;
  margin: 5px 0;
}
.card-driver-car{
  right: 86px;
  position: absolute;
  font-size: 15px;
  margin: 22px 0;
  .row {
    overflow-y: unset;
  }
}
.img-avatar {
  top: 0;
  right: 21px;
  position: absolute;
  border-radius: 32px;
  width: 55px;
  height: 55px;
  margin: 4px 0;
}
.main-card-driver {
  margin: 0;
  padding: 0;
  position: relative;
}
.card-driver {
  height: 4rem;
  width: 10rem;
  border: gray 1px solid;
  border-radius: 5px;
  margin: 0px 5px 20px 5px;
}
.img-delete {
  position: absolute;
  font-size: 11px;
  top: 0;
  right: 5px;
  cursor: pointer;
}
</style>
