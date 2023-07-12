<template>
  <div class="notifications">
    <v-menu v-model="menuOpen" :close-on-content-click="false" transition="slide-y-transition" rounded="0">
      <template #activator="{ on, attrs }">
        <button class="btn-icon" v-bind="attrs" v-on="on">
          <i class="icon icon-bell" />
        </button>
      </template>

      <MenuCardUi v-model="menuOpen" icon="bell">
        <template #top>
          <p class="text-white" v-text="'התראות מערכת'" />

          <p class="text-ping">
            <span v-text="'23'" />
            <span class="text-gray" v-text="'התראות שלא נקראו'" />
          </p>
        </template>

        <v-list>
          <v-list-item-group v-model="selected" active-class="pink--text" multiple>
            <template v-for="(item, index) in items">
              <v-list-item :key="index">
                <template #default="{ active }">
                  <v-list-item-action>
                    <v-checkbox :input-value="active" />
                  </v-list-item-action>

                  <v-list-item-avatar size="50">
                    <v-img :alt="`${item.name} avatar`" :src="item.avatar" />
                  </v-list-item-avatar>

                  <v-list-item-content>
                    <v-list-item-title v-text="item.name" />

                    <v-list-item-subtitle v-text="item.subtitle" />
                  </v-list-item-content>

                  <div class="driver-management-state">
                    <v-progress-linear reverse value="15" />
                    <div class="driver-management-state-info">
                      <p v-text="'30 ד` | 5/18'" />
                    </div>
                  </div>
                </template>
              </v-list-item>

              <v-divider v-if="index < items.length - 1" :key="index" />
            </template>
          </v-list-item-group>
        </v-list>
      </MenuCardUi>
    </v-menu>
  </div>
</template>

<script>
export default {
  name: 'Notifications',

  data () {
    return {
      menuOpen: false,
      selected: [2],
      search: '',
      items: [
        {
          avatar: 'https://cdn.vuetifyjs.com/images/lists/1.jpg',
          name: 'יצחק בן ציון',
          subtitle: 'קטנוע'
        },
        {
          avatar: 'https://cdn.vuetifyjs.com/images/lists/1.jpg',
          name: 'יצחק בן ציון',
          subtitle: 'קטנוע'
        },
        {
          avatar: 'https://cdn.vuetifyjs.com/images/lists/1.jpg',
          name: 'יצחק בן ציון',
          subtitle: 'קטנוע'
        },
        {
          avatar: 'https://cdn.vuetifyjs.com/images/lists/1.jpg',
          name: 'יצחק בן ציון',
          subtitle: 'קטנוע'
        },
        {
          avatar: 'https://cdn.vuetifyjs.com/images/lists/1.jpg',
          name: 'יצחק בן ציון',
          subtitle: 'קטנוע'
        }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.notifications{
  margin-left: auto;

  p {
    margin-bottom: 0;
  }
}
.text-ping{
  font-size: .8rem;

  .text-gray{
    font-size: .7rem;
  }

  &:before{
    content: '';
    display: inline-flex;
    width: 8px;
    height: 8px;
    margin-left: .3rem;
    margin-bottom: .1rem;
    background-color: #fa4616;
    border-radius: 50px;
  }
}
</style>
