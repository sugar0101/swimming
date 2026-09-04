<template>
  <q-page>
    <div class="sw-page settings">
      <div class="sw-page__head">
        <h1 class="sw-page__title">Configuración</h1>
      </div>

      <q-form class="sw-card settings__card" @submit.prevent="save">
        <div>
          <money-field
            v-model="form.monthlyFee"
            label="Mensualidad"
            field-id="settings-fee"
            placeholder="170.000"
          />
          <div class="settings__hint">
            Lo que paga cada alumno al mes. Se puede ajustar por alumno.
          </div>
        </div>

        <div>
          <money-field v-model="form.poolFee" label="Piscina" field-id="settings-pool" />
          <div class="settings__hint">
            Lo que la escuela paga a la piscina por alumno cada mes. Se descuenta
            del neto en Pagos.
          </div>
        </div>

        <q-btn
          unelevated
          no-caps
          type="submit"
          color="primary"
          class="sw-btn settings__save full-width"
          label="Guardar cambios"
          :loading="saving"
          :disable="!dirty"
        />
      </q-form>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue';
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import MoneyField from 'src/components/MoneyField.vue';
import { useSettingsStore } from 'src/stores/settings-store';

const $q = useQuasar();
const settingsStore = useSettingsStore();

const form = reactive({
  monthlyFee: settingsStore.monthlyFee,
  poolFee: settingsStore.poolFee,
});

// Cuando llegan los valores guardados (carga en vivo), rellena el formulario
// solo si el usuario aún no lo ha tocado.
const touched = ref(false);
watch(
  () => [settingsStore.monthlyFee, settingsStore.poolFee],
  ([fee, pool]) => {
    if (touched.value) return;
    form.monthlyFee = fee;
    form.poolFee = pool;
  }
);
watch(form, () => {
  if (
    form.monthlyFee !== settingsStore.monthlyFee ||
    form.poolFee !== settingsStore.poolFee
  ) {
    touched.value = true;
  }
});

const dirty = computed(
  () =>
    form.monthlyFee !== settingsStore.monthlyFee ||
    form.poolFee !== settingsStore.poolFee
);

const saving = ref(false);

const save = async () => {
  saving.value = true;
  try {
    await settingsStore.save({ monthlyFee: form.monthlyFee, poolFee: form.poolFee });
    touched.value = false;
    $q.notify({ message: 'Configuración guardada', color: 'positive' });
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
// Una sola columna: campos y botón a todo el ancho.
.settings__card {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.settings__hint {
  margin-top: 8px;
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}

.settings__save {
  width: 100%;
}
</style>
