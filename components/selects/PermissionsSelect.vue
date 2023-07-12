<template>
  <div class="permissions-select">
    <v-menu v-model="isOpen" offset-y open-on-focus :close-on-content-click="false" allow-overflow>
      <template #activator="data">
        <v-text-field v-model="search" label="Permissions" readonly :disabled="disabled" v-on="data.on" />
      </template>

      <div class="permissions-select-block">
        <v-expansion-panels accordion>
          <v-expansion-panel v-for="(item, index) of items" :key="index">
            <v-expansion-panel-header>
              <v-checkbox v-model="selected" :value="item.id" />
              <span class="panel-header-title" v-text="item.key + ' = ' + item.id" />
            </v-expansion-panel-header>

            <v-expansion-panel-content>
              <v-checkbox :input-value="findReadOnly(item.id)" label="Read only" disabled />

              <v-checkbox :input-value="findEditing(item.id)" label="Editing" :disabled="isDisabled(item.id)" @change="changeEditing($event, item.id)" />
            </v-expansion-panel-content>
          </v-expansion-panel>
        </v-expansion-panels>
      </div>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: 'PermissionsSelect',

  props: {
    value: { type: Array, default: () => ({}) },
    items: { type: Array, default: () => ({}) },
    level: { type: Number, default: null },
    disabled: { type: Boolean, default: false }
  },

  data () {
    return {
      isOpen: false,
      selected: [],
      search: ''
    }
  },

  watch: {
    selected (newSelected) {
      const valueNew = newSelected.map(id => ({
        permission_group_id: id,
        read_only: true,
        editing: false
      }))

      this.$emit('input', valueNew)
    },

    level () {
      if (this.value.length) {
        this.selected = this.value.map(val => val.permission_group_id)
      }
    },

    value (newValue) {
      const items = newValue.map(value => {
        const item = this.items.find(item => item.id === value.permission_group_id)
        return item.key
      })
      this.search = items.join(', ')
    }
  },

  methods: {
    isDisabled (id) {
      return this.selected.findIndex(valueId => valueId === id) === -1
    },

    changeEditing (event, id) {
      const value = this.value.find(value => value.permission_group_id === id)
      value.editing = event
    },

    findReadOnly (id) {
      const value = this.value.find(value => value.permission_group_id === id)
      return value && value.read_only
    },

    findEditing (id) {
      const value = this.value.find(value => value.permission_group_id === id)
      return value && value.editing
    }
  }
}
</script>

<style lang="scss" scoped>
.permissions-select-block{
  background-color: #fff;

  .panel-header-title{
    width: 100%;
  }

  ::v-deep{
    .v-messages{
      display: none;
    }
    .v-input--selection-controls{
      margin-top: 0;
    }
    .v-treeview-node__root{
      min-height: inherit;
    }

    .v-expansion-panels{
      display: inherit;
    }

    .v-input--selection-controls__ripple{
      display: none;
    }

    .v-expansion-panel-header{
      .v-input{
        padding-top: 0;
      }
      .v-input__slot{
        margin-bottom: 0;
      }
    }
  }
}
</style>
