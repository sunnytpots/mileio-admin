<template>
  <SectionLayout
    title="ניהול יציאות ממיינת ישנה"
    :route-back="{ name: 'settings' }"
    sm>
    <CardUi>
      <v-data-table
        :items="items"
        :loading="loading"
        :headers="headers"
        :options.sync="options"
        :footer-props="footerProps"
        class="elevation-1">
        <template v-slot:item.lines="{ item }">
          {{ renderExitLines(item) }}
        </template>
        <template v-slot:item.actions="{ item }">
          <div
            v-if="$hasPermission('settings-exits-managements-old-sorter', 'edit')"
            class="options">
            <v-btn
              class="btn-secondary btn-edit"
              @click.prevent="editData(item)">
              <i class="icon icon-pen" />
              <p
                style="margin-bottom: 0; margin-right: 5px"
                v-text="'עריכה'"/>
            </v-btn>
            <v-btn
              @click="exit = item; resetDialog = true">
              {{ 'איפוס' }}
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </CardUi>

    <DialogUi v-model="drawerUi" sm>
      <v-form style="padding: 5px;">
        <v-container>
          <v-row style="flex-direction: row-reverse">
            <v-btn class="btn-primary" @click.prevent="onSave">
              שמירה
            </v-btn>
          </v-row>
          <v-row>
            <v-col>
              <v-autocomplete
                v-model="polygon_uid"
                clearable
                :items="polygons"
                label="בחר פוליגון"
                item-text="name"
                item-value="uuid"
                :error-messages="$v.$dirty && $v.polygon_uid.$invalid && 'שדה חובה' || ''"
                @input="selectPolygon"/>
            </v-col>
          </v-row>
          <v-row v-if="polygonSelected">
            <v-col>
              <v-autocomplete
                v-model="lines"
                clearable
                multiple
                :items="polylines"
                label="בחר קו"
                item-text="name"
                item-value="id"
                :error-messages="$v.$dirty && $v.lines.$invalid && 'שדה חובה' || ''"
                @input="selectPolyLine"/>
            </v-col>
          </v-row>
        </v-container>
      </v-form>
    </DialogUi>

    <v-dialog
      v-model="resetDialog"
      max-width="340"
      text-align="-webkit-center"
      persistent>
      <v-card style="padding: 10px;">
        <p v-text="'האם אתה בטוח/ה שברצונך לאפס את הקווים המשוייכים ליציאה זו?'"/>
        <v-card-actions style="flex-direction: row-reverse; margin-top: 10px;">
          <v-btn
            class="white--text confirm-reset-btn"
            color="#fa4616"
            @click="resetExitLines"
            v-text="'אישור'"/>
          <v-spacer/>
          <v-btn
            class="white--text confirm-reset-btn"
            color="#fa4616"
            @click="resetDialog = false"
            v-text="'ביטול'"/>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </SectionLayout>
</template>

<script>
import { required } from 'vuelidate/lib/validators'
import { mapState } from 'vuex'

