<template>
  <div class="driver-management">
    <v-menu v-model="menuOpen" :close-on-content-click="false" transition="slide-y-transition" rounded="0">
      <template #activator="{ on, attrs }">
        <v-btn :disabled="loading" v-ripple="false" v-bind="attrs" v-on="on">
          <div class="icon-wrapper">
            <i class="icon icon-truck-white" />
          </div>

          <div class="driver-management-info">
            <p class="text-white" v-text="'ניהול נהגים'" />
            <v-progress-circular
              v-if="loading"
              size="20"
              color="green"
              indeterminate
            />
            <p v-else class="text-green" v-text="items.length" />
          </div>

          <v-icon v-text="'mdi-chevron-down'" />
        </v-btn>
      </template>
      <MenuCardUi v-model="menuOpen" icon="truck-white">
        <template #top>
          <p class="text-white" v-text="'ניהול נהגים'" />

          <p class="text-green">
            <span v-text="items.length" />
            <span class="text-gray" v-text="'מתוך '+ items.length" />
          </p>
        </template>

        <template #header>
          <v-text-field
            v-model="search"
            placeholder="חיפוש נהג"
            outlined />

          <ExportReport report-type="driversManagement"/>
        </template>

        <v-list>
          <v-list-item-group v-model="selected" active-class="pink--text" :multiple="listType === 'multiple'">
            <template v-for="(item, index) in items">
              <v-list-item :key="index" :value="item.id" @click="listType !== 'multiple' ? menuOpen = false : null">
                <template #default="{ active }">
                  <v-list-item-action>
                    <v-checkbox v-if="listType === 'multiple'" :input-value="active" />
                  </v-list-item-action>

                  <v-list-item-avatar size="50">
                    <v-img
                      :alt="`${item.first_name + ' ' + item.last_name} avatar`"
                      :src="item.driver_logo || 'https://cdn.vuetifyjs.com/images/lists/1.jpg'" />
                  </v-list-item-avatar>

                  <v-list-item-content>
                    <v-list-item-title v-text="item.first_name + ' ' + item.last_name" />

                    <v-list-item-subtitle v-text="item.car_type ? item.car_type : null" />
                  </v-list-item-content>

                  <div class="driver-management-state">
                    <v-progress-linear reverse :value="item.tasks && calculateDoneTasksToday(item.tasks)" />
                    <div class="driver-management-state-info">
<!--                      <p v-text="'30 ד` | 5/18'" />-->
                      <p v-text="item.tasks && `${item.tasks.done_tasks_today || '0'}/${item.tasks.active_tasks || '0'}`" />
                    </div>
                  </div>
                </template>
              </v-list-item>

              <!--              <v-divider v-if="index < drivers.length - 1" :key="index" />-->
            </template>
          </v-list-item-group>
        </v-list>
      </MenuCardUi>
    </v-menu>
  </div>
</template>

<script>

import { mapGetters, mapState } from 'vuex'

