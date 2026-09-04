<template>
  <button type="button" class="student-row" @click="$emit('select', student)">
    <!-- Quién: avatar + nombre + carril del mes -->
    <div class="student-row__who">
      <div class="student-row__avatar" :class="`student-row__avatar--${status}`">
        {{ initials }}
      </div>
      <div class="student-row__body">
        <div class="student-row__name">{{ student.name }}</div>
        <div class="student-row__meta">
          <span class="student-row__due-inline" :class="`student-row__due-inline--${status}`">
            {{ due }}
          </span>
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
    </div>

    <!-- Estado como píldora tintada -->
    <div class="student-row__status">
      <span class="sw-pill" :class="`sw-pill--${TONE[status]}`">{{ statusLabel }}</span>
    </div>

    <!-- Vencimiento (columna propia en escritorio) -->
    <div class="student-row__due" :class="`student-row__due--${status}`">{{ due }}</div>

    <div class="student-row__fee">{{ fee }}</div>
    <q-icon name="sym_o_chevron_right" size="18px" class="student-row__chevron" />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { StudentDoc } from 'src/models/Student';
import { formatMoney } from 'src/utils/money';
import {
  STATUS_LABEL,
  SubscriptionStatus,
  dueLabel,
  getStatus,
  periodProgress,
} from 'src/utils/subscription';

const props = defineProps<{ student: StudentDoc }>();

defineEmits<{ (e: 'select', student: StudentDoc): void }>();

const TONE: Record<SubscriptionStatus, string> = {
  al_dia: 'success',
  vence_pronto: 'warning',
  debe: 'danger',
};

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
// Fila de tabla: divisor hairline arriba; hover tinta la fila.
.student-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 13px 16px;
  border: 0;
  border-top: 1px solid var(--sw-border);
  background: transparent;
  text-align: left;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: background 120ms var(--sw-ease);

  &:first-of-type {
    border-top: 0;
  }

  &:hover {
    background: var(--sw-surface-2);
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: -2px;
  }
}

.student-row__who {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.student-row__avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 0.8125rem;
  flex-shrink: 0;
  background: var(--sw-primary-tint);
  color: #0e5c8a;

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
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-row__meta {
  margin-top: 1px;
  font-size: 0.7813rem;
  color: var(--sw-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.student-row__due-inline {
  font-weight: 600;

  &--al_dia {
    color: var(--sw-text-2);
    font-weight: 400;
  }
  &--vence_pronto {
    color: #b45309;
  }
  &--debe {
    color: #b91c1c;
  }
}

.student-row__lane {
  margin-top: 7px;
  height: 3px;
  border-radius: 999px;
  background: var(--sw-surface-2);
  overflow: hidden;
  max-width: 320px;
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

.student-row__status {
  flex-shrink: 0;
}

// Columna de vencimiento: solo en escritorio (en móvil va bajo el nombre).
.student-row__due {
  display: none;
  flex-shrink: 0;
  width: 140px;
  font-size: 0.8125rem;
  color: var(--sw-text-2);

  &--vence_pronto {
    color: #b45309;
    font-weight: 600;
  }
  &--debe {
    color: #b91c1c;
    font-weight: 600;
  }
}

.student-row__fee {
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 0.875rem;
  color: var(--sw-text);
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  flex-shrink: 0;
  width: 84px;
  text-align: right;
}

.student-row__chevron {
  color: var(--sw-text-3);
  flex-shrink: 0;
}

// En pantallas anchas el vencimiento pasa a su columna y sale del subtítulo;
// los anchos calzan con la cabecera de la tabla.
@media (min-width: 760px) {
  .student-row__due {
    display: block;
  }

  .student-row__meta {
    display: none;
  }

  .student-row__status {
    width: 92px;
  }
}

// En móvil, la píldora de estado se esconde (el vencimiento ya colorea).
@media (max-width: 479px) {
  .student-row__status {
    display: none;
  }

  .student-row__fee {
    width: auto;
  }
}
</style>
