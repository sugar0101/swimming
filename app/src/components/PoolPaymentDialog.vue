<template>
  <q-dialog
    ref="dialogRef"
    position="bottom"
    transition-show="slide-up"
    transition-hide="slide-down"
    :transition-duration="380"
    @hide="onDialogHide"
  >
    <q-card class="sw-sheet">
      <div class="sw-sheet__grip" />

      <div class="pool-form__header">
        <h2 class="pool-form__title sw-heading">Pago de piscina</h2>
        <q-btn flat round dense icon="sym_o_close" aria-label="Cerrar" v-close-popup />
      </div>

      <q-form class="pool-form" @submit.prevent="submit">
        <div class="sw-field">
          <label class="sw-overline sw-overline--plain sw-field__label" for="pool-concept">
            Concepto
          </label>
          <q-input
            for="pool-concept"
            v-model="form.concept"
            borderless
            placeholder="Ej: arriendo piscina agosto"
            :rules="[(v) => !!v?.trim() || 'Escribe el concepto']"
            hide-bottom-space
          />
        </div>

        <div class="pool-form__grid">
          <div class="sw-field">
            <label class="sw-overline sw-overline--plain sw-field__label" for="pool-amount">
              Valor
            </label>
            <q-input
              for="pool-amount"
              v-model.number="form.amount"
              borderless
              type="number"
              inputmode="numeric"
              prefix="$"
              placeholder="70000"
              :rules="[(v) => (typeof v === 'number' && v > 0) || 'Escribe el valor']"
              hide-bottom-space
            />
          </div>

          <div class="sw-field">
            <label class="sw-overline sw-overline--plain sw-field__label" for="pool-date">
              Fecha
            </label>
            <q-input
              for="pool-date"
              v-model="form.date"
              borderless
              type="date"
              :rules="[(v) => !!v || 'Elige la fecha']"
              hide-bottom-space
            />
          </div>
        </div>

        <q-btn
          unelevated
          no-caps
          type="submit"
          color="primary"
          class="sw-btn full-width q-mt-md"
          label="Agregar pago"
          :loading="saving"
        />
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import { usePaymentsStore } from 'src/stores/payments-store';
import { todayIso } from 'src/utils/dates';

// Se abre con $q.dialog({ component: PoolPaymentDialog }): el componente se
// monta fresco en cada apertura, así que el formulario nace limpio.
defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const $q = useQuasar();
const paymentsStore = usePaymentsStore();

const form = reactive({ concept: '', amount: 70000, date: todayIso() });
const saving = ref(false);

const submit = async () => {
  saving.value = true;
  try {
    await paymentsStore.addPoolPayment({ ...form });
    $q.notify({ message: 'Pago de piscina agregado', color: 'positive' });
    onDialogOK();
  } catch (error) {
    console.error(error);
    $q.notify({
      message: 'No se pudo guardar. Revisa la conexión e inténtalo de nuevo.',
      color: 'negative',
    });
  } finally {
    saving.value = false;
  }
};
</script>

<style scoped lang="scss">
.pool-form__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.pool-form__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
}

.pool-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pool-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
