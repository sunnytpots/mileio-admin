<template>
  <SectionLayout title="פוליגונים" :route-back="{ name: 'settings' }" classes="settings-polygons">
    <CardUi padding-body-sm>
      <v-container>
        <v-row class="no-gutters-y">
          <v-col md="3" lg="3" xl="3">
            <div class="settings-polygons-create">
              <div class="polygons-header">
                <n-link :to="{ name: 'settings-polygons' }" class="btn-icon">
                  <i class="icon icon-close" />
                  <span v-text="'חזור'" />
                </n-link>
              </div>

              <div class="polygons-body">
                <h2 class="polygons-page-title" v-text="'יצירת פוליגון חדש'" />
                <FormUi :form="form" store="polygons" dispatch="createOrUpdate" :route-to="{ name: 'settings-polygons' }" no-btn>
                  <div class="polygon-card">
                    <v-text-field v-model="form.name" label="שם פוליגון" />
<!--                    <v-autocomplete v-model="form.exit_number_id" :items="exits" label="שיוך ליציאה" item-value="id" item-text="exit_number" />-->
                    <div class="row align-baseline">
                      <div class="col-lg-8">
                        <v-autocomplete
                          v-model="form.branch_id"
                          clearable
                          :items="branches"
                          label="שיוך לסניף"
                          item-value="id"
                          item-text="name" />
                      </div>

                      <div class="col-lg-4">
                        <v-btn class="btn-primary btn-sm" type="submit" :loading="loading">
                          שמירה
                        </v-btn>
                      </div>
                    </div>
                  </div>

                  <div v-if="polygonDrawn" class="polygons-lines">
                    <div class="polygons-lines-header">
                      <h2 v-text="'רשימת קווים'" />

                      <button class="btn-link btn-primary" @click.prevent="addLine" v-text="'הוספת קו חדש'" />
                    </div>

                    <div class="polygons-lines-body">
                      <div v-for="(line, index) of form.lines" :key="index" class="polygon-line-card">
                        <div class="polygon-line-title">
                          <v-text-field v-model="line.line_number" />
                        </div>

                        <v-text-field v-model="line.name" class="line-name" />

                        <button v-if="line.edit" class="btn-icon btn-primary" @click.prevent="line.edit = false">
                          <i class="icon icon-edit" />
                          <span v-text="'save'" />
                        </button>

                        <button v-else class="btn-icon btn-primary" @click.prevent="onEdit(index)">
                          <i class="icon icon-edit" />
                          <span v-text="'עריכה'" />
                        </button>
                      </div>
                    </div>
                  </div>
                </FormUi>
              </div>
            </div>
          </v-col>

          <v-col md="9" lg="9" xl="9">
            <GoogleMap :position="positionMap" :zoom="11">
              <template v-for="polygon of polygons">
                <GMapPolygon
                  :key="polygon.id"
                  :value="polygon.lat_lng"
                  parent
                  color="black" />
              </template>

              <GMapDrawingManager
                v-if="!polygonDrawn"
                v-model="form.lat_lng"
                parent
                @drawn="polygonDrawn = true" />

              <GMapPolygon
                v-if="polygonDrawn"
                v-model="form.lat_lng"
                parent
                edit>
                <template v-for="(line, index) of form.lines">
                  <GMapDrawingManager
                    v-if="!line.lat_lng.length"
                    :key="index"
                    v-model="line.lat_lng"
                    inside
                    child
                    @drawn="onSubPDrawn"/>
                  <GMapPolygon
                    v-if="line.lat_lng.length"
                    :key="index"
                    v-model="line.lat_lng"
                    :options="{ zIndex: 1 }"
                    color="blue"
                    inside
                    child
                    :edit="line.edit"/>
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
  name: 'SettingsPolygonsCreate',

  async fetch ({ store }) {
    await store.dispatch('global/getBranches')
    await store.dispatch('global/getExits')
    await store.dispatch('polygons/get')
  },

  data () {
    return {
      positionMap: { lat: 32.15048447177927, lng: 34.96304919382533 },

      loading: false,
      polygonDrawn: false,
      subPolygonDrawn: false,
      subPolygonShow: false,

      form: {
        name: '',
        branch_id: null,
        lat_lng: [],
        lines: []
      }
    }
  },

  computed: {
    ...mapState('global', ['branches', 'exits']),
    ...mapState('polygons', ['polygons'])
  },

  methods: {
    addLine () {
      this.form.lines.forEach((line, i) => line.edit = false)

      this.form.lines.push({
        name: '',
        line_number: '',
        lat_lng: [],
        edit: true
      })

      this.subPolygonDrawn = true
    },

    onEdit (index) {
      this.form.lines.forEach((line, i) => line.edit = index === i)
    },

    onSubPDrawn () {
      this.subPolygonDrawn = false
      this.subPolygonShow = true
    }
  }
}
</script>

<style lang="scss" scoped>
.settings-polygons-create{
  background-color: #F7F7F7;
  border: 1px solid #D7D7D7;
  border-radius: 15px;
}
.polygons-header{
  padding: .9rem 1.7rem 2.8rem;

  .btn-icon {
    display: inline-flex;
  }
}
.polygons-body{
  padding: 1rem 1.7rem 5rem;
}

::v-deep{
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
    margin: 0 -.7rem 1.25rem;

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

.polygons-lines{
  margin: 0 -.7rem;
}
.polygons-lines-header{
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  h2{
    font-weight: normal;
    font-size: 1.3rem;
  }

  .btn-link {
    font-size: .8rem;
  }
}
</style>
