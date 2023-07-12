<template>
  <div class="info-panel">
    <v-container>
      <v-row>
        <v-col>
          <div :class="['widgets', { 'widgets-opacity': widgetsLoading }]">
            <v-progress-circular
              v-if="widgetsLoading"
              style="position: absolute"
              :width="3"
              color="green"
              indeterminate />
            <div
              v-for="(widget, index) of widgets"
              :key="index"
              :class="{
                'activeWidget' : isWidgetActive[widget.key],
                'coordinator-widget': true,
                'widgetNotClickable': !widgetClickable || widget.specificNotClickable
              }"
              @click="(widgetClickable && !widget.specificNotClickable) ? filterByWidget(widget) : null">
              <v-tooltip v-if="!widget.specificNotClickable" bottom>
                <template v-slot:activator="{ on, attrs }">
                  <h3
                    v-bind="attrs"
                    v-on="on"
                    v-text="widget.title"/>
                  <p
                    v-bind="attrs"
                    v-on="on"
                    v-text="widget.value"/>
                </template>
                <span>סנן לפי {{ widget.title }}</span>
              </v-tooltip>
              <template v-else>
                <h3 v-text="widget.title"/>
                <p v-text="widget.value"/>
              </template>
            </div>
          </div>
          <v-row v-if="showClearButton">
            <v-col :class="{'clear-filter-coordinator' : ['coordinator', 'coordinator-delivery', 'coordinator-logs'].includes($route.name)}">
              <small class="text-ping clear-filter" @click="widgetClickable ? clearWidgetFilter() : null">נקה סנן</small>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script>
export default {
  name: 'InfoPanel',

  props: {
    widgets: { type: Array, default: () => ([]) },
    widgetClickable: { type: Boolean, default: false },
    widgetsLoading: { type: Boolean, default: false },
    showClearButton: { type: Boolean, default: false }
  },
  data () {
    return {
      value: null,
      isWidgetActive: {}
    }
  },
  watch: {
    value: {
      handler (newFilter) {
        this.$emit('input', newFilter)
      },
      deep: true
    }
  },
  methods: {
    filterByWidget (item) {
      this.value = item.key
      if (this.isWidgetActive[item.key]) {
        this.clearWidgetFilter()
      } else {
        this.isWidgetActive = {}
        this.isWidgetActive[item.key] = true
      }
    },
    clearWidgetFilter () {
      this.isWidgetActive = {}
      this.value = null
    }
  }
}
</script>

<style lang="scss" scoped>
.info-panel{
  margin-bottom: 1.3rem;
}
.widgetNotClickable {
  cursor: auto !important;
}

.widgets{
  display: flex;
  margin-right: -12px;
  align-items: center;
  position: relative;
  justify-content: center;
  background: none;

  .activeWidget {
    border: 1px solid orange !important;
  }

  .widget {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex-grow: 1;
    //max-width: 8.3rem;
    padding: .9rem 0;
    background-color: #fff;
    border-left: 1px solid #DFDFDF;
    cursor: pointer;

    &:first-child {
      border-radius: 0 8px 8px 0;
    }

    &:last-child {
      border-left: none;
      border-radius: 8px 0 0 8px;
    }

    h3 {
      font-size: .85rem;
      margin-bottom: 1.2rem;
    }
    p {
      font-size: 1.5rem;
      margin-bottom: 1.4rem;
    }
  }

  .coordinator-widget {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
    //max-width: 8.3rem;
    padding: .9rem 0;
    background-color: #fff;
    border: 1px solid #DFDFDF;
    cursor: pointer;
    margin: auto 8.5px;
    border-radius: 8px;

    h3 {
      text-align: center;
      font-size: 17px;
      font-weight: normal;
    }

    p {
      margin: 16px auto 0 auto;
      font-size: 35px;
      text-align: center;
    }
  }

  .widget-clicked {
    opacity: .5;
    position: absolute;
  }
}

.table-widgets{
  margin-left: -12px;

  .container {
    padding: 0;
  }
}

.terminal-widget{
  background-color: #22272E;
  border-radius: 0 8px 8px 0;
  min-height: 100%;

  .container{
    padding: 0;
  }

  .row{
    margin-top: 0;
    &:first-child {
      border-bottom: 1px solid #464646;
    }
  }

  .col-6{
    padding: .6rem 1.2rem .4rem;
    &:first-child {
      border-left: 1px solid #464646;
    }
  }
  .col-12 {
    padding: .55rem 1.2rem .7rem;
  }
}

.label-name{
  color: #fff;
  font-weight: normal;
  font-size: 1.3rem;
  margin-bottom: .15rem;
}
.shipping-number{
  color: #00FFFC;
  font-size: .7rem;
  margin-bottom: 0;
}
.recipient-notes{
  color: #FFFFFF;
  font-size: .8rem;
  font-weight: normal;
  margin-bottom: .3rem;
  max-width: 25rem;
}
.recipient-notes-value{
  margin-bottom: 0;
  color: #a5a6a6;
  //font-weight: bolder;
  font-size: .7rem;
}

.logs-widget{
  background-color: #333942;
  border-radius: 8px 0 0 8px;
  border-right: 1px solid #656565;
  padding: .77rem .9rem;

  .logs-widget-title{
    color: #fff;
    font-size: .8rem;
    font-weight: normal;
    margin-bottom: .4rem;
  }

  .log-widget{
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #656565;
    padding: .36rem 0;

    &:last-child{
      padding-bottom: 0;
    }

    p {
      margin-bottom: 0;

      &:first-child {
        font-size: .7rem;
        color: #A5A6A6;
        display: flex;
        align-items: center;

        &:before{
          content: '';
          width: 4px;
          height: 4px;
          border-radius: 50px;
          background-color: #00FFFC;
          margin-left: .4rem;
        }
      }

      &:last-child {
        color: #9A9A9A;
        font-size: .6rem;
      }
    }
  }
}

.widgets-opacity{
  opacity: .5;
}
</style>
