<template>
  <section :class="'block ' + dynamicClass">
    <div class="block-titles">
      <h5>{{ title }}</h5>
      <h6>{{ subTitle }}</h6>
    </div>
    <div class="block-values">
      <span class="value-area">
        {{ value }}
      </span>
      <span
        v-if="value2"
        class="value2-area">
        {{ value2 }}
      </span>
      <span
        v-if="stars || stars === '0'"
        class="stars">
        <i
          v-for="star in 4"
          :key="star">
          <i
            v-if="star <= Math.round(stars)"
            class="icon icon-star-full" />
          <i
            v-else
            class="icon icon-star-empty" />
        </i>
      </span>
    </div>
  </section>
</template>

<script>

export default {
  name: 'StatisicsbarBlock',
  props: {
    title: { type: String, default: null },
    subTitle: { type: String, default: null },
    value: { type: [Number, String], default: null },
    value2: { type: String, default: null },
    typeProp: { type: String, default: null },
    stars: { type: [Number, String], default: null }
  },
  computed: {
    dynamicClass () {
      switch (this.typeProp) {
        case '1':
          return 'block1'
        case '2':
          return 'block2'
        case '3':
          return 'block3'
        case '4':
          return 'block4'
        default:
          return 'className'
      }
    },
    starsIcon () {
      if (this.stars) { return '⭐'.repeat(Math.round(this.stars)) + '☆'.repeat(Math.round(4 - this.stars)) }
      return null
    }
  }

}
</script>

<style scoped lang="scss">
.block1{
  span{
    color: #34C05B;
  }
}
.block2{
  span{
    color: #F25656 ;
  }
}
.block3 {
  display: flex;
  .value2-area {
    flex: 2;
    position: relative;
    color: #6D7A84;
    padding-right: 20px;
    font-size: 41px;
    margin-right: 20px;
    font-weight: 400;
    line-height: 41px;
  }

  .value2-area:after {
    flex: 1;
    content: '';
    height: 60%;
    width: 1px;
    position: absolute;
    right: 0;
    top: 0;
    background-color: #6D7A84;
  }
}
.block4 {
  span {
    display: flex;
  }

  .block-values {
    .value2-area {
      margin-right: 7px;
      align-self: center;
      margin-bottom: 5px;
      font-weight: 400;
      line-height: 41px;
    }
  }
}
.block {
  font-family: 'Rubik';
  display: flex;
  flex-direction: column;
  width: 370px;
  height: 140px;
  background-color: #FAFBFB;
  border-radius: 8px;
  margin: 5px;

  .block-titles {
    color: #6D7A84;
    margin-right: 40px;
    padding-top: 16px;
    flex: 1;

    h5 {
      font-size: 22px;
      font-weight: 400;
      line-height: 22px;
    }

    h6 {
      margin-top: 5px;
      font-size: 14px;
      font-weight: 400;
      line-height: 14px;
    }
  }

  .block-values {
    display: flex;
    flex: 1;
  }

  .value-area {
    flex: 2;
    margin-right: 40px;
    padding-top: 5px;
    font-size: 41px;
    font-weight: bold;
    line-height: 41px;
  }
  .stars {
    flex: 7;
    width: 100%;
    padding-top: 0px;
    gap: 20px;
    .icon {
      height: 40px;
      width: 40px;
    }
  }
}
</style>
