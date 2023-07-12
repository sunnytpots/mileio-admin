<template>
  <SectionLayout title="שיוכים" :route-back="{ name: 'settings' }">
    <CardUi padding-header>
      <template v-if="$hasPermission('settings-associations', 'edit')" #header>
        <button class="btn-icon mr-auto btn-primary" @click.prevent="addNewParent">
          <i class="icon icon-plus-ping" />
          <span v-text="'יצירת שיוך חדש'" />
        </button>
      </template>

      <TreeUi
        :items="associations"
        :can-edit="$hasPermission('settings-associations', 'edit')"
        @add-item="addItem"
        @edit-parent="editParent"
        @delete-item="deleteItem"
        @delete-parent="deleteParent"
      />
    </CardUi>

    <DialogUi v-model="drawerUi" sm>
      <FormUi v-if="association" :form="association" url="url-for-save" no-btn name="association">
        <v-text-field v-model="association.title" label="מפתח" />

        <v-btn class="btn-primary" @click.prevent="submit">
          שמור
        </v-btn>
      </FormUi>
    </DialogUi>
  </SectionLayout>
</template>

<script>
import Vue from 'vue'

export default {
  name: 'SettingsAssociations',
  middleware: ['permissions'],

  data () {
    return {
      drawerUi: false,

      headers: [
        { title: 'Id' },
        { title: 'רמה' },
        { title: 'אפשרויות', classes: 'text-left' }
      ],

      association: null,
      associations: [
        {
          title: 'סוגי משלוח',
          children: [
            {
              title: 'רגיל',
              children: []
            },
            {
              title: 'כפול',
              children: [
                { title: 'שודר' },
                { title: 'נאסף' }
              ]
            },
            {
              title: 'גוביינא',
              children: []
            },
            {
              title: 'משלוח דואר ישראל',
              children: []
            }
          ]
        },
        {
          title: 'סוג טלפון',
          children: [
            {
              title: 'רגיל',
              children: []
            }
          ]
        }
      ]
    }
  },
  methods: {
    addNewParent () {
      this.associations.push({ title: 'New item', children: [{ title: '', children: [] }] })
    },

    deleteParent (index) {
      this.associations.splice(index, 1)
    },

    addItem (item, withChildren = null) {
      if (item.children) {
        if (withChildren) {
          item.children.push({ title: '', children: [] })
        } else {
          item.children.push({ title: '' })
        }
      } else {
        Vue.set(item, 'children', [])
        this.addItem(item)
      }
    },

    editParent (item) {
      this.association = item
      this.drawerUi = true
    },

    deleteItem (payload) {
      payload.itemParent.children.splice(payload.index, 1)
    },

    submit () {
      this.drawerUi = false
      this.$nuxt.$emit('formSubmit', 'association')
    }
  },
  head: { title: 'שיוכים' }
}
</script>

<style lang="scss" scoped>

</style>
