<template>
  <v-autocomplete
    v-model="tags"
    :items="tagList"
    chips
    clearable
    label="תגיות"
    multiple
    solo>
    <template v-slot:selection="selection">
      <v-chip
        v-bind="selection.attrs"
        :input-value="selection.selected"
        close
        color="rgb(239 230 230)"
        @click="selection.select"
        @click:close="removeTag(selection.item)">
        <label>{{ selection.item && selection.item.text }}</label>
      </v-chip>
    </template>
  </v-autocomplete>
</template>

<script>

export default {
  name: 'TagsUi',
  props: {
    tagList: { type: Array, default: () => ([]) },
    value: { type: Array, default: () => ([]) }
  },
  data () {
    return {
      tags: []
    }
  },
  watch: {
    tags: {
      handler (newTags) {
        this.$emit('input', newTags)
      },
      deep: true
    }
  },
  created () {
    this.tags = this.value || this.tags
  },
  methods: {
    removeTag (item) {
      this.tags && this.tags.splice(this.tags.indexOf(item), 1)
    }
  }
}
</script>

<style lang="scss" scoped>
.date-filter{
  display: flex;
  align-items: center;
  justify-content: center;

  p {
    margin-bottom: 0;
  }

  & > * {
    margin-left: 1rem;
    &:last-child {
      margin-left: 0;
    }
  }

  ::v-deep {
    .v-input{
      margin-top: 0;
      padding: 0;
      font-size: .86rem;

      input {
        color: #777777;
      }

      .v-input__append-inner {
        margin-left: 0 !important;
      }
    }
    .v-input__slot{
      margin-bottom: 0;
    }
    .v-text-field__details{
      display: none;
    }
  }
}
.date-filter-title{
  margin-bottom: 0;
  font-size: .8rem;
  font-weight: 500;
}
.loading {
  opacity: .5;
}
</style>
