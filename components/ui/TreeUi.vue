<template>
  <ul :class="['tree-ui', { 'tree-ui-parent': !child, 'tree-ui-child': child }]">
    <li v-for="(item, index) of items" :key="index">
      <div class="tree-ui-block">
        <v-btn v-if="item.children && item.children.length" icon @click="onOpen(index)">
          <v-icon>{{ isOpen && index === indexOpen ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
        </v-btn>

        <div v-if="child" class="tree-ui-field">
          <div v-if="canEdit">
            <v-text-field v-model="item.title" outlined />

            <button class="btn-icon mr-3" @click.prevent="$emit('delete-item', { itemParent, index })">
              <i class="icon icon-delete-gray" />
            </button>

            <button v-if="item.children" class="btn-icon" @click.prevent="$emit('add-item', item)">
              <i class="icon icon-plus-circle" />
            </button>
          </div>

          <span v-else class="tree-ui-value" v-text="item.title" />
        </div>

        <div v-else class="tree-ui-field-parent">
          <span v-text="item.title" />

          <div v-if="canEdit" class="tree-ui-actions">
            <button v-if="item.children" class="btn-icon" @click.prevent="$emit('edit-parent', item)">
              <i class="icon icon-edit" />
            </button>

            <button class="btn-icon" @click.prevent="$emit('delete-parent', index)">
              <i class="icon icon-delete" />
            </button>
          </div>
        </div>
      </div>

      <v-expand-transition>
        <div v-show="isOpen && index === indexOpen">
          <TreeUi
            v-if="item.children"
            :can-edit="canEdit"
            :items="item.children"
            :item-parent="item"
            child
            @delete-item="$emit('delete-item', $event)"
            @add-item="$emit('add-item', $event)"
          />

          <div v-if="!child && canEdit" class="tree-ui-add-new">
            <button v-if="item.children" class="btn-icon" @click.prevent="$emit('add-item', item, true)">
              <i class="icon icon-plus-circle" />
              <span v-text="item.title" />
            </button>
          </div>
        </div>
      </v-expand-transition>
    </li>
  </ul>
</template>

<script>
export default {
  name: 'TreeUi',

  props: {
    items: { type: Array, default: () => ([]) },
    child: { type: Boolean, default: false },
    canEdit: { type: Boolean, default: true },
    itemParent: { type: Object, default: () => ({}) }
  },

  data () {
    return {
      indexOpen: null,
      isOpen: false
    }
  },

  methods: {
    onOpen (index) {
      if (this.indexOpen !== index) {
        this.isOpen = true
        this.indexOpen = index
      } else {
        this.indexOpen = index
        this.isOpen = !this.isOpen
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.tree-ui{
  list-style: none;
  padding: 0;
  margin: 0;

  li {
    &:before{
      content: '';
      display: block;
      width: 100%;
      height: 1px;
      background-color: #ebebeb;
      position: absolute;
      right: 0;
      left: 0;
    }
  }

  ::v-deep {
    .v-input__slot{
      margin-bottom: 0;
    }
    .v-text-field__details{
      display: none;
    }
    .v-input input{
      font-size: .8rem;
    }
    .v-text-field--outlined > .v-input__control > .v-input__slot {
      min-height: 39px;
    }
    .v-text-field--outlined.v-input--is-focused fieldset,
    .v-text-field--outlined.v-input--has-state fieldset,
    .v-text-field--outlined fieldset,
    .v-text-field--outlined fieldset{
      border: 1px solid #D7D7D7 !important;
    }
  }

  .tree-ui-value{
    font-size: .8rem;
  }
}
.tree-ui-parent{
  position: relative;
}
.tree-ui-parent > li > .tree-ui-block {
  background-color: #F6F6F6;
  padding: .4rem 2.5rem;
}
.tree-ui-field-parent{
  width: 100%;
  display: flex;

  span {
    margin-left: auto;
    color: #38A8CD;
    font-size: .9rem;
  }
}
.tree-ui-actions{
  display: flex;
}
.tree-ui-block{
  display: flex;
  align-items: center;
  height: 51.78px;
}
.tree-ui-child{
  padding-right: 3rem;
}
.tree-ui-child > li > .tree-ui-block {
  padding: .4rem 0;
}
.tree-ui-add-new{
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.1rem 0;
  border-top: 1px solid #ebebeb;
}
.tree-ui-field{
  display: flex;
  align-items: center;

  & > div {
    display: flex;
    align-items: center;
  }

  .v-input{
    width: 100%;
    max-width: 13.3rem;
  }
}
.v-text-field--outlined > .v-input__control > .v-input__slot{
  min-height: 39px;
}
.btn-icon{
  span {
    color: #f36;
    margin: .1rem .25rem 0;
  }
}
</style>