export default {
  name: 'DriverManagement',
  props: {
    listType: { type: String, default: 'multiple' }
  },

  data () {
    return {
      menuOpen: false,
      search: '',
      selected: null,
      items: [],
      // drivers: [],
      pagination: {
        skip: 0,
        take: 20
      },
      loading: false
    }
  },

  computed: {
    ...mapGetters('auth', ['branchSelected']),
    ...mapState('global', ['driver', 'drivers', 'driversSelected', 'onRemoveDriverSelected'])
  },

  watch: {
    menuOpen (newVal) {
      if (!newVal) {
        this.search = ''
      }
    },
    selected (driversId) { // set all selected drivers to card driver => driversSelectedArray
      if (!this.onRemoveDriverSelected) {
        this.$store.commit('global/setToDriversArraySelected', driversId)
      } else {
        this.$store.commit('global/setOnRemoveDriverSelected', false)
      }
    },
    // async bottom (bottom) {
    //   if (bottom) {
    //     // await this.$store.dispatch('global/getDriverList', { ...this.pagination })
    //     this.drivers = await this.$axios.$post('driver/view', { ...this.pagination })
    //   }
    // },

    search (newValue) {
      if (newValue !== '' && newValue.length < 2) {
        return
      }
      // await this.$store.dispatch('global/getDriverList', { filter: { search: newValue, branch_id: this.branchSelected } })
      if (newValue === '') {
        this.items = this.drivers
      } else {
        this.items = this.drivers.filter(driver => {
          const driverName = driver.first_name.concat(driver.last_name).replace(/\s/g, '')
          return driverName.includes(newValue.replace(/\s/g, ''))
        })
      }
      // this.drivers = await this.$axios.$post('driver/view', { filter: { search: newValue } })
    },

    async branchSelected (newValue) {
      console.log('branchSelected', newValue)
      this.loading = true
      await this.$store.dispatch('global/getDriverList', { filter: { branch_id: newValue } })
      this.items = this.drivers
      this.loading = false
    },

    driversSelected (newValue) {
      this.selected = newValue
      this.$tabEvent.emit('driversSelected', newValue)
    }
  },
  mounted () {
    this.$nuxt.$on('reload-driver-management', () => {
      return this.loadDriversData()
    })
  },
  created () {
    return this.loadDriversData()
  },
  // beforeMount () {
  //   console.log('beforeMount')
  //   window.addEventListener('scroll', this.scrollEvent)
  // },
  // destroyed () {
  //   window.removeEventListener('scroll', this.scrollEvent)
  // },
  //
  methods: {
    calculateDoneTasksToday (tasks) {
      if (tasks.active_tasks === 0) {
        return 0
      }
      return (tasks.done_tasks_today * 100) / tasks.active_tasks
    },
    async loadDriversData () {
      try {
        this.loading = true
        await this.$store.dispatch('global/getDriverList', {
          filter: { branch_id: this.branchSelected },
          sortByActiveTasks: true
        })
        this.items = this.drivers
        this.loading = false
      } catch (e) {
        this.$helper.snackbar(e, 'loadDriversData')
      }
    },
  }
  //   scrollEvent () {
  //     if (this.bottomVisible()) {
  //       this.pagination.skip = this.pagination.skip + 20
  //     }
  //     this.bottom = this.bottomVisible()
  //   },
  //   bottomVisible () {
  //     const scrollY = window.scrollY
  //     const visible = document.documentElement.clientHeight
  //     const pageHeight = document.documentElement.scrollHeight
  //     const bottomOfPage = visible + scrollY >= pageHeight
  //     return (bottomOfPage || pageHeight < visible)
  //   }
  // }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .export-btn {
    .col-2 {
      padding-right: 0;
    }
  }
}
.driver-management {
  height: 100%;
  margin-left: 4.4rem;

  .v-btn {
    &.theme--light.v-btn--has-bg{
      color: #fff;
      height: 100%;
      background-color: #2D3642;
      padding: 0 13px;
    }
  }
}

.menu-card-ui{
  ::v-deep{
    .v-list-item{
      padding: 0 10px;
    }
    .v-list-item__action{
      margin: 0 0 0 .8rem;
    }
    .v-list-item__content {
      padding: .9rem 0;
    }
    .v-list-item__title{
      margin-bottom: .3rem;
      font-size: .8rem;
      font-weight: bold;
    }
    .v-list-item__subtitle {
      font-size: .7rem;
    }
    .v-avatar{
      margin: 0 0 0 1.1rem;
    }
    .v-input__slot{
      margin-bottom: 0;
    }
    .v-text-field__details{
      display: none;
    }
    .v-input__slot{
      border: none;
    }
    .v-text-field--outlined{
      border-radius: 0;
    }
    .theme--light.v-input input{
      color: #A2A2A2;
      font-size: .8rem;
      padding-right: .25rem;
    }
    .v-text-field--outlined > .v-input__control > .v-input__slot{
      background-color: #fff;
    }
    .v-text-field--outlined > .v-input__control > .v-input__slot{
      min-height: 40px;
    }
  }
}

.icon-wrapper{
  margin-left: .9rem;
}

.driver-management-info {
  margin-left: .9rem;
}
.text-white{
  margin-bottom: .2rem;
}
.text-green{
  font-size: .8rem;
  margin-bottom: 0;
  display: flex;
  align-items: center;

  span{
    &:first-child{
      margin-left: .3rem;
    }
  }

  &:before{
    content: '';
    display: inline-flex;
    width: 8px;
    height: 8px;
    margin-left: .3rem;
    margin-bottom: .1rem;
    background-color: #34AA54;
    border-radius: 50px;
  }
}

.driver-management-state{
  width: 4rem;
  display: flex;
  flex-direction: column;
  justify-content: center;

  ::v-deep .v-progress-linear{
    margin-bottom: .25rem;
  }
}
.driver-management-state-info{
  font-size: .7rem;
  color: #7F848C;

  p {
    margin-bottom: 0;
  }
}
</style>
