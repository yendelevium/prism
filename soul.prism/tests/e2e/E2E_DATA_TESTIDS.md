# E2E testId Reference Guide

Here is the exhaustive list of `data-testid` attributes expected by the E2E specifications across all 6 Epics. 
These need to be applied to their corresponding Next.js frontend components in `src/` for the Playwright selectors to bind successfully.

### Epic 1: Core Request Engine
- `new-request-btn`
- `request-builder-panel`
- `method-select` **(Added to RequestBar)**
- `url-input` **(Added to RequestBar)**
- `add-header-btn`
- `header-key-input-0`
- `header-val-input-0`
- `tab-body`
- `body-editor`
- `send-request-btn` **(Added to RequestBar)**
- `response-status`
- `response-body`
- `execution-history-item`
- `new-environment-btn`
- `env-name-input`
- `env-key-0`
- `env-val-0`
- `save-env-btn`
- `env-selector`
- `copy-to-clipboard-btn`
- `save-to-file-btn`
- `create-collection-btn`
- `collection-name-input`
- `save-collection-btn`
- `sidebar-collection-{name}`
- `collection-count-{name}`
- `collection-select`
- `save-request-btn`
- `edit-collection-btn`
- `delete-request-btn`
- `delete-collection-btn`
- `log-panel`

### Epic 2: Distributed Tracing
- `view-trace-btn`
- `trace-waterfall`
- `trace-waterfall-rendered`
- `span-bar-<id>`
- `span-tooltip`
- `span-bar-error-<name>`
- `tab-service-map`
- `service-node`
- `service-edge-highlight`
- `edge-label-count`
- `span-detail-panel`
- `span-attributes-table`
- `attr-key-<key>`
- `close-span-detail-btn`
- `filter-bar-input`
- `clear-filters-btn`

### Epic 3: Chaos Engineering
- `new-chaos-rule-btn`
- `rule-type-select`
- `rule-delay-input`
- `rule-url-input`
- `rule-status-input`
- `save-rule-btn`
- `rule-item-latency`
- `toggle-rule-latency`
- `rule-status-active`
- `execution-latency`
- `toggle-rule-error`
- `chaos-injected-badge`
- `toggle-rule-drop`
- `execution-status`
- `service-node-payment`
- `casualty-report-panel`
- `casualty-downstream-list`
- `toggle-rule-audit`
- `tab-audit-log`
- `audit-log-row`
- `audit-log-user`

### Epic 4: Scenario Automation (Workflows)
- `new-workflow-btn`
- `wf-name-input`
- `add-step-btn`
- `step-url-<index>`
- `workflow-step-node`
- `step-actions-2`
- `move-step-up`
- `save-workflow-btn`
- `workflow-list-item-<name>`
- `step-method-0`
- `header-key-1`
- `header-val-1`
- `run-workflow-btn`
- `workflow-status-badge`
- `step-result-1`
- `step-headers-panel`
- `add-assertion-0`
- `assert-key-0`
- `assert-ops-0`
- `assert-val-0`
- `step-status-0`
- `step-error-msg-0`
- `add-condition-1`
- `cond-exp-1`
- `skip-reason-1`
- `wf-settings-btn`
- `enable-schedule-chk`
- `cron-input`
- `save-schedule-btn`
- `workflow-schedule-badge`
- `next-run-time`

### Epic 5: Platform & DevOps
- `collection-list-item`
- `unauthorized-msg`
- `workspace-switcher-trigger`
- `switch-ws-<name>`
- `analytics-ws-label`
- `attr-row`
- `attr-value`
- `show-raw-toggle`

### Epic 6: Analytics & Reporting
- `health-score-widget`
- `status-chart-pie`
- `latency-trend-line`
- `failing-endpoints-list`
- `endpoint-rank-1`
- `export-csv-btn`
- `export-pdf-btn`
- `time-range-select`
