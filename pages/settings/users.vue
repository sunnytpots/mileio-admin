<template>
  <SectionLayout title="משתמשים" :route-back="{ name: 'settings' }">
    <div class="coordinator-body">
      <FilterUi v-model="filter" show-search />
      <div :class="['col-2', 'btns-coordinator']">
        <v-btn class="btn-primary" @click="filterHelper">
          מיין תוצאות
        </v-btn>
        <ExportReport
          report-type="usersSettings"
          :filter="filter"/>
      </div>
      <v-data-table
        :headers="headers"
        :items="systemUsers || []"
        class="elevation-1"
        :loading="loading"
        loading-text="טוען נתונים, אנא המתן..."
        :footer-props="footerProps"
        @click:row="edit">
        <template v-slot:no-data>
          <p v-text="'אין מידע.'"/>
        </template>

        <template #item.branches="{ item }">
          {{ item.branches.map(b => b.name).join(',') }}
        </template>

        <template #item.actions="{ item }">
          <div class="options" @click.stop>
            <DeleteButton
              :url="`system-users/delete/${item.uuid}`"
              has-warning
              @deleted="filterHelper"/>
          </div>
        </template>

        <template #item.first_name="{ item }">
          {{ item.first_name }} {{ item.last_name }}
        </template>

        <template #item.is_active="{ item }">
          <v-switch
            v-model="item.is_active"
            :label="item.is_active ? 'פעיל' : 'לא פעיל'"
            color="#fa4617"
            hide-details
            :input-value="item.is_active"
            @click.stop="changeUserStatus(item)"/>
        </template>
      </v-data-table>

      <DrawerUi :tabs="tabs">
        <template v-if="$hasPermission('settings-users', 'edit')" #header>
          <v-btn class="btn-primary" @click.prevent="$nuxt.$emit('formSubmit', 'settings-users-info')">
            שמירה
          </v-btn>
        </template>

        <template #aside>
          <v-avatar v-if="user" color="grey lighten-2" size="210">
            <span class="headline" v-text="initials" />
          </v-avatar>
        </template>

        <n-child :user="user" />
      </DrawerUi>
    </div>
  </SectionLayout>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'SettingsUsers',
  middleware: ['permissions'],

  async asyncData ({ $axios, store }) {
    await store.dispatch('global/getBranches')
  },
  data () {
    return {
      loading: false,
      systemUsers: null,
      headers: [
        { text: 'שם', align: 'right', value: 'first_name' },
        { text: 'נייד', align: 'right', value: 'mobile' },
        { text: 'אימייל', align: 'right', value: 'email' },
        { text: 'סניפים', align: 'right', value: 'branches' },
        { text: 'סטטוס', align: 'right', value: 'is_active' },
        { text: 'הרשאות', align: 'right', value: 'level.name' },
        { text: 'אפשרויות', align: 'center', value: 'actions', sortable: false }
      ],
      tabs: [
        { title: 'כללי', to: { name: 'settings-users-info' } }
      ],
      user: null,
      filter: {}
    }
  },
  computed: {
    ...mapState(['drawerUi']),
    ...mapGetters('auth', ['customer']),
    ...mapState('global', ['footerProps']),

    initials () {
      return this.user ? `${this.user.first_name[0]}${this.user.last_name[0]}` : ''
    }
  },
  watch: {
    $route () {
      return this.filterHelper()
    },
    status (newStatus) {
      if (newStatus) {
        this.getData()
        this.$store.commit('setDrawerUi', false)
      }
    },
    drawerUi (newDrawerUi) {
      !newDrawerUi && (this.user = null)
    }
  },
  created () {
    return this.filterHelper()
  },
  methods: {
    async changeUserStatus (user) {
      try {
        await this.$systemUsersService.updateUserStatus({
          user_id: user.id,
          is_active: user.is_active
        })
      } catch (e) {
        this.$helper.snackbar(e, 'changeUserStatus')
      }
    },
    async filterHelper () {
      try {
        this.loading = true
        this.systemUsers = await this.$systemUsersService.viewSystemUsers(this.filter)
        this.loading = false
      } catch (e) {
        this.$helper.snackbar(e, 'filterHelper')
      }
    },
    edit (item) {
      this.user = item
      this.$router.push({ name: 'settings-users-info' })
    }
  },
  head: { title: 'משתמשים' }
}
</script>

<style lang="scss" scoped>
.coordinator-body {
  background-color: #F8F8FD;
  .btns-coordinator{
    padding: unset!important;
    margin-bottom: 10px;
  }
  .btn-primary{
    margin: 0!important;
  }
}
.elevation-1 {
  background-color: #FFFFFF;
  ::v-deep {
    table thead tr th {
      background-color: #F4F4F4 !important;
      height: 65px;
      span {
        font-style: normal;
        font-weight: normal;
        font-size: 14px;
        color: #000000;
      }
      .v-data-table-body {
        height: 65px;
      }
    }

    .deleted-delivery {
      background-color: #ffffa1 !important;
    }

    .delivery-with-error {
      background-color: #f5b700 !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .delivery-with-error:hover {
      background-color: darken(#ffd344, 10%) !important;
    }

    .v-data-footer__select .v-select {
      .v-input__control {
        width: 70px !important;
      }
    }
  }
}
::v-deep{
.filter-ui{
  margin-right: -20px;
}
}
</style>
