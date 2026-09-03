<template>
  <button type="button" class="student-row" @click="$emit('select', student)">
    <div class="student-row__avatar" :class="`student-row__avatar--${status}`">
      {{ initials }}
    </div>

    <div class="student-row__body">
      <div class="student-row__name">{{ student.name }}</div>
      <div class="student-row__meta">
        <span class="student-row__status" :class="`student-row__status--${status}`">
          {{ status === 'vence_pronto' ? due : statusLabel }}
        </span>
        <template v-if="status !== 'vence_pronto'">
          <span class="student-row__sep">·</span>
          <span>{{ due }}</span>
        </template>
      </div>
      <!-- Carril: cuánto del mes pagado ya transcurrió. -->
      <div
        class="student-row__lane"
        role="progressbar"
        :aria-valuenow="Math.round(progress * 100)"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`Mes transcurrido: ${Math.round(progress * 100)}%`"
      >
        <div
          class="student-row__lane-fill"
          :class="`student-row__lane-fill--${status}`"
          :style="{ width: `${progress * 100}%` }"
        />
      </div>
    </div>

    <div class="student-row__fee">{{ fee }}</div>
    <q-icon name="sym_o_chevron_right" size="20px" class="student-row__chevron" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { StudentDoc } from 'src/models/Student';
import { formatMoney } from 'src/utils/money';
import {
  STATUS_LABEL,
  dueLabel,
  getStatus,
  periodProgress,
} from 'src/utils/subscription';

const props = defineProps<{ student: StudentDoc }>();

defineEmits<{ (e: 'select', student: StudentDoc): void }>();

const status = computed(() => getStatus(props.student.paidThrough));
const statusLabel = computed(() => STATUS_LABEL[status.value]);
const due = computed(() => dueLabel(props.student.paidThrough));
const fee = computed(() => formatMoney(props.student.monthlyFee));
const progress = computed(() => periodProgress(props.student.paidThrough));

const initials = computed(() =>
  props.student.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
);
</script>

<style scoped lang="scss">
.student-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 4px;
  border: 0;
  border-bottom: 1px solid var(--sw-border);
  background: transparent;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: background 120ms var(--sw-ease);

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: var(--sw-surface-2);
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: -2px;
    border-radius: 10px;
  }
}

.student-row__avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
  background: var(--sw-primary-tint);
  color: #0e4f7e;

  &--vence_pronto {
    background: var(--sw-warning-tint);
    color: #92400e;
  }
  &--debe {
    background: var(--sw-danger-tint);
    color: #991b1b;
  }
}

.student-row__body {
  flex: 1;
  min-width: 0;
}

.student-row__name {
  font-weight: 600;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-row__meta {
  margin-top: 2px;
  font-size: 0.8125rem;
  color: var(--sw-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-row__status {
  font-weight: 600;
  color: #15803d;

  &--vence_pronto {
    color: #b45309;
  }
  &--debe {
    color: #b91c1c;
  }
}

.student-row__sep {
  margin: 0 6px;
  color: var(--sw-text-3);
}

.student-row__lane {
  margin-top: 8px;
  height: 3px;
  border-radius: 999px;
  background: var(--sw-surface-2);
  overflow: hidden;
}

.student-row__lane-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--sw-primary);
  transition: width 320ms var(--sw-ease);

  &--vence_pronto {
    background: var(--sw-warning);
  }
  &--debe {
    background: var(--sw-danger);
  }
}

.student-row__fee {
  font-family: var(--sw-font-heading);
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--sw-text-2);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
}

.student-row__chevron {
  color: var(--sw-text-3);
  flex-shrink: 0;
  margin-left: -6px;
}
</style>
