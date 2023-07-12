<template>
  <transition name="drawerUi" :enter-active-class="enter" :leave-active-class="leave">
    <div v-if="drawerUi" class="drawer-ui">
      <div class="drawer-ui-bg" @click="close" />

      <div class="drawer-ui-shell">
        <button class="drawer-ui-close" @click.prevent="close">
          <i class="icon icon-error" />
          <span v-text="'סגור'" />
        </button>

        <div class="drawer-ui-header">
          <div class="row no-gutters-y align-center">
            <div class="col-md-8">
              <v-tabs v-if="showTabs" :value="value" @change="$emit('input', $event)">
                <v-tabs-slider />
                <v-tab v-for="(tab, index) of tabs" :key="index" nuxt :to="tab.to">
                  {{ tab.title }}
                </v-tab>
              </v-tabs>
              <h3 v-if="title" class="sideTitle">{{ title }}</h3>
            </div>

            <div class="col-md-4 justify-end d-flex">
              <slot name="header" />
            </div>
          </div>
        </div>

        <div class="drawer-ui-body">
          <v-row>
            <v-col v-if="$slots.aside" cols="3" class="drawer-ui-aside">
              <slot name="aside" />
            </v-col>

            <v-col :cols="$slots.aside ? 9 : 12" class="drawer-ui-content">
              <slot />
            </v-col>
          </v-row>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'DrawerUi',

  props: {
    value: { type: [Object, String], default: null },
    showTabs: { type: Boolean, default: true },
    title: { type: String, default: null },
    tabs: { type: Array, default: () => ([]) }
  },

  data () {
    return {
      enter: 'animate__animated animate__faster animate__slideInLeft',
      leave: 'animate__animated animate__faster animate__slideOutLeft'
    }
  },

  computed: {
    ...mapState(['drawerUi'])
  },

  destroyed () {
    this.$store.commit('setDrawerUi', false)
  },

  methods: {
    close () {
      console.log('this.$route.matched', this.$route.matched)
      this.$store.commit('setDrawerUi', false)
      this.$router.push({ name: this.$route.matched[0].name })
      // this.$router.back()
    },
    showCurrentTab (tabKey) {
      console.log('tabKey', tabKey)
      return this.$hasPermission(tabKey, 'edit')
    }
  }
}
</script>

<style lang="scss" scoped>
.sideTitle{
  margin: 20px;
  color: #42aed0;
}
.drawer-ui{
  display: flex;
  justify-content: flex-end;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 5;

  .drawer-ui-bg{
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .drawer-ui-shell{
    width: 80.55rem;
    height: 100%;
    background-color: #fff;
    box-shadow: 0 0 15px 0 #00000078;
    position: relative;
    z-index: 5;
  }

  .drawer-ui-header{
    border-bottom: 1px solid #E4E4E4;
    padding-left: 12px;

    ::v-deep {
      .v-tab{
        font-size: 1rem;
        padding: 0 3rem;
      }
      .v-tab.v-tab--active{
        color: #fa4616;
      }
      .theme--light.v-tabs > .v-tabs-bar .v-tab:not(.v-tab--active){
        color: #fa4616;
      }
      .primary--text{
        caret-color: #fa4616 !important;
        color: #fa4616 !important;
      }
      .v-tabs-slider-wrapper{
        height: 4px !important;
      }
      .v-tabs-slider{
        background-color: #fa4616;
      }
      .v-tabs-bar{
        height: 51px;
      }
    }
  }

  .drawer-ui-close{
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background-color: #fff;
    position: absolute;
    top: 3.2rem;
    right: -3.7rem;
    padding: .9rem .9rem .6rem;
    border-radius: 0 5px 5px 0;
  }

  .drawer-ui-body{
    height: 100%;
    overflow-y: scroll;

    .row{
      height: 100%;
    }

    .drawer-ui-aside{
      padding: 2.7rem 1.5rem;
      text-align: center;
      border-left: 1px solid #E4E4E4;

      h4 {
        font-size: 1.3rem;
        margin-bottom: .9rem;
      }
      p {
        font-size: .8rem;
        margin-bottom: 0;
      }
    }

    .drawer-ui-content{
      padding: 1rem 1.5rem;
    }

    .contact-text{
      padding-top: 5rem;

      h4 {
        margin-bottom: .25rem;
        font-size: 1rem;
        color: #363636;
      }

      div{
        font-size: 1rem;
        color: #8A8888;
      }
    }
  }
}
</style>
