<template>
  <SectionLayout title="סניפים" :route-back="{ name: 'settings' }">
    <FilterUi
      v-model="filter"
      show-branches/>

    <ExportReport
      report-type="branches"
      :filter="filter"/>

    <v-data-table
      :headers="headers"
      :items="branchesData"
      :server-items-length="branchesData.length"
      :options.sync="options"
      :loading="loading"
      class="elevation-1"
      loading-text="טוען מידע, אנא המתן..."
      :footer-props="footerProps">
      <template v-slot:no-data>
        <p v-text="'אין מידע.'"/>
      </template>

      <template v-slot:item.actions="{ item }">
        <div class="options">
          <v-btn
            class="btn-secondary btn-edit"
            @click.prevent="editData(item)">
            <i class="icon icon-pen" />
          </v-btn>

          <DeleteButton
            :url="`branches/${item.id}`"
            has-warning
            :warning-message="'האם אתה בטוח שברצונך למחוק סניף זה?'"
            @deleted="getData"/>
        </div>
      </template>
    </v-data-table>

    <DialogUi v-model="drawerUi" md>
      <v-container style="padding: 10px 40px 10px 40px">
        <FormUi
          :form="form"
          :url="branchId ? `branches/${branchId}` : 'branches/add'"
          :btn-text="'שמירה'"
          ref-prop="branch-check"
          @submitted="getData">
          <v-text-field
            v-model="form.name"
            label="שם"
            :rules="requiredRule"/>
          <v-text-field
            v-model="form.target_city"
            label="עיר"
            :rules="requiredRule"/>
          <v-text-field
            v-model="form.target_street_name"
            label="כתובת יעד"
            :rules="requiredRule"/>
          <v-text-field
            v-model.number="form.target_street_number"
            label="מספר בית"
            :rules="requiredRule"/>
        </FormUi>
      </v-container>
    </DialogUi>
  </SectionLayout>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'SettingsBranches',
  middleware: ['permissions'],

  data () {
    return {
      branchesData: [],
      options: {},
      loading: !this.branchesData,
      headers: [
        { text: 'שם הסניף', align: 'right', value: 'name' },
        { text: 'פוליגון', align: 'center', value: 'polygon.name' },
        { text: 'כמות קווים', align: 'center', value: 'lines.length' },
        { text: 'כמות משתמשים', align: 'center', value: 'lines.length' },
        { text: 'כמות נהגים', align: 'center', value: 'drivers.length' },
        { text: 'כמות חבילות ממוצעת', align: 'center', value: ' ' },
        { text: 'אפשרויות', align: 'center', value: 'actions', sortable: false }
      ],
      branchId: '',
      filter: {
        branch: null
      },
      form: {
        name: '',
        target_city: null,
        target_street_name: null,
        target_street_number: null
      },
      requiredRule: [
        v => !!v || 'שדה חובה'
      ]
    }
  },
  computed: {
    ...mapState('auth', ['authUser']),
    ...mapState('global', ['branches', 'footerProps']),
    ...mapGetters('auth', ['customer']),

    drawerUi: {
      get () {
        return this.$store.state.drawerUi
      },
      set (value) {
        if (!value) {
          this.form.name = ''
          this.branchId = null
          this.form.target_city = null
          this.form.target_street_name = null
          this.form.target_street_number = null
        }

        this.$store.commit('setDrawerUi', value)
      }
    }
  },
  watch: {
    filter: {
      handler (newFilter) {
        if (newFilter.branch?.length > 0 && newFilter.branch?.length < 2) {
          return
        }
        return this.getData()
      },
      deep: true
    },
    options: {
      async handler (newOptions, oldOptions) {
        try {
          if (Object.keys(oldOptions)?.length < 1) {
            return
          }
          const { sortBy, sortDesc } = newOptions
          await this.getData()
          this.branchesData = this.branchesData.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'name':
                sortA = a.name
                sortB = b.name
                break
              case 'polygon.name':
                sortA = a.polygon?.name.charCodeAt(0) || 0
                sortB = b.polygon?.name.charCodeAt(0) || 0
                break
              case 'lines.length':
                sortA = a.lines?.length
                sortB = b.lines?.length
                break
              case 'drivers.length':
                sortA = a.drivers?.length
                sortB = b.drivers?.length
                break
            }
            if (sortDesc[0]) {
              return sortA < sortB ? 1 : sortA > sortB ? -1 : 0
            } else {
              return sortA < sortB ? -1 : sortA > sortB ? 1 : 0
            }
          })
        } catch (e) {
          this.$helper.snackbar(e, 'options watch')
        }
      },
      deep: true
    }
  },
  created () {
    return this.getData()
  },
  methods: {
    editData (branch) {
      console.log('branch', branch)
      this.branchId = branch.id
      this.form.name = branch.name
      this.form.target_city = branch.formatted_address.correct_long_city_name
      this.form.target_street_name = branch.formatted_address.correct_long_street_name
      this.form.target_street_number = branch.formatted_address.correct_street_number
      this.drawerUi = true
    },
    async getData () {
      try {
        this.loading = true
        this.branchesData = await this.$branchesService.list(this.filter)
        this.loading = false
        this.drawerUi = false
      } catch (e) {
        this.$helper.snackbar(e, 'getData')
      }
    }
  },
  head: { title: 'סניפים' }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .v-input__control {
    margin-right: -25px;
  }
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
  .v-data-footer__select .v-select {
    .v-input__control {
      width: 70px !important;
    }
  }
}
</style>
