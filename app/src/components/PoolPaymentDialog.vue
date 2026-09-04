<template>
  <q-dialog
    ref="dialogRef"
    maximized
    transition-show="jump-up"
    transition-hide="jump-down"
    :transition-duration="320"
    @hide="onDialogHide"
  >
    <q-card class="sw-modal">
      <header class="sw-modal__bar">
        <div class="sw-modal__bar-inner">
          <button type="button" class="sw-modal__back" aria-label="Volver" v-close-popup>
            <q-icon name="sym_o_chevron_left" size="22px" />
          </button>
          <h2 class="sw-modal__title">Pago de piscina</h2>
        </div>
      </header>

      <q-form class="sw-modal__form" @submit.prevent="submit">
        <div class="sw-modal__scroll">
          <div class="sw-modal__inner">
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
              <money-field
                v-model="form.amount"
                label="Valor"
                field-id="pool-amount"
                placeholder="70.000"
                :min="1"
              />

              <date-field
                v-model="form.date"
                label="Fecha"
                field-id="pool-date"
                required-message="Elige la fecha"
              />
            </div>
          </div>
        </div>

        <footer class="sw-modal__footer">
          <div class="sw-modal__footer-inner">
            <q-btn
              unelevated
              no-caps
              type="submit"
              color="primary"
              class="sw-btn full-width"
              label="Agregar pago"
              :loading="saving"
            />
          </div>
        </footer>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useDialogPluginComponent, useQuasar } from 'quasar';
import DateField from 'src/components/DateField.vue';
import MoneyField from 'src/components/MoneyField.vue';
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
.pool-form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
</style>
