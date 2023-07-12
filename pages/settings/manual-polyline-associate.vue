<template>
  <SectionLayout
    title="שיוך קווים ידני"
    :route-back="{ name: 'settings' }">
    <v-layout row wrap>
      <v-flex md12 xs12 class="mb-5">
        <FilterUi
          v-model="filter"
          show-line-city
          show-line-street
          show-line-number
          show-reset
          :clear-filter-inputs="clearFilterInputs"
          @submit="viewManualAssociate"/>
        <v-btn class="btn-primary" @click="viewManualAssociate">
          מיין תוצאות
        </v-btn>
      </v-flex>
      <v-flex md12 xs12 class="mb-5">
        <v-btn
          class="btn-primary"
          @click="dialog = true">
          {{ 'הוספה' }}
        </v-btn>
      </v-flex>

      <v-flex md12 xs12>
        <v-data-table
          :headers="headers"
          :items="items"
          :server-items-length="totalItems"
          :options.sync="options"
          class="elevation-1"
          :loading="loading"
          loading-text="טוען קווים, אנא המתן..."
          :footer-props="footerProps"
          @click:row="showInfo">
          <template v-slot:item.actions="{ item }">
            <DeleteButton
              :url="`polygon-lines/delete-manual-association/${item.id}`"
              has-warning
              :warning-message="'האם אתה בטוח שברצונך למחוק שיוך ידני זה?'"
              @deleted="viewManualAssociate"/>
          </template>
        </v-data-table>
      </v-flex>
    </v-layout>

    <DialogUi
      v-model="dialog"
      md
      persistent>
      <FormUi
        :form="form"
        ref-prop="checkManualAssociate"
        :url="manualPolyline && manualPolyline.id ? 'polygon-lines/update-manual-association' : 'polygon-lines/add-manual-association'"
        name="ManualAssociate"
        cancel-btn
        @cancel-submission="dialog = false"
        @submitted="submitted">
        <v-container>
          <v-layout wrap row style="justify-content: center">
            <v-flex md4 xs12 class="px-2">
              <v-text-field
                v-model="form.city_name"
                label="עיר"
                :rules="notEmptyRule"/>
            </v-flex>

            <v-flex md4 xs12 class="px-2">
              <v-text-field
                v-model="form.street_name"
                label="רחוב"
                :rules="notEmptyRule"/>
            </v-flex>

            <v-flex md2 xs12 class="px-2">
              <v-text-field
                v-model.number="form.street_number"
                type="number"
                label="מספר רחוב"
                :rules="notEmptyRule"/>
            </v-flex>
          </v-layout>

          <v-layout wrap row style="justify-content: center">
            <v-flex md6 xs12 class="px-5">
              <v-autocomplete
                v-model="polygon_uid"
                clearable
                :items="polygons"
                label="בחר פוליגון"
                item-text="name"
                item-value="uuid"
                :rules="notEmptyRule"
                @input="selectPolygon">
                <template v-slot:item="{ item }">
                  <div class="polygon-list-item">
                    <p style="margin-bottom: 0" v-text="item.name"/>
                  </div>
                </template>
              </v-autocomplete>
            </v-flex>

            <v-flex v-if="polygon_uid" md3 xs12 class="px-5">
              <v-autocomplete
                v-model="form.polyline_id"
                clearable
                :items="polylines"
                label="בחר קו"
                item-text="line_number"
                item-value="id"
                :rules="notEmptyRule"/>
            </v-flex>
          </v-layout>
        </v-container>
      </FormUi>
    </DialogUi>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'ManualPolylineAssociate',
  middleware: ['permissions'],

  data () {
    return {
      options: {},
      items: [],
      totalItems: 0,
      polylines: [],
      polygon_uid: null,
      polygons: [],
      manualPolyline: null,
      dialog: false,
      loading: false,
      form: {
        city_name: null,
        street_name: null,
        street_number: null,
        polyline_id: null,
        manual_association_id: null
      },
      filter: {
        search: null
      },
      pagination: {
        skip: 0,
        take: 100
      },
      notEmptyRule: [
        v => !!v || 'שדה חובה'
      ]
    }
  },
  computed: {
    ...mapState('global', ['footerProps']),

    headers () {
      const arr = [
        { text: 'עיר', align: 'center', value: 'city_name', width: '20%' },
        { text: 'רחוב', align: 'center', value: 'street_name', width: '20%' },
        { text: 'מספר רחוב', align: 'center', value: 'street_number', width: '20%' },
        { text: 'קו', align: 'center', value: 'polygon_line.line_number', width: '15%' },
        { text: 'פעולות', align: 'center', value: 'actions', width: '5%', sortable: false }
      ]
      return arr
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
          await this.viewManualAssociate()
          this.items = this.items.sort((a, b) => {
            let sortA
            let sortB
            switch (sortBy[0]) {
              case 'city_name':
                sortA = a.city_name || ''
                sortB = b.city_name || ''
                break
              case 'street_name':
                sortA = a.street_name || ''
                sortB = b.street_name || ''
                break
              case 'street_number':
                sortA = a.street_number || ''
                sortB = b.street_number || ''
                break
              case 'polygon_line.line_number':
                sortA = a.polygon_line?.line_number || ''
                sortB = b.polygon_line?.line_number || ''
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
    },
    dialog (newVal) {
      if (newVal) {
        return
      }

      this.polygon_uid = null
      this.manualPolyline = null
      this.form = {
        city_name: null,
        street_name: null,
        street_number: null,
        polyline_id: null,
        manual_association_id: null
      }
    }
  },
  async created () {
    try {
      await this.viewManualAssociate()
      this.polygons = await this.$polygonsService.list()
    } catch (e) {
      this.$helper.snackbar(e, 'created')
    }
  },
  methods: {
    clearFilterInputs () {
      this.filter = {
        search: null
      }
      return this.viewManualAssociate()
    },
    async showInfo (item) {
      try {
        this.manualPolyline = item
        this.polygon_uid = this.manualPolyline.polygon?.uuid
        await this.selectPolygon()

        this.form = {
          city_name: this.manualPolyline.city_name,
          street_name: this.manualPolyline.street_name,
          street_number: this.manualPolyline.street_number,
          polyline_id: this.manualPolyline.line_id,
          manual_association_id: this.manualPolyline.id
        }

        this.dialog = true
      } catch (e) {
        this.$helper.snackbar(e, 'showInfo')
      }
    },
    async viewManualAssociate () {
      try {
        this.loading = true
        const response = await this.$polygonLinesService.viewManualAssociation({
          filter: this.filter,
          ...this.pagination
        })
        this.items = response?.items
        this.totalItems = response?.total
        this.loading = false
      } catch (e) {
        this.loading = false
        this.$helper.snackbar(e, 'viewManualAssociate')
      }
    },
    async selectPolygon () {
      try {
        if (!this.polygon_uid) {
          return
        }

        this.polylines = await this.$polygonLinesService.list({ polygon_uid: this.polygon_uid })
      } catch (e) {
        this.$helper.snackbar(e, 'selectPolygon')
      }
    },
    submitted (data) {
      if (!data.status) {
        return
      }

      const message = this.manualPolyline?.id ? 'שיוך קו ידני עודכן בהצלחה' : 'שיוך קו ידני נוצר בהצלחה'
      this.dialog = false
      this.$store.commit('setSnackbar', {
        value: true,
        message,
        success: true
      })
      return this.viewManualAssociate()
    }
  },
  head: { title: 'שיוך קווים ידני' }
}
</script>

<style lang="scss" scoped>
::v-deep {
  .section-layout-header {
    padding-right: 0 !important;
  }

  .filter-ui .inputs-container {
    margin-bottom: 0 !important;
  }

  .filter-ui .inputs-container .row .col-10 .row .col {
    padding-right: 10px !important;
    .v-input {
      margin-right: 0 !important;
    }
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

    .late-delivery {
      background-color: red !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .late-delivery:hover {
      background-color: darken(red, 10%) !important;
      color: white !important;
      i {
        color: white !important;
      }
    }

    .v-data-footer__select .v-select {
      .v-input__control {
        width: 70px !important;
      }
    }
  }
}
</style>