export default {
  name: 'OldSorter',
  middleware: ['permissions'],

  data () {
    return {
      pagination: {
        skip: 0,
        take: 100
      },
      options: {},
      loading: false,
      resetDialog: false,
      filter: {
        branch: null
      },
      items: [],
      polylines: [],
      polygons: [],
      polygon_uid: null,
      exitId: null,
      exit: null,
      polygonSelected: false,
      form: {},
      lines: []

    }
  },
  computed: {
    ...mapState('global', ['footerProps']),

    headers () {
      const arr = [
        { text: 'מספר יציאה', align: 'center', value: 'exit_number', width: '10%', sortable: true },
        { text: 'קווים', align: 'center', value: 'lines', width: '70%', sortable: false },
        { text: 'אפשרויות', align: 'center', value: 'actions', width: '20%', sortable: false }
      ]
      return arr
    },
    drawerUi: {
      get () {
        console.log('this.$store.state.drawerUi', this.$store.state.drawerUi)
        return this.$store.state.drawerUi
      },
      set (value) {
        console.log(value, 'drawer closed')
        if (!value) {
          this.form = {}
          this.exitId = null
          this.polylines = []
          this.lines = []
        }

        this.$store.commit('setDrawerUi', value)
      }
    }
  },
  watch: {
    options: {
      async handler (newOptions, oldOptions) {
        try {
          if (Object.keys(oldOptions)?.length < 1) {
            return
          }
          const { sortBy, sortDesc } = newOptions
          this.pagination = {
            skip: (newOptions.page - 1) * newOptions.itemsPerPage,
            take: newOptions.itemsPerPage
          }
          await this.getExitsNumbers()
          this.items = this.items.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'exit_number':
                sortA = a.customer_name?.charCodeAt(0) || 0
                sortB = b.customer_name?.charCodeAt(0) || 0
                break
            }

            if (sortDesc[0]) {
              return sortA < sortB ? 1 : sortA > sortB ? -1 : 0
            } else {
              return sortA < sortB ? -1 : sortA > sortB ? 1 : 0
            }
          })
        } catch (e) {
          this.$helper.snackbar(e, 'options watch error')
        }
      },
      deep: true
    }
  },
  async created () {
    try {
      await this.getExitsNumbers()
      this.polygons = await this.$polygonsService.list()
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    async getExitsNumbers () {
      try {
        this.loading = true
        this.items = await this.$exitsManagementService.list(this.pagination)
        this.loading = false
      } catch (e) {
        this.$helper.snackbar(e, 'getExitsNumbers')
      }
    },
    renderExitLines (exit) {
      // const lines = exit?.lines?.map(b => b.name)?.join(', ')?.slice(0, 50)
      // return lines?.length > 49 ? lines + '...' : lines

      const lines = exit?.lines?.map(b => b.line_number)?.join(', ')
      return lines
    },
    async resetExitLines () {
      try {
        console.log('resetExitLines', this.exit)
        await this.$exitsManagementService.resetExit({ exit_id: this.exit.id })
        await this.getExitsNumbers()
        this.exit = null
        this.resetDialog = false
      } catch (e) {
        this.exit = null
        this.$helper.snackbar(e, 'resetExitLines')
      }
    },
    async editData (exit) {
      try {
        console.log('editData', exit)
        this.exit = exit
        this.exitId = exit.id
        this.polygon_uid = exit.polygon?.uuid
        this.polygonSelected = exit.polygon && true
        this.polylines = exit.polygon && await this.$polygonLinesService.list({ polygon_uid: exit.polygon.uuid })
        this.drawerUi = true

        if (exit.lines?.length > 0) {
          this.lines = exit.lines.map(line => line.id)

          const linesIds = this.lines.map(lineId => ({ line_id: lineId }))
          this.form = {
            sorting_delivery_exist_id: this.exitId,
            lines_ids: linesIds
          }
        }
      } catch (e) {
        this.$helper.snackbar(e, 'editData')
      }
    },

    async getData (response) {
      try {
        if (response.status) {
          this.items = await this.$exitsManagementService.list()
          this.drawerUi = false
        }
      } catch (e) {
        this.$helper.snackbar(e, 'getData')
      }
    },
    async selectPolygon () {
      try {
        console.log('this.polygon_uid', this.polygon_uid)
        console.log('exit ', this.exit)

        if (this.exit.polygon && this.polygon_uid !== this.exit.polygon.uuid) {
          this.form = {}
          this.lines = []
        }

        this.polylines = await this.$polygonLinesService.list({ polygon_uid: this.polygon_uid })
        this.polygonSelected = true
      } catch (e) {
        this.$helper.snackbar(e, 'selectPolygon')
      }
    },
    selectPolyLine () {
      console.log('lines', this.lines)
      this.form = {}
      const linesIds = this.lines.map(lineId => ({ line_id: lineId }))
      this.form = {
        sorting_delivery_exist_id: this.exitId,
        lines_ids: linesIds
      }
    },
    async onSave () {
      try {
        this.$v.$touch()

        if (this.$v.$error) {
          return
        }

        await this.$exitsManagementService.addPolyLine(this.form)
        this.form = {}
        this.drawerUi = false
        this.items = await this.$exitsManagementService.list()
      } catch (e) {
        this.$helper.snackbar(e, 'onSave')
      }
    }
  },
  validations: {
    polygon_uid: { required },
    lines: { required }
  },
  head: { title: 'ניהול יציאות' }
}
</script>

<style lang="scss" scoped>
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

.form-ui{
  ::v-deep {
    .v-text-field__details{
      display: none;
    }

    .error--text{
      .v-text-field__details{
        display: flex;
      }
    }
  }
}
</style>
