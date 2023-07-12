<template>
  <SectionLayout
    title="פוליגונים"
    :route-back="{ name: 'settings' }"
    classes="settings-polygons">
    <CardUi>
      <v-container>
        <v-row class="no-gutters-y">
          <v-col md="3" lg="3" xl="3">
            <div class="settings-polygons-polygon">
              <div class="polygons-header">
                <n-link :to="{ name: 'settings-polygons' }" class="btn-icon">
                  <i class="icon icon-close" />
                  <span v-text="'חזור'" />
                </n-link>
              </div>

              <div class="polygons-body">
                <FormUi
                  :form="form"
                  store="polygons"
                  dispatch="createOrUpdate"
                  no-btn
                  name="PolygonLineData">
                  <div class="settings-polygons-polygon-index">
                    <h2 class="polygons-page-title" v-text="'פוליגון'" />

                    <div class="polygon-card">
                      <div v-if="isEdit">
                        <v-text-field v-model="form.name" label="שם פוליגון" />

                        <div class="row align-baseline">
                          <div class="col-lg-8">
                            <v-autocomplete
                              v-model="form.branch_id"
                              clearable
                              :items="branches"
                              label="שיוך לסניף"
                              item-value="id"
                              item-text="name"/>
                          </div>
<!--                          <div class="col-lg-8">-->
<!--                            <v-autocomplete -->
<!--                              v-model="form.exit_number_id" -->
<!--                              :items="exits" -->
<!--                              label="שיוך ליציאה" -->
<!--                              item-value="id" -->
<!--                              item-text="exit_number" />-->
<!--                          </div>-->

                          <div class="col-lg-4">
                            <v-btn
                              class="btn-primary btn-sm"
                              type="submit"
                              :loading="loading">
                              שמירה
                            </v-btn>
                          </div>
                        </div>
                      </div>

                      <div v-else>
                        <div class="polygon-card-header">
                          <div class="polygon-title">
                            <p class="text-gray" v-text="'שם פוליגון'" />
                            <h3 v-text="polygon.name" />
                          </div>

                          <button class="btn-icon btn-primary" @click.prevent="isEdit = true">
                            <i class="icon icon-edit" />
                            <span v-text="'עריכה'" />
                          </button>
                        </div>
                        <div v-if="polygon.branch" class="polygon-card-body">
                          <p class="text-gray" v-text="'שיוך לסניף'" />
                          <h4 v-text="polygon.branch.name" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="polygons-list">
                    <ExportReport
                      report-type="polygons"
                      :filter="{polygon_uid: polygon.uuid}"/>

                    <div class="polygons-list-header">
                      <h2 v-text="'רשימת קווים'" />
                      <button
                        class="btn-link btn-primary"
                        @click.prevent="addLine"
                        v-text="'הוספת קו חדש'"/>
                    </div>

                    <v-btn
                      v-if="hasChanges"
                      class="btn-primary"
                      style="margin: auto 0 15px auto"
                      @click.prevent="onsubmit"
                      v-text="'שמור שינויים'"/>

                    <div class="polygons-list-body">
                      <v-data-table
                        :key="renderKey"
                        :items="form.lines"
                        :headers="headers"
                        :server-items-length="form.lines && form.lines.length"
                        :options.sync="linesOptions"
                        hide-default-footer
                        @click:row="onEdit">
                        <template v-slot:item.line_number="{ item }">
                          <p v-if="!item.edit" v-text="item.line_number"/>
                          <v-text-field v-else v-model="item.line_number"/>
                        </template>

                        <template v-slot:item.line_name="{ item }">
                          <p v-if="!item.edit" v-text="item.name"/>
                          <v-text-field v-else v-model="item.name"/>
                        </template>

                        <template v-slot:item.edit_line="{ item }">
                          <v-btn
                            v-if="!item.edit"
                            class="btn-secondary btn-edit"
                            :loading="loading"
                            @click.prevent="onEdit(item)">
                            <i class="icon icon-pen" />
                          </v-btn>

                          <v-btn
                            v-else
                            class="btn-primary btn-sm"
                            @click="turnOffEdit"
                            v-text="'סיים עריכה'"/>
                        </template>

                        <template v-slot:item.delete_line="{ item }">
                          <DeleteButton
                            v-if="!lineIsEdit"
                            :url="`polygon-lines/delete/${item.id}`"
                            has-warning
                            api-method="$post"
                            @deleted="refreshPage"/>
                        </template>
                      </v-data-table>
                    </div>
                  </div>
                </FormUi>
              </div>
            </div>
          </v-col>

          <v-col md="9" lg="9" xl="9">
            <GoogleMap :position="polygon.lat_lng && polygon.lat_lng[0]" :zoom="10">
              <template v-for="polygonItm of polygons">
                <GMapPolygon
                  v-if="polygonItm.uuid !== polygon.uuid"
                  :key="polygonItm.id"
                  :value="polygonItm.lat_lng"
                  parent
                  color="black"/>
              </template>

              <GMapPolygon v-model="form.lat_lng" parent :edit="isEdit">
                <template v-for="(line, index) of form.lines">
                  <GMapDrawingManager
                    v-if="line.lat_lng && !line.lat_lng.length && line.id === undefined"
                    :key="index"
                    v-model="line.lat_lng"
                    inside
                    child
                    @drawn="onSubPDrawn"/>

                  <GMapPolygon
                    v-else
                    :key="index"
                    v-model="line.lat_lng"
                    :options="{ zIndex: 2 }"
                    :edit="line.edit"
                    inside
                    child
                    color="blue"
                    @click="onEdit(line)"/>
                </template>
              </GMapPolygon>
            </GoogleMap>
          </v-col>
        </v-row>
      </v-container>
    </CardUi>
  </SectionLayout>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'SettingsPolygonsPolygon',
  async fetch ({ store, params }) {
    try {
      await store.dispatch('global/getBranches')
      await store.dispatch('global/getExits')
      await store.dispatch('polygons/get')
      await store.dispatch('polygons/show', params.polygon)
    } catch (e) {
      this.$helper.snackbar(e, 'fetch error')
    }
  },

  data () {
    return {
      hasChanges: false,
      linesOptions: {},
      renderKey: true,
      isEdit: false,
      lineIsEdit: false,
      loading: false,

      form: {
        name: '',
        branch_id: '',
        lat_lng: [
          // { lat: 32.07192548104319, lng: 35.079360057812515 },
          // { lat: 32.060545888784766, lng: 34.83927827070314 },
          // { lat: 32.297919687023644, lng: 34.95075898359376 }
        ],

        lines: []
      },
      tempLines: []
    }
  },

  computed: {
    ...mapState('global', ['branches', 'exits']),
    ...mapState('polygons', ['polygons', 'polygon', 'status']),

    headers () {
      const arr = [
        { text: 'מספר קו', align: 'center', value: 'line_number', sortable: false },
        { text: 'שם קו', align: 'center', value: 'line_name', sortable: false },
        { text: '', align: 'center', value: 'edit_line', sortable: false },
        { text: '', align: 'center', value: 'delete_line', sortable: false }
      ]
      return arr
    }
  },

  watch: {
    linesOptions: {
      handler (newOptions, oldOptions) {
        console.log('newOptions', newOptions)
        const { sortBy, sortDesc } = newOptions
        this.form.lines = this.form.lines.sort((a, b) => {
          let sortA
          let sortB
          switch (sortBy[0]) {
            case 'line_name':
              sortA = a.name
              sortB = b.name
              break
            case 'line_number':
              sortA = a.line_number
              sortB = b.line_number
              break
          }

          if (sortDesc[0]) {
            return sortA < sortB ? 1 : sortA > sortB ? -1 : 0
          } else {
            return sortA < sortB ? -1 : sortA > sortB ? 1 : 0
          }
        })
      },
      deep: true
    },
    status (newStatus) {
      if (newStatus) {
        this.isEdit = false
        this.$store.commit('setSnackbar', { value: true, message: 'נשמר בהצלחה', success: true })

        this.form.lines = this.polygon.lines.map(line => ({
          id: line.id,
          name: line.name,
          line_number: line.line_number,
          lat_lng: line.lat_lng,
          edit: false
        }))
      }
    }
  },

  created () {
    if (this.polygon.id) {
      console.log(this.polygons, 'polygons')
      this.form.uuid = this.polygon.uuid
      this.form.name = this.polygon.name
      this.form.branch_id = this.polygon?.branch?.id
      this.form.branch_id = this.polygon?.branch?.id
      // this.form.exit_number_id = this.polygon.exit_number_id

      this.polygon.lat_lng && (this.form.lat_lng = this.polygon.lat_lng)

      this.form.lines = this.polygon.lines.map(line => ({
        id: line.id,
        name: line.name,
        line_number: line.line_number,
        lat_lng: line.lat_lng,
        edit: false
      }))
    }
  },
  methods: {
    refreshPage () {
      window.location.reload()
    },
    onsubmit (item) { // every component call different function
      console.log('onsubmit', item)
      this.loading = true
      let cancelSave = false
      this.form.lines.forEach(line => {
        cancelSave = this.form.lines.some(otherLine => otherLine.id !== line.id &&
          (otherLine.line_number === line.line_number || otherLine.name === line.name))
      })
      if (cancelSave) {
        console.log('cancelSave', cancelSave)
        this.$store.commit('setSnackbar', { value: true, message: 'לא ניתן לשמור שדות עם נתונים זהים', error: true })
        return
      }
      this.$nuxt.$emit('formSubmit', 'PolygonLineData') // submit to function from child comp
      this.loading = false
      this.hasChanges = false
    },
    onSubPDrawn () {
      // this.subPolygonDrawn = false
      // this.subPolygonShow = true
    },
    addLine () {
      this.form.lines.forEach((line, i) => line.edit = false)
      this.form.lines.push({
        name: '',
        line_number: '',
        lat_lng: [],
        edit: true
      })
      this.lineIsEdit = true
      // this.subPolygonDrawn = true
    },
    onEdit (item) {
      const lineId = item.id
      console.log('onEdit', lineId)
      this.form.lines.forEach(line => line.edit = lineId === line.id)
      this.lineIsEdit = true
      this.renderKey = !this.renderKey
    },
    turnOffEdit () {
      this.hasChanges = true
      this.form.lines.forEach(line => line.edit = false)
      this.lineIsEdit = false
      this.renderKey = !this.renderKey
    }
  }
}
</script>

