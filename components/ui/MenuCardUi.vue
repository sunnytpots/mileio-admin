<template>
  <div :class="['menu-card-ui', { 'menu-card-ui-with-header': $slots.header }]">
    <div class="menu-card-header">
      <div class="menu-card-top">
        <div v-if="icon" class="icon-wrapper">
          <i :class="`icon icon-${icon}`" />
        </div>

        <div class="menu-card-top-info">
          <slot name="top" />
        </div>

        <button class="btn-close" @click.prevent="$emit('input', false)">
          <i class="icon icon-plus" />
        </button>
      </div>

      <slot name="header" />
    </div>

    <div class="menu-card-body">
      <slot />
    </div>
  </div>
</template>

<script>
export default {
  name: 'MenuCardUi',

  props: {
    value: { type: Boolean, default: false },
    icon: { type: String, default: '' }
  }
}
</script>

<style lang="scss" scoped>
.menu-card-ui{
  background-color: #fff;
  width: 21.6rem;

  .icon-wrapper{
    width: 46px;
    height: 46px;
    margin-left: 1.5rem;

    .icon{
      width: 22px;
    }
  }

  .btn-close{
    margin-bottom: auto;
    margin-right: auto;
    cursor: pointer;
  }

  .menu-card-top-info {
    margin-left: .9rem;

    p {
      margin-bottom: 0;
    }

    .text-white{
      margin-bottom: 0;
    }
    .text-green{
      font-size: .8rem;

      .text-gray{
        font-size: .7rem;
      }
    }
  }

  &.menu-card-ui-with-header{
    .menu-card-header{
      padding-bottom: 2.1rem;
    }
    .menu-card-top{
      margin-bottom: 1.7rem;
    }
  }
}

.menu-card-header{
  background-color: #2D3642;
  padding: .75rem 1.55rem;
}
.menu-card-top{
  display: flex;
  align-items: center;
}
.menu-card-body{
  overflow-y: scroll;
  height: 400px;
}
</style>
