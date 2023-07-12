<template>
  <div class="branches">
    <v-menu offset-y :disabled="disabled">
      <template #activator="{ on, attrs }">
        <v-btn v-ripple="false" class="btn-link" v-bind="attrs" v-on="on">
          {{ branchNameSelected }}
          <v-icon v-text="'mdi-chevron-down'" />
        </v-btn>
      </template>

      <v-list>
        <v-list-item-group v-model="branchSelected">
          <v-list-item v-for="(branch, index) in branches" :key="index" :value="branch">
            <v-list-item-title>{{ branch.name }}</v-list-item-title>
          </v-list-item>
        </v-list-item-group>
      </v-list>
    </v-menu>
  </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
  name: 'Branches',

  data () {
    return {
      selected: null,
      disabled: false
    }
  },

  computed: {
    ...mapState('auth', ['branches', 'branchSelected', 'branchNameSelected']),

    branchSelected: {
      get () {
        return this.$store.state.auth.branchSelected
      },
      set (branch) {
        this.$store.commit('auth/setBranchSelected', branch.id)
        this.$store.commit('auth/setBranchNameSelected', branch.name)
        // this.$store.dispatch('global/getDriverList', { filter: { branch_id: branch.id } })
      }
    }
  },

  watch: {
    $route: 'selectDefaultBranch'
  },

  mounted () {
    this.selectDefaultBranch()
  },
  methods: {
    selectDefaultBranch () {
      if (this.$route.name === 'customer-service') {
        this.disabled = true
        this.branchSelected = this.branches[0]
      } else {
        this.disabled = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.branches{
  margin-left: 1.2vw;

  .v-btn.theme--light.v-btn--has-bg.btn-link{
    color: #fff;
    font-size: 1rem;
  }
}
</style>
