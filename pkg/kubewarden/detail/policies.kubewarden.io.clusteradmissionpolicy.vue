<script>
import { mapGetters } from 'vuex';
import flatMap from 'lodash/flatMap';
import { _CREATE } from '@shell/config/query-params';
import { monitoringStatus } from '@shell/utils/monitoring';
import { dashboardExists } from '@shell/utils/grafana';
import CreateEditView from '@shell/mixins/create-edit-view';

import { Banner } from '@components/Banner';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';

import RulesTable from '../components/RulesTable';
import TraceTable from '../components/TraceTable';

export default {
  name: 'ClusterAdmissionPolicy',

  components: {
    Banner, DashboardMetrics, Loading, ResourceTabs, RulesTable, Tab, TraceTable
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },

    resource: {
      type:    String,
      default: null
    },

    value: {
      type:     Object,
      required: true,
    },
  },

  async fetch() {
    const currentClusterId = this.$store.getters['clusterId'];

    this.metricsProxy = await this.value.grafanaProxy();

    if ( this.monitoringStatus.installed ) {
      try {
        this.metricsProxy = await this.value.grafanaProxy();

        if ( this.metricsProxy ) {
          this.metricsService = await dashboardExists(this.$store, currentClusterId, this.metricsProxy);
        }
      } catch (e) {
        console.error(`Error fetching Grafana service: ${ e }`); // eslint-disable-line no-console
      }
    }

    this.jaegerService = await this.value.jaegerService();
    this.traces = await this.value.jaegerProxy() || [];

    if ( this.traces.length > 1 ) {
      this.traces = flatMap(this.traces);
    }
  },

  data() {
    return {
      jaegerService:  null,
      metricsProxy:   null,
      metricsService: null,
      traces:         null
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    dashboardVars() {
      return { policy_name: `clusterwide-${ this.value?.id }` };
    },

    emptyTraces() {
      if ( this.traces ) {
        return !this.traces.find(t => t.data.length);
      }

      return true;
    },

    hasMetricsTabs() {
      return this.metricsService;
    },

    hasRelationships() {
      return !!this.value.metadata?.relationships;
    },

    rulesRows() {
      return this.value.spec?.rules;
    },

    tracesRows() {
      return this.value.traceTableRows(this.traces);
    }
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="mb-20">
      <h3>{{ t('namespace.resources') }}</h3>
    </div>
    <ResourceTabs v-model="value" :mode="mode" :need-related="hasRelationships">
      <Tab v-if="!!rulesRows" name="policy-rules" label="Rules" :weight="99">
        <RulesTable :rows="rulesRows" />
      </Tab>
      <Tab name="policy-tracing" label="Tracing" :weight="98">
        <TraceTable :rows="tracesRows">
          <template #traceBanner>
            <Banner v-if="emptyTraces" color="warning">
              <span v-if="!jaegerService" v-html="t('kubewarden.tracing.noJaeger', {}, true)" />
              <span v-else>{{ t('kubewarden.tracing.noTraces') }}</span>
            </Banner>
          </template>
        </TraceTable>
      </Tab>
      <Tab v-if="metricsService" name="policy-metrics" label="Metrics" :weight="97">
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="metricsProxy"
            :summary-url="metricsProxy"
            :vars="dashboardVars"
            graph-height="825px"
          />
        </template>
      </Tab>
    </ResourceTabs>
  </div>
</template>
