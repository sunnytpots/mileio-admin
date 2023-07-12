<template>
  <div class="profile-nav">
    <v-menu v-model="menuOpen" offset-y :close-on-content-click="false">
      <template #activator="{ on, attrs }">
        <v-btn v-ripple="false" v-bind="attrs" v-on="on">
          <v-avatar size="36">
            <img src="https://cdn.vuetifyjs.com/images/john.jpg" alt="John">
          </v-avatar>

          <div class="driver-management-info">
            <p class="text-white" v-text="authUser && authUser.first_name + ' ' + authUser.last_name" />
          </div>

          <v-icon v-text="'mdi-chevron-down'" />
        </v-btn>
      </template>

      <v-list>
        <v-list-item-group v-model="activeList">
          <v-list-item v-for="(list, index) in lists" :key="index">
            <v-list-item-content>
              <v-list-item-title>{{ list.title }}</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'ProfileNav',

  data () {
    return {
      menuOpen: false,

      activeList: null,

      lists: [
        // { title: 'הגדרות חשבון', route: { name: 'coordinator' } },
        // { title: 'עדכון פרטים', route: { name: 'coordinator' } },
        { title: 'התנתקות מהמערכת', type: 'logout' }
      ]
    }
  },

  computed: {
    ...mapState('auth', ['authUser'])
  },

  watch: {
    async activeList (newActiveList) {
      const list = this.lists[newActiveList]
      // console.log(list, 'list')
      if (list && list.type === 'logout') {
        await this.$store.dispatch('auth/logout')
        this.$router.push({ name: 'login' })
      } else if (list.route) {
      } else if (list.route) {
        this.$router.push(list.route)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-nav{
  height: 100%;
  position: absolute;
  left: 10px;

  .v-btn{
    box-shadow: none;
    p {
      margin-bottom: 0;
      margin-left: .8rem;
    }
    .v-avatar{
      margin-left: .8rem;
    }
    &.theme--light.v-btn--has-bg{
      color: #fff;
      height: 100%;
      background-color: #324054;
      padding: 0 13px;
    }
  }
}
</style>
