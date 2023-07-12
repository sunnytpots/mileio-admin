<template>
  <div
    :class="['polygon-card', { 'polygon-card-active': polygon.id === polygonActive.id }]"
    @click="onSelect">
    <div class="polygon-title">
      <h4 v-text="polygon.name" />
    </div>

    <h3 v-if="polygon.branch" v-text="polygon.branch.name" />
    <div class="polygon-action">
      <v-btn
        class="btn-secondary btn-edit"
        :loading="loading"
        @click.prevent="moveToPolygon">
        <i class="icon icon-pen" />
      </v-btn>

      <DeleteButton
        :url="`polygons/delete/${polygon.uuid}`"
        has-warning
        :warning-message="'האם אתה בטוח שברצונך למחוק פוליגון לקוח זה?'"
        @deleted="$emit('update:polygonDeleted', polygon)"/>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PolygonCard',
  props: {
    polygon: { type: Object, default: () => ({}) },
    polygonActive: { type: Object, default: () => ({}) }
  },

  data () {
    return {
      loading: false
    }
  },
  methods: {
    moveToPolygon () {
      this.loading = true
      return this.$router.push({ name: 'settings-polygons-polygon', params: { polygon: this.polygon.uuid } })
    },
    onSelect () {
      this.$emit('update:polygonActive', this.polygon)
    }
  }
}
</script>

<style lang="scss" scoped>
.polygon-card{
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  background-color: #F3F3F3;
  padding: .9rem 0 .9rem 1rem;
  border-radius: 12px;
  margin-bottom: .7rem;
  cursor: pointer;
  position: relative;

  .polygon-action * {
    display: inline-block;
  }

  .polygon-action  {
    position: absolute;
    left: 20px;
  }

  &.polygon-card-active{
    &:before{
      content: '';
      display: block;
      position: absolute;
      top: 0;
      bottom: 0;
      left: 0;
      right: 0;
      border: 2px solid #38A8CD;
      border-radius: 15px;
      //z-index: 1;
    }
  }

  h3 {
    font-weight: normal;
    font-size: 1.1rem;
    margin-left: auto;
    color: #38A8CD;
    flex-grow: 1;
  }

  h4 {
    margin: 0;
    line-height: 1;
    font-size: 1.5rem;
    font-weight: normal;
    text-transform: uppercase;
  }

  .polygon-title{
    display: flex;
    justify-content: center;
    align-items: center;
    min-width: 60px;
    width: auto;
    height: 52px;
    margin-left: 1.5rem;
    border-left: 1px solid #E1E1E1;
  }

  .btn-icon{
    margin-top: auto;
    margin-right: auto;
    font-size: .7rem;
    position: relative;
    z-index: 2;

    .icon {
      width: 16px;
    }
  }
}
</style>
