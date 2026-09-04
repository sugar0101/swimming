<template>
  <q-page>
    <div class="sw-page">
      <div class="sw-page__head">
        <h1 class="sw-page__title">Pagos</h1>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="sym_o_add"
          label="Registrar pago"
          class="sw-btn-sm"
          @click="openRegisterPayment"
        />
      </div>

      <!-- Navegación por mes -->
      <div class="pay__monthbar">
        <q-btn
          unelevated
          round
          dense
          icon="sym_o_chevron_left"
          class="pay__nav"
          aria-label="Mes anterior"
          @click="shiftMonth(-1)"
        />
        <div class="pay__month">{{ monthTitle }}</div>
        <q-btn
          unelevated
          round
          dense
          icon="sym_o_chevron_right"
          class="pay__nav"
          aria-label="Mes siguiente"
          :disable="isCurrentMonth"
          @click="shiftMonth(1)"
        />
      </div>

      <!-- La caja del mes: el neto manda, lo demás lo explica. -->
      <section class="sw-card pay__net">
        <div class="pay__net-icon">
          <q-icon name="sym_o_account_balance_wallet" size="22px" />
        </div>
        <span class="sw-overline sw-overline--plain">Neto del mes</span>
        <div class="pay__net-value sw-heading" :class="{ 'text-negative': paymentsStore.net < 0 }">
          {{ formatMoney(paymentsStore.net) }}
        </div>
        <div class="pay__net-lines">
          <div class="pay__line">
            <span class="pay__line-dot" style="background: var(--sw-success)" />
            <span class="pay__line-label">Recaudado</span>
            <span class="pay__line-value">{{ formatMoney(paymentsStore.collected) }}</span>
          </div>
          <div class="pay__line">
            <span class="pay__line-dot" style="background: var(--sw-warning)" />
            <span class="pay__line-label">Piscina</span>
            <span class="pay__line-value">−{{ formatMoney(paymentsStore.poolCost) }}</span>
          </div>
        </div>
      </section>

      <!-- Una sola lista de pagos, con filtros. -->
      <section class="pay__section">
        <div class="pay__section-head">
          <div class="pay__filters" role="tablist" aria-label="Filtrar pagos">
            <button
              v-for="filter in filters"
              :key="filter.key"
              type="button"
              role="tab"
              class="pay__filter"
              :class="{ 'pay__filter--active': activeFilter === filter.key }"
              :aria-selected="activeFilter === filter.key"
              @click="activeFilter = filter.key"
            >
              {{ filter.label }}
              <span class="pay__filter-count">{{ filter.count }}</span>
            </button>
          </div>
        </div>

        <empty-state
          v-if="visibleRows.length === 0"
          icon="sym_o_payments"
          :title="emptyText"
        />

        <div v-else class="sw-card pay__table">
          <div v-for="row in visibleRows" :key="row.key" class="pay__row">
            <div class="pay__row-icon" :class="`pay__row-icon--${row.kind}`">
              <q-icon
                :name="row.kind === 'mensualidad' ? 'sym_o_south_west' : 'sym_o_north_east'"
                size="16px"
              />
            </div>
            <div class="pay__row-body">
              <div class="pay__row-concept">{{ row.title }}</div>
              <div class="pay__row-date">{{ row.meta }}</div>
            </div>
            <div
              class="pay__row-amount"
              :class="{ 'pay__row-amount--in': row.kind === 'mensualidad' }"
            >
              {{ row.kind === 'mensualidad' ? '' : '−' }}{{ formatMoney(row.amount) }}
            </div>
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="sym_o_delete"
              class="pay__row-delete"
              :aria-label="row.kind === 'mensualidad' ? 'Eliminar mensualidad' : 'Eliminar pago de piscina'"
              @click="removeRow(row)"
            />
          </div>
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { format, parseISO, addMonths } from 'date-fns';
import EmptyState from 'src/components/EmptyState.vue';
import RegisterPaymentDialog from 'src/components/RegisterPaymentDialog.vue';
import { usePaymentsStore } from 'src/stores/payments-store';
import { useStudentsStore } from 'src/stores/students-store';
import { PaymentDoc } from 'src/models/Payment';
import { PoolPaymentDoc } from 'src/models/PoolPayment';
import { formatMoney } from 'src/utils/money';
import { currentMonthIso, formatMonthName, formatShortDate } from 'src/utils/dates';

const $q = useQuasar();
const paymentsStore = usePaymentsStore();
const studentsStore = useStudentsStore();

const monthTitle = computed(() => {
  const name = formatMonthName(paymentsStore.month);
  return name.charAt(0).toUpperCase() + name.slice(1);
});

const isCurrentMonth = computed(() => paymentsStore.month === currentMonthIso());

// Cambia el mes visible: la caja y la lista se recargan en vivo.
const shiftMonth = (delta: number) => {
  const next = addMonths(parseISO(`${paymentsStore.month}-01`), delta);
  paymentsStore.month = format(next, 'yyyy-MM');
};

// ————— Lista unificada con filtros —————
type FilterKey = 'todos' | 'mensualidad' | 'piscina';
const activeFilter = ref<FilterKey>('todos');

type TxRow = {
  key: string;
  kind: 'mensualidad' | 'piscina';
  title: string;
  meta: string;
  amount: number;
  date: string;
  payment?: PaymentDoc;
  pool?: PoolPaymentDoc;
};