<style lang="scss" scoped>
.btn-edit {
  width: 25px !important;
  height: 25px !important;
}
.polygon-card-body{
  margin-top: 15px;
  margin-bottom: 15px;
}
.settings-polygons-polygon{
  background-color: #F7F7F7;
  border: 1px solid #D7D7D7;
  border-radius: 15px;
}
.polygons-header{
  padding: .9rem 1.7rem 2.8rem;
}
.polygons-body{
  //padding: 1rem 1.7rem 5rem;
}
::v-deep{
  .section-layout-body {
    .col-12 {
      padding: 0;
    }
  }
  .v-data-table__wrapper {
    overflow-y: scroll;
    max-height: 400px;
  }
  .export-btn .col-2 {
    padding-right: 0 !important;
  }
  .polygons-page-title{
    font-weight: normal;
    margin: 0 0 .4rem;
    color: #38A8CD;
    text-align: center;
    font-size: 1.1rem;
  }
  .polygon-card{
    border: 1px solid #D7D7D7;
    background-color: #fff;
    border-radius: 10px;
    padding: 1.1rem 1rem 1.4rem;
    margin-bottom: 1.25rem;

    h4 {
      color: #22272E;
      font-weight: normal;
    }
  }
  .polygon-card-header{
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.4rem;

    .btn-icon{
      font-size: .7rem;
    }
    .icon {
      width: 15px;
      height: 15px;
    }
  }
  .polygon-title{
    h3 {
      color: #22272E;
      font-size: 1rem;
      font-weight: normal;
    }
  }
  .text-gray{
    color: #949AA1;
    margin-bottom: .2rem;
    font-size: .7rem;
  }
}

.polygons-list-header{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h2{
    font-weight: normal;
    font-size: 1.3rem;
  }

  a {
    font-size: .8rem;
    color: #fa4616;
  }
}
</style>
