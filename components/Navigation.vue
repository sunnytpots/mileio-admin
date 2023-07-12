<template>
  <div class="navigation d-print-none" >
    <v-navigation-drawer v-model="drawer" permanent>
      <div class="navigation-header">
        <CreateRouteButton />
      </div>

      <div class="navigation-body">
        <v-treeview
          :items="linksFiltered"
          transition
          open-on-click
          hoverable
          rounded>
          <template #prepend="{ item }">
            <i v-if="item.icon" :class="['icon', item.icon]" />
          </template>

          <template #label="{ item }">
            <div @click.prevent="onRow(item)">
              <a
                v-if="item.children"
                href="#"
                v-text="item.title" />
              <n-link
                v-else
                :to="item.to"
                v-text="item.title" />
            </div>
          </template>
        </v-treeview>
      </div>
    </v-navigation-drawer>
  </div>
</template>

<script>
export default {
  name: 'Navigation',

  data () {
    return {
      drawer: true,

      links: [
        {
          id: 1,
          title: 'דאשבורד',
          key: 'coordinator',
          to: { name: 'statistics' },
          icon: 'icon-dashboard'
        },
        {
          id: 2,
          title: 'רכז',
          key: 'coordinator',
          to: { name: 'coordinator' },
          icon: 'icon-document'
        },
        {
          id: 3,
          title: 'TA-BOX',
          icon: 'icon-points',
          key: 'distribution-points',
          children: [
            {
              title: 'רשימת TA-BOX',
              key: 'distribution-points-list',
              to: { name: 'distribution-points-list' },
              icon: 'icon-document'
            },
            {
              title: 'רכז TA-BOX',
              key: 'distribution-points-coordinator',
              to: { name: 'distribution-points-coordinator' },
              icon: 'icon-document'
            },
            {
              title: 'ניהול שק פיזורים',
              key: 'distribution-points-bags',
              to: { name: 'distribution-points-bags' },
              icon: 'icon-document'
            }
          ]
        },
        {
          id: 4,
          title: 'ניהול מחסן (WMS)',
          icon: 'icon-warehouse',
          key: 'warehouse-management',
          children: [
            {
              title: 'מסך סריקה',
              key: 'warehouse-management-scans',
              to: { name: 'warehouse-management-scans' },
              icon: ''
            }
          ]
        },
        {
          id: 5,
          title: 'זיכויים',
          icon: 'icon-square',
          key: 'refunds',
          children: [
            {
              title: 'רכז זיכויים',
              key: 'refunds-coordinator',
              to: { name: 'refunds-coordinator' },
              icon: ''
            },
            {
              title: 'איתור זיכוי - מחסן החזרות',
              key: 'refunds-locator',
              to: { name: 'refunds-locator' },
              icon: ''
            },
            {
              title: 'ניהול מחסן החזרות',
              key: 'refunds-refunds-storage',
              to: { name: 'refunds-refunds-storage' },
              icon: ''
            }
          ]
        },
        {
          id: 6,
          title: 'איסוף כמותי',
          icon: 'icon-truck',
          key: 'quantitative-collection',
          children: [
            {
              title: 'רכז איסופים',
              key: 'quantitative-collection-coordinator',
              to: { name: 'quantitative-collection-coordinator' },
              icon: ''
            },
            // {
            //   title: 'נהגי איסופים',
            //   key: 'quantitative-collection-drivers',
            //   to: { name: 'quantitative-collection-drivers' },
            //   icon: ''
            // },
            {
              title: 'תזמון משימות איסוף',
              key: 'quantitative-collection-scheduling',
              to: { name: 'quantitative-collection-scheduling' },
              icon: ''
            }
          ]
        },
        {
          id: 7,
          title: 'שירות לקוחות',
          key: 'customer-service',
          to: { name: 'customer-service' },
          icon: 'icon-operator'
        },
        {
          id: 8,
          title: 'נהגים',
          key: 'drivers',
          to: { name: 'drivers' },
          icon: 'icon-drivers'
        },
        {
          id: 9,
          title: 'דו"חות',
          key: 'reports',
          to: { name: 'reports' },
          icon: 'icon-document'
        },
        // {
        //   id: 10,
        //   title: 'דוח שגויים',
        //   key: 'error-logs',
        //   to: { name: 'error-logs' },
        //   icon: 'icon-drivers'
        // },
        {
          id: 10,
          title: 'הגדרות',
          key: 'settings',
          to: { name: 'settings' },
          icon: 'icon-settings',
          class: 'nav-settings'
        }
      ]
    }
  },

  computed: {
    linksFiltered () {
      const links = []
      this.links.forEach(link => {
        if (this.$hasPermission(link.key)) {
          link.children && (link.children = link.children.filter(link => this.$hasPermission(link.key)))
          links.push(link)
        }
      })
      return links
    }
  },
  methods: {
    onRow (item) {
      item?.to && this.$router.push(item.to)
    }
  }
}
</script>

<style lang="scss" scoped>
.navigation {
  z-index: 1;
  .v-navigation-drawer{
    width: 265px;
  }
  .navigation-header{
    padding: 1.5rem 1.9rem;
  }
  .navigation-body{
    padding-left: 1.6rem;
    padding-bottom: 3rem;
  }
  .theme--light.v-treeview{
    color: #363636;
  }
  .v-treeview-node__label a {
    text-decoration: none;
  }
}
</style>