const allRows = computed<TxRow[]>(() => {
  const mensualidades = paymentsStore.payments.map<TxRow>((p) => ({
    key: `m-${p._id}`,
    kind: 'mensualidad',
    title: p.studentName,
    meta:
      `${formatShortDate(p.date)} · cubre hasta ${formatShortDate(p.coversUntil)}` +
      (p.poolFee > 0 ? ` · piscina −${formatMoney(p.poolFee)}` : ''),
    amount: p.amount,
    date: p.date,
    payment: p,
  }));

  const piscina = paymentsStore.poolPayments.map<TxRow>((p) => ({
    key: `p-${p._id}`,
    kind: 'piscina',
    title: p.concept,
    meta: formatShortDate(p.date, true),
    amount: p.amount,
    date: p.date,
    pool: p,
  }));

  return [...mensualidades, ...piscina].sort((a, b) => (a.date < b.date ? 1 : -1));
});

const countBy = (kind: TxRow['kind']) => allRows.value.filter((r) => r.kind === kind).length;

const filters = computed(() => [
  { key: 'todos' as FilterKey, label: 'Todos', count: allRows.value.length },
  { key: 'mensualidad' as FilterKey, label: 'Mensualidad', count: countBy('mensualidad') },
  { key: 'piscina' as FilterKey, label: 'Piscina', count: countBy('piscina') },
]);

const visibleRows = computed(() =>
  allRows.value.filter((r) => activeFilter.value === 'todos' || r.kind === activeFilter.value)
);

const emptyText = computed(() => {
  if (activeFilter.value === 'piscina') return 'Sin pagos de piscina este mes';
  if (activeFilter.value === 'mensualidad') return 'Sin mensualidades este mes';
  return 'Sin pagos este mes';
});

// ————— Acciones —————
const openRegisterPayment = () => {
  $q.dialog({ component: RegisterPaymentDialog });
};

const removeRow = (row: TxRow) => {
  if (row.kind === 'mensualidad' && row.payment) confirmRemovePayment(row.payment);
  else if (row.pool) confirmRemovePool(row.pool._id);
};

const confirmRemovePool = (id: string) => {
  $q.dialog({
    title: 'Eliminar pago de piscina',
    message: 'Este pago dejará de restarse del neto del mes.',
    ok: { label: 'Eliminar', color: 'negative', unelevated: true, noCaps: true },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
  }).onOk(async () => {
    await paymentsStore.removePoolPayment(id);
  });
};

const confirmRemovePayment = (payment: PaymentDoc) => {
  $q.dialog({
    title: 'Eliminar mensualidad',
    message: `Se elimina el cobro a ${payment.studentName} y su cobertura retrocede un mes.`,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true, noCaps: true },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
  }).onOk(async () => {
    await studentsStore.undoPayment(payment);
  });
};
</script>

<style scoped lang="scss">
.pay__monthbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.pay__nav {
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

.pay__month {
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

.pay__net {
  padding: 20px 18px;
}

.pay__net-icon {
  width: 44px;
  height: 44px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sw-primary-tint);
  color: var(--sw-primary);
  margin-bottom: 12px;
}

.pay__net-value {
  margin: 4px 0 14px;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.pay__net-lines {
  border-top: 1px solid var(--sw-border);
  padding-top: 12px;
}

.pay__line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8438rem;

  & + & {
    margin-top: 6px;
  }
}

.pay__line-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pay__line-label {
  color: var(--sw-text-2);
  flex: 1;
}

.pay__line-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.pay__section {
  margin-top: 24px;
}

.pay__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

// Filtros píldora, como en Alumnos.
.pay__filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.pay__filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 13px;
  border-radius: 999px;
  border: 1px solid var(--sw-border);
  background: var(--sw-bg);
  color: var(--sw-text-2);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms var(--sw-ease), border-color 120ms var(--sw-ease),
    color 120ms var(--sw-ease);

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: 2px;
  }

  &--active {
    background: var(--sw-text);
    border-color: var(--sw-text);
    color: #fff;

    .pay__filter-count {
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.pay__filter-count {
  color: var(--sw-text-3);
  font-variant-numeric: tabular-nums;
}

.pay__empty {
  padding: 18px 16px;
  font-size: 0.875rem;
  color: var(--sw-text-2);
}

// Tabla de transacciones: una tarjeta con filas divididas.
.pay__table {
  overflow: hidden;
}

.pay__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;

  & + & {
    border-top: 1px solid var(--sw-border);
  }
}

// Flecha direccional: entrada verde, salida ámbar.
.pay__row-icon {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  &--mensualidad {
    background: var(--sw-success-tint);
    color: #166534;
  }

  &--piscina {
    background: var(--sw-warning-tint);
    color: #92400e;
  }
}

.pay__row-body {
  flex: 1;
  min-width: 0;
}

.pay__row-concept {
  font-weight: 600;
  font-size: 0.9063rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pay__row-date {
  margin-top: 1px;
  font-size: 0.7813rem;
  color: var(--sw-text-2);
}

.pay__row-amount {
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 0.875rem;
  font-variant-numeric: tabular-nums;
  color: #92400e;
  white-space: nowrap;

  &--in {
    color: #15803d;
  }
}

.pay__row-delete {
  color: var(--sw-text-3);
}
</style>
