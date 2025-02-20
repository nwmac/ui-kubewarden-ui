<script>
import { mapGetters } from 'vuex';
import { _CREATE } from '@shell/config/query-params';
import { dashboardExists } from '@shell/utils/grafana';
import { monitoringStatus } from '@shell/utils/monitoring';
import CreateEditView from '@shell/mixins/create-edit-view';

import { Banner } from '@components/Banner';
import DashboardMetrics from '@shell/components/DashboardMetrics';
import Loading from '@shell/components/Loading';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import ResourceTable from '@shell/components/ResourceTable';
import Tab from '@shell/components/Tabbed/Tab';

import { RELATED_HEADERS } from '../models/policies.kubewarden.io.policyserver';

import TraceTable from '../components/TraceTable';

export default {
  name: 'PolicyServer',

  components: {
    Banner, DashboardMetrics, Loading, ResourceTabs, ResourceTable, Tab, TraceTable
  },

  mixins: [CreateEditView],

  props: {
    mode: {
      type:    String,
      default: _CREATE,
    },

    value: {
      type:     Object,
      required: true,
    }
  },

  async fetch() {
    const currentClusterId = this.$store.getters['clusterId'];

    this.relatedPolicies = await this.value.allRelatedPolicies();

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
    this.traces = await this.value.jaegerProxies();
  },

  data() {
    return {
      RELATED_HEADERS,
      jaegerService:   null,
      jaegerProxies:   null,
      metricsProxy:    null,
      metricsService:  null,
      relatedPolicies: null,
      traces:          null
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),
    ...monitoringStatus(),

    emptyTraces() {
      if ( this.traces ) {
        return !this.traces.find(t => t.data.length);
      }

      return true;
    },

    tracesRows() {
      return this.value.traceTableRows(this.traces);
    }
  },

  methods: {
    hasNamespaceSelector(row) {
      return row.namespaceSelector;
    },
  }
};
</script>

<template>
  <Loading v-if="$fetchState.pending" />
  <div v-else>
    <div class="mb-20">
      <h3>{{ t('namespace.resources') }}</h3>
    </div>
    <ResourceTabs v-model="value" :mode="mode">
      <Tab name="related-policies" label="Policies" :weight="99">
        <template #default>
          <ResourceTable
            :rows="relatedPolicies"
            :headers="RELATED_HEADERS"
            :groupable="true"
            group-by="kind"
            :table-actions="true"
          >
            <template #col:operation="{ row }">
              <td>
                <BadgeState
                  :label="row.operation"
                  :color="color(row.operation)"
                />
              </td>
            </template>

            <template #col:mode="{ row }">
              <td>
                <span class="policy__mode">
                  <span class="text-capitalize">{{ row.spec.mode }}</span>
                  <i
                    v-if="hasNamespaceSelector(row)"
                    v-tooltip.bottom="t('kubewarden.policies.namespaceWarning')"
                    class="icon icon-warning"
                  />
                </span>
              </td>
            </template>
          </ResourceTable>
        </template>
      </Tab>

      <Tab v-if="metricsService" name="policy-metrics" label="Metrics" :weight="98">
        <template #default="props">
          <DashboardMetrics
            v-if="props.active"
            :detail-url="metricsProxy"
            :summary-url="metricsProxy"
            graph-height="825px"
          />
        </template>
      </Tab>

      <Tab name="policy-tracing" label="Tracing" :weight="97">
        <template>
          <TraceTable
            :rows="tracesRows"
          >
            <template #traceBanner>
              <Banner v-if="emptyTraces" color="warning">
                <span v-if="!jaegerService" v-html="t('kubewarden.tracing.noJaeger', {}, true)" />
                <span v-else>{{ t('kubewarden.tracing.noRelatedTraces') }}</span>
              </Banner>
            </template>
          </TraceTable>
        </template>
      </Tab>
    </ResourceTabs>
  </div>
</template>

<style lang="scss" scoped>
.policy {
  &__mode {
    display: flex;
    align-items: center;

    i {
      margin-left: 5px;
      font-size: 22px;
      color: var(--warning);
    }
  }
}
</style>
