<template>
  <q-dialog
    v-model="open"
    position="bottom"
    transition-show="slide-up"
    transition-hide="slide-down"
  >
    <q-card class="sw-sheet cash">
      <div class="sw-sheet__grip" />

      <div class="cash__header">
        <div>
          <h2 class="cash__title sw-heading">Caja del mes</h2>
          <div class="cash__month">{{ monthTitle }}</div>
        </div>
        <q-btn flat round dense icon="sym_o_close" aria-label="Cerrar" v-close-popup />
      </div>

      <!-- El neto es la cifra: lo demás explica de dónde sale. -->
      <section class="cash__net">
        <span class="sw-overline sw-overline--plain">Neto</span>
        <div class="cash__net-value sw-heading" :class="{ 'text-negative': paymentsStore.net < 0 }">
          {{ formatMoney(paymentsStore.net) }}
        </div>
        <div class="cash__line">
          <span class="cash__line-dot" style="background: var(--sw-success)" />
          <span class="cash__line-label">Recaudado</span>
          <span class="cash__line-value">{{ formatMoney(paymentsStore.collected) }}</span>
        </div>
        <div class="cash__line">
          <span class="cash__line-dot" style="background: var(--sw-warning)" />
          <span class="cash__line-label">Piscina</span>
          <span class="cash__line-value">−{{ formatMoney(paymentsStore.poolCost) }}</span>
        </div>
      </section>

      <div class="cash__scroll">
        <section class="cash__section">
          <div class="cash__section-head">
            <h3 class="cash__section-title sw-heading">Pagos de piscina</h3>
            <q-btn
              unelevated
              no-caps
              dense
              class="sw-chip-btn sw-chip-btn--primary"
              icon="sym_o_add"
              label="Agregar"
              @click="poolDialog = true"
            />
          </div>

          <div v-if="paymentsStore.poolPayments.length === 0" class="cash__empty">
            Sin pagos de piscina este mes. Registra el arriendo o el mantenimiento para
            calcular el neto.
          </div>

          <div v-for="payment in paymentsStore.poolPayments" :key="payment._id" class="cash__row">
            <div class="cash__row-body">
              <div class="cash__row-concept">{{ payment.concept }}</div>
              <div class="cash__row-date">{{ formatShortDate(payment.date, true) }}</div>
            </div>
            <div class="cash__row-amount">−{{ formatMoney(payment.amount) }}</div>
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="sym_o_delete"
              class="cash__row-delete"
              aria-label="Eliminar pago"
              @click="confirmRemovePool(payment._id)"
            />
          </div>
        </section>

        <section class="cash__section">
          <div class="cash__section-head">
            <h3 class="cash__section-title sw-heading">Mensualidades cobradas</h3>
          </div>

          <div v-if="sortedPayments.length === 0" class="cash__empty">
            Aún no hay pagos de alumnos este mes.
          </div>

          <div v-for="payment in sortedPayments" :key="payment._id" class="cash__row">
            <div class="cash__row-body">
              <div class="cash__row-concept">{{ payment.studentName }}</div>
              <div class="cash__row-date">
                {{ formatShortDate(payment.date) }} · cubre hasta {{ formatShortDate(payment.coversUntil) }}
              </div>
            </div>
            <div class="cash__row-amount cash__row-amount--in">{{ formatMoney(payment.amount) }}</div>
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="sym_o_delete"
              class="cash__row-delete"
              aria-label="Eliminar mensualidad"
              @click="confirmRemovePayment(payment)"
            />
          </div>
        </section>
      </div>
    </q-card>

    <pool-payment-dialog v-model="poolDialog" />
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import PoolPaymentDialog from 'src/components/PoolPaymentDialog.vue';
import { usePaymentsStore } from 'src/stores/payments-store';
import { useStudentsStore } from 'src/stores/students-store';
import { PaymentDoc } from 'src/models/Payment';
import { formatMoney } from 'src/utils/money';
import { formatMonthName, formatShortDate } from 'src/utils/dates';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>();

const $q = useQuasar();
const paymentsStore = usePaymentsStore();
const studentsStore = useStudentsStore();

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const monthTitle = computed(() => {
  const name = formatMonthName(paymentsStore.month);
  return name.charAt(0).toUpperCase() + name.slice(1);
});

const sortedPayments = computed(() =>
  [...paymentsStore.payments].sort((a, b) => (a.date < b.date ? 1 : -1))
);

const poolDialog = ref(false);

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
.cash {
  max-height: 88vh;
  display: flex;
  flex-direction: column;
}

.cash__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.cash__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.cash__month {
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}

.cash__net {
  padding: 16px;
  border-radius: var(--sw-radius-md);
  background: var(--sw-surface-2);
  flex-shrink: 0;
}

.cash__net-value {
  margin: 4px 0 10px;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.cash__line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.9375rem;

  & + & {
    margin-top: 4px;
  }
}

.cash__line-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.cash__line-label {
  color: var(--sw-text-2);
  flex: 1;
}

.cash__line-value {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.cash__scroll {
  overflow-y: auto;
  min-height: 0;
  margin: 0 -20px;
  padding: 0 20px;
}

.cash__section {
  margin-top: 20px;
}

.cash__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 2px;
}

.cash__section-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
}

.cash__empty {
  padding: 12px 0;
  font-size: 0.875rem;
  color: var(--sw-text-2);
}

.cash__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid var(--sw-border);

  &:last-child {
    border-bottom: 0;
  }
}

.cash__row-body {
  flex: 1;
  min-width: 0;
}

.cash__row-concept {
  font-weight: 600;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cash__row-date {
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}

.cash__row-amount {
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #92400e;
  white-space: nowrap;

  &--in {
    color: #15803d;
  }
}

.cash__row-delete {
  color: var(--sw-text-3);
}
</style>
