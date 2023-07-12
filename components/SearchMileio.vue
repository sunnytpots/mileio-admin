<template>
  <div class="search-mileio">
    <v-text-field v-model="search" placeholder="חיפוש" outlined>
      <template #append>
        <button class="btn-search" @click.prevent="onSearch" v-text="'חיפוש'" />
      </template>
    </v-text-field>
  </div>
</template>

<script>
export default {
  name: 'SearchMileio',

  data () {
    return {
      search: ''
    }
  },

  methods: {
    onSearch () {
      // console.log('onSearch')
    }
  }
}
</script>

<style lang="scss" scoped>
.search-mileio{
  margin-left: 6rem;

  ::v-deep{
    .v-input{
      width: 38.3rem;
      background-color: #e0e3e7;
    }
    .v-text-field--outlined{
      border-radius: 8px;
    }
    .v-text-field.v-text-field--enclosed:not(.v-text-field--rounded) > .v-input__control > .v-input__slot {
      padding-left: 0;
    }
    .v-input__slot{
      margin-bottom: 0;
    }
    .v-text-field__details{
      display: none;
    }
    .v-input__append-inner{
      margin-top: 0;
    }
    fieldset{
      border: none;
    }
  }

  .btn-search{
    min-height: 56px;
    background-color: #fa4616;
    color: #fff;
    border-radius: 8px 0 0 8px;
    font-size: .8rem;
    padding: 0 2.2rem;
  }
}
</style>
