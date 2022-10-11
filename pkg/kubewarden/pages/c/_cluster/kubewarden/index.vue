<script>
import { mapGetters } from 'vuex';
import { CATALOG } from '@shell/config/types';
import { REPO_TYPE, REPO, CHART, VERSION } from '@shell/config/query-params';

import { Banner } from '@components/Banner';
import CopyCode from '@shell/components/CopyCode';

export default {
  name: 'Dashboard',

  components: { Banner, CopyCode },

  data() {
    const getStartedLink = {
      name:    'c-cluster-apps-charts-install',
      params: {
        cluster:  this.$route.params.cluster,
        product:  CATALOG.APP,
      },
      query: {
        [REPO_TYPE]: 'cluster',
        [REPO]:      'kubewarden',
        [CHART]:     'kubewarden-controller',
        // [VERSION]:   'latest' // change this to get the latest version from charts listed by rancher-charts
      }
    };

    return { getStartedLink };
  },

  computed: { ...mapGetters['currentCluster'] }
};
</script>

<template>
  <div class="main">
    <div class="container">
      <div class="title margin-100 p-10">
        <div class="logo mt-20 mb-10">
          <img src="https://www.kubewarden.io/images/logo-kubewarden.svg" height="64" />
        </div>
        <div class="description">
          {{ t('kubewarden.install.description' ) }}
        </div>

        <nuxt-link
          :to="getStartedLink"
          class="btn role-secondary mt-20"
        >
          {{ t('kubewarden.install.getStarted') }}
        </nuxt-link>
      </div>

      <hr class="m-20" />

      <h2 class="mb-10">
        {{ t('kubewarden.install.prerequisites.title') }}
      </h2>
      <Banner color="warning" :label="t('kubewarden.install.prerequisites.certManager.description')" />
      <div>
        <h4 v-html="t('kubewarden.install.prerequisites.certManager.step', null, true)"></h4>
        <CopyCode class="m-10 p-10">
          {{ t('kubewarden.install.prerequisites.certManager.applyCommand') }}
        </CopyCode>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.main {
  & .title {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
  }
}

.margin-100 {
  margin: 100px 0 !important;
}

.description {
  line-height: 20px;
}
</style>
