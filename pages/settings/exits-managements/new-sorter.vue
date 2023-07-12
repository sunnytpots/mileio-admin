<template>
  <SectionLayout
    title="ניהול יציאות ממיינת חדשה"
    :route-back="{ name: 'settings' }"
    sm>
    <CardUi>
      <v-data-table
        :items="items"
        :headers="headers"
        :loading="loading"
        :footer-props="footerProps"
        :options.sync="options"
        class="elevation-1">
        <template v-slot:item.lines="{ item }">
          {{ renderExitLines(item) }}
        </template>
        <template v-slot:item.actions="{ item }">
          <div
            v-if="$hasPermission('settings-exits-managements-new-sorter', 'edit')"
            class="options">
            <v-btn
              class="btn-secondary btn-edit"
              @click.prevent="editData(item)">
              <i class="icon icon-pen" />
              <p
                style="margin: auto 5px 0 auto"
                v-text="'עריכה'"/>
            </v-btn>
            <v-btn
              @click="showResetDialog(item)">
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
            <v-btn
              class="btn-primary"
              @click.prevent="onSave">
              {{ 'שמירה' }}
            </v-btn>
          </v-row>
          <v-row>
            <v-col>
              <v-autocomplete
                v-model="polygon_uids"
                clearable
                multiple
                :items="polygons"
                label="בחר פוליגון"
                item-text="name"
                item-value="uuid"
                :error-messages="$v.$dirty && $v.polygon_uids.$invalid && 'שדה חובה' || ''"
                @input="selectPolygon">
                <template v-slot:item="{ item }">
                  <div class="polygon-list-item">
                    <p style="margin-bottom: 0" v-text="item.name"/>
                    <v-btn
                      class="all-polylines-button"
                      @click.stop="selectPolygonAllLines(item.uuid)">
                      {{ 'כל הקווים' }}
                    </v-btn>
                  </div>
                </template>
              </v-autocomplete>
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
                item-text="line_number"
                item-value="id"
                :error-messages="$v.$dirty && $v.lines.$invalid && 'שדה חובה' || ''"/>
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
  name: 'NewSorter',
  middleware: ['permissions'],

  data () {
    return {
      pagination: {
        skip: 0,
        take: 100
      },
      loading: false,
      options: {},
      resetDialog: false,
      filter: {
        branch: null
      },
      items: [],
      polylines: [],
      polygons: [],
      polygon_uids: [],
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
        console.log('open drawer?', value)
        if (!value) {
          this.form = {}
          this.exitId = null
          this.polygon_uids = []
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
          await this.getNewExitsNumbers()
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
      await this.getNewExitsNumbers()
      this.polygons = await this.$polygonsService.list()
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    showResetDialog (item) {
      this.exit = item
      this.resetDialog = true
    },
    async getNewExitsNumbers () {
      try {
        this.loading = true
        this.items = await this.$newExitsManagementService.list(this.pagination)
        this.loading = false
      } catch (e) {
        this.$helper.snackbar(e, 'getNewExitsNumbers')
      }
    },
    renderExitLines (exit) {
      return exit?.lines?.map(b => b.line_number)?.join(', ')
    },
    async resetExitLines () {
      try {
        await this.$newExitsManagementService.resetExit({ exit_id: this.exit.id })
        await this.getNewExitsNumbers()
        this.exit = null
        this.resetDialog = false
      } catch (e) {
        this.exit = null
        this.$helper.snackbar(e, 'resetExitLines')
      }
    },
    async editData (exit) {
      try {
        console.log('editData exit', exit)
        this.exit = exit
        this.exitId = exit.id

        if (exit.polygon) {
          this.polygon_uids.push(exit.polygon.uuid)
          this.polygonSelected = true
          this.polylines = await this.$polygonLinesService.list({ polygon_uid: exit.polygon.uuid })
        }

        this.drawerUi = true

        if (exit.lines?.length > 0) {
          this.lines = exit.lines.map(line => line.id)

          const linesIds = this.lines.map(lineId => ({ line_id: lineId }))
          this.form = {
            new_exit_management_id: this.exitId,
            lines_ids: linesIds
          }
        }
      } catch (e) {
        this.$helper.snackbar(e, 'editData')
      }
    },
    async selectPolygonAllLines (uid) {
      try {
        this.polygonSelected = true
        const newPolylines = await this.$polygonLinesService.list({ polygon_uid: uid })

        if (!this.polygon_uids.includes(uid)) {
          this.polygon_uids.push(uid)
          this.polylines.push(...newPolylines)
        }

        const polylinesIds = newPolylines.map(polyline => polyline.id)
        for (const polylinesId of polylinesIds) {
          if (!this.lines.includes(polylinesId)) {
            this.lines.push(polylinesId)
          }
        }
      } catch (e) {
        this.$helper.snackbar(e, 'selectPolygon')
      }
    },
    async selectPolygon () {
      try {
        console.log('exit ', this.exit)
        this.polylines = []

        for (const polygonUid of this.polygon_uids) {
          const newPolylines = await this.$polygonLinesService.list({ polygon_uid: polygonUid })
          this.polylines.push(...newPolylines)
        }

        const filteredPolylines = this.polylines.filter(line => this.lines.some(selectedLineId => line.id === selectedLineId))
        this.lines = filteredPolylines.map(line => line.id)

        this.polygonSelected = true
      } catch (e) {
        this.$helper.snackbar(e, 'selectPolygon')
      }
    },
    async onSave () {
      try {
        const linesIds = this.lines.map(lineId => ({ line_id: lineId }))
        this.form = {
          new_exit_management_id: this.exitId,
          lines_ids: linesIds
        }

        this.$v.$touch()

        if (this.$v.$error) {
          return
        }

        await this.$newExitsManagementService.addPolyLine(this.form)
        this.form = {}
        this.drawerUi = false
        return this.getNewExitsNumbers()
      } catch (e) {
        this.$helper.snackbar(e, 'onSave')
      }
    }
  },
  validations: {
    polygon_uids: { required },
    lines: { required }
  },
  head: { title: 'ניהול יציאות' }
}
</script>

<style lang="scss" scoped>
.polygon-list-item {
  display: flex;
  justify-content: space-between;
  width: 100%;

  .all-polylines-button {
    padding: 0 10px;
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
