<template>
  <q-page>
    <div class="sw-page">
      <div class="sw-page__head">
        <h1 class="sw-page__title">Resumen</h1>
      </div>

      <!-- Navegación por mes: la caja del mes elegido. -->
      <div class="ana__monthbar">
        <q-btn
          unelevated
          round
          dense
          icon="sym_o_chevron_left"
          class="ana__nav"
          aria-label="Mes anterior"
          @click="shiftMonth(-1)"
        />
        <div class="ana__month">{{ monthTitle }}</div>
        <q-btn
          unelevated
          round
          dense
          icon="sym_o_chevron_right"
          class="ana__nav"
          aria-label="Mes siguiente"
          :disable="isCurrentMonth"
          @click="shiftMonth(1)"
        />
      </div>

      <!-- KPIs: estado de hoy + caja del mes elegido. -->
      <div class="ana__kpis">
        <stat-tile label="Alumnos" :value="studentsStore.counts.total" />
        <stat-tile label="Al día" :value="studentsStore.counts.alDia" />
        <stat-tile label="Deben" :value="studentsStore.counts.deben" />
        <stat-tile label="Recaudado" :value="formatMoney(paymentsStore.collected)" />
        <stat-tile label="Piscina" :value="`−${formatMoney(paymentsStore.poolCost)}`" />
        <stat-tile label="Neto" :value="formatMoney(paymentsStore.net)" />
      </div>

      <!-- Los próximos que deben: ordenados por fecha de vencimiento. -->
      <section class="ana__due">
        <div class="ana__due-head">
          <h2 class="ana__due-title sw-heading">Próximos vencimientos</h2>
          <router-link to="/alumnos" class="ana__due-more">Ver alumnos</router-link>
        </div>

        <empty-state
          v-if="upcoming.length === 0"
          icon="sym_o_event_upcoming"
          title="Sin vencimientos próximos"
        />

        <div v-else class="sw-card ana__due-list">
          <button
            v-for="row in upcoming"
            :key="row.student._id"
            type="button"
            class="ana__due-row"
            @click="goStudent(row.student)"
          >
            <span class="ana__due-avatar" :class="`ana__due-avatar--${row.status}`">
              {{ row.initials }}
            </span>
            <span class="ana__due-body">
              <span class="ana__due-name">{{ row.student.name }}</span>
              <span class="ana__due-when" :class="`ana__due-when--${row.status}`">
                {{ row.due }}
              </span>
            </span>
            <span class="ana__due-fee">{{ formatMoney(row.student.monthlyFee) }}</span>
            <q-icon name="sym_o_chevron_right" size="18px" class="ana__due-chevron" />
          </button>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { addMonths, format, parseISO } from 'date-fns';
import EmptyState from 'src/components/EmptyState.vue';
import StatTile from 'src/components/StatTile.vue';
import { StudentDoc } from 'src/models/Student';
import { useStudentsStore } from 'src/stores/students-store';
import { usePaymentsStore } from 'src/stores/payments-store';
import { formatMoney } from 'src/utils/money';
import { currentMonthIso, formatMonthName } from 'src/utils/dates';
import { dueLabel, getStatus } from 'src/utils/subscription';

const router = useRouter();
const studentsStore = useStudentsStore();
const paymentsStore = usePaymentsStore();

const monthTitle = computed(() => {
  const name = formatMonthName(paymentsStore.month);
  return name.charAt(0).toUpperCase() + name.slice(1);
});

const isCurrentMonth = computed(() => paymentsStore.month === currentMonthIso());

// Cambia el mes visible: las cifras de caja se recargan en vivo.
const shiftMonth = (delta: number) => {
  const next = addMonths(parseISO(`${paymentsStore.month}-01`), delta);
  paymentsStore.month = format(next, 'yyyy-MM');
};

// Los próximos que deben: primero los ya vencidos, luego por fecha (máx. 5).
const upcoming = computed(() =>
  [...studentsStore.activeStudents]
    .sort((a, b) => (a.paidThrough < b.paidThrough ? -1 : 1))
    .slice(0, 5)
    .map((student) => ({
      student,
      status: getStatus(student.paidThrough),
      due: dueLabel(student.paidThrough),
      initials: student.name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join(''),
    }))
);

const goStudent = (student: StudentDoc) => router.push(`/alumnos/${student._id}`);
</script>

<style scoped lang="scss">
.ana__monthbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.ana__nav {
  width: 46px;
  height: 46px;
  background: var(--sw-bg);
  border: 1px solid var(--sw-border);
  color: var(--sw-text-2);
  box-shadow: var(--sw-shadow-sm);
  transition: border-color 120ms var(--sw-ease), color 120ms var(--sw-ease);

  &:hover {
    border-color: var(--sw-border-strong);
    color: var(--sw-text);
  }
}

.ana__month {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 46px;
  border-radius: 999px;
  border: 1px solid var(--sw-border);
  background: var(--sw-bg);
  box-shadow: var(--sw-shadow-sm);
  font-family: var(--sw-font-heading);
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

// KPIs: 2 columnas en móvil, 3 en adelante.
.ana__kpis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

@media (min-width: 700px) {
  .ana__kpis {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

// ————— Próximos vencimientos —————
.ana__due {
  margin-top: 26px;
}

.ana__due-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.ana__due-title {
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 700;
}

.ana__due-more {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--sw-primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }
}

.ana__due-list {
  overflow: hidden;
}

.ana__due-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: 0;
  background: transparent;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 120ms var(--sw-ease);

  & + & {
    border-top: 1px solid var(--sw-border);
  }

  &:hover {
    background: var(--sw-surface-2);
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: -2px;
  }
}

.ana__due-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 0.75rem;
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

.ana__due-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.ana__due-name {
  font-weight: 600;
  font-size: 0.9063rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ana__due-when {
  margin-top: 1px;
  font-size: 0.7813rem;
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

.ana__due-fee {
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--sw-text-2);
}

.ana__due-chevron {
  color: var(--sw-text-3);
  flex-shrink: 0;
}
</style>
