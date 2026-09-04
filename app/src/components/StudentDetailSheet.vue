<template>
  <q-dialog
    ref="dialogRef"
    maximized
    transition-show="jump-up"
    transition-hide="jump-down"
    :transition-duration="320"
    @hide="onDialogHide"
  >
    <q-card v-if="student" class="detail">
      <!-- Barra superior fija: cerrar + acciones de edición. -->
      <header class="detail__bar">
        <div class="detail__bar-inner">
          <q-btn flat round dense icon="sym_o_close" aria-label="Cerrar" v-close-popup />
          <span class="detail__bar-title sw-heading">Alumno</span>
          <q-btn
            flat
            round
            dense
            icon="sym_o_edit"
            aria-label="Editar datos"
            @click="act('edit')"
          />
        </div>
      </header>

      <div class="detail__scroll">
        <div class="detail__inner">
          <!-- Perfil: avatar grande, nombre y estado. -->
          <section class="detail__hero">
            <div class="detail__avatar" :class="`detail__avatar--${status}`">{{ initials }}</div>
            <h2 class="detail__name sw-heading">{{ student.name }}</h2>
            <div class="detail__status" :class="`detail__status--${status}`">
              {{ statusLabel }} · {{ due }}
            </div>
          </section>

          <dl class="detail__facts">
            <div class="detail__fact">
              <dt class="sw-overline sw-overline--plain">Mensualidad</dt>
              <dd>{{ fee }}</dd>
            </div>
            <div class="detail__fact">
              <dt class="sw-overline sw-overline--plain">Piscina</dt>
              <dd>{{ poolFeeLabel }}</dd>
            </div>
            <div class="detail__fact">
              <dt class="sw-overline sw-overline--plain">Pagado hasta</dt>
              <dd>{{ paidThrough }}</dd>
            </div>
            <div class="detail__fact">
              <dt class="sw-overline sw-overline--plain">Inicio</dt>
              <dd>{{ startDate }}</dd>
            </div>
            <div class="detail__fact">
              <dt class="sw-overline sw-overline--plain">WhatsApp</dt>
              <dd>{{ student.phone || '—' }}</dd>
            </div>
            <div class="detail__fact">
              <dt class="sw-overline sw-overline--plain">Documento</dt>
              <dd>{{ student.document || '—' }}</dd>
            </div>
            <div class="detail__fact">
              <dt class="sw-overline sw-overline--plain">Edad</dt>
              <dd>{{ ageLabel }}</dd>
            </div>
          </dl>

          <div class="detail__actions">
            <q-btn
              unelevated
              no-caps
              color="primary"
              class="sw-btn full-width"
              icon="sym_o_payments"
              :label="`Registrar pago · ${fee}`"
              @click="act('pay')"
            />
            <q-btn
              v-if="whatsapp"
              unelevated
              no-caps
              class="sw-btn sw-btn--secondary full-width"
              icon="fa-brands fa-whatsapp"
              label="Recordar por WhatsApp"
              :href="whatsapp"
              target="_blank"
              rel="noopener noreferrer"
            />
          </div>

          <div class="detail__links">
            <button type="button" class="detail__link" @click="act('edit')">
              Editar datos
            </button>
            <button
              type="button"
              class="detail__link detail__link--danger"
              @click="act('remove')"
            >
              Eliminar alumno
            </button>
          </div>
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { useDialogPluginComponent } from 'quasar';
import { StudentDoc } from 'src/models/Student';
import { useStudentsStore } from 'src/stores/students-store';
import { formatMoney } from 'src/utils/money';
import { formatShortDate } from 'src/utils/dates';
import {
  STATUS_LABEL,
  dueLabel,
  getStatus,
  reminderMessage,
  whatsappLink,
} from 'src/utils/subscription';

// Acción elegida en la hoja: la página decide qué hacer con ella.
export type StudentDetailAction = {
  action: 'pay' | 'edit' | 'remove';
  student: StudentDoc;
};

// Se abre con $q.dialog({ component: StudentDetailSheet, componentProps:
// { studentId } }). Recibe el id y lee el alumno en vivo del store, así los
// datos nunca quedan desactualizados mientras la hoja está abierta.
const props = defineProps<{ studentId: string }>();

defineEmits([...useDialogPluginComponent.emits]);
const { dialogRef, onDialogHide, onDialogOK } = useDialogPluginComponent();

const studentsStore = useStudentsStore();

const student = computed(
  () => studentsStore.students.find((s) => s._id === props.studentId) ?? null
);

// Si el alumno desaparece (eliminado desde otro dispositivo), la hoja se cierra.
watch(student, (value) => {
  if (!value) dialogRef.value?.hide();
});

const act = (action: StudentDetailAction['action']) => {
  if (!student.value) return;
  onDialogOK({ action, student: student.value } satisfies StudentDetailAction);
};

const status = computed(() =>
  student.value ? getStatus(student.value.paidThrough) : 'al_dia'
);
const statusLabel = computed(() => STATUS_LABEL[status.value]);
const due = computed(() => (student.value ? dueLabel(student.value.paidThrough) : ''));
const fee = computed(() => formatMoney(student.value?.monthlyFee ?? 0));
const poolFeeLabel = computed(() =>
  student.value?.poolFee ? `−${formatMoney(student.value.poolFee)}` : '—'
);
const paidThrough = computed(() =>
  student.value ? formatShortDate(student.value.paidThrough, true) : ''
);
const startDate = computed(() =>
  student.value ? formatShortDate(student.value.startDate, true) : ''
);

const ageLabel = computed(() => {
  const age = student.value?.age;
  if (age === null || age === undefined) return '—';
  return `${age} ${age === 1 ? 'año' : 'años'}`;
});

const initials = computed(() =>
  (student.value?.name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
);

const whatsapp = computed(() => {
  if (!student.value?.phone.trim()) return '';
  return whatsappLink(
    student.value.phone,
    reminderMessage(student.value.name.split(/\s+/)[0] ?? '', due.value)
  );
});
</script>

<style scoped lang="scss">
.detail {
  display: flex;
  flex-direction: column;
  background: var(--sw-bg);
}

.detail__bar {
  flex-shrink: 0;
  border-bottom: 1px solid var(--sw-border);
  padding-top: env(safe-area-inset-top);
}

.detail__bar-inner {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
}

.detail__bar-title {
  flex: 1;
  font-size: 1.125rem;
  font-weight: 700;
}

.detail__scroll {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.detail__inner {
  max-width: 640px;
  margin: 0 auto;
  padding: 24px 16px calc(24px + env(safe-area-inset-bottom));
}

.detail__hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  margin-bottom: 22px;
}

.detail__avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 1.375rem;
  background: var(--sw-primary-tint);
  color: #0e4f7e;
  margin-bottom: 12px;

  &--vence_pronto {
    background: var(--sw-warning-tint);
    color: #92400e;
  }
  &--debe {
    background: var(--sw-danger-tint);
    color: #991b1b;
  }
}

.detail__name {
  margin: 0;
  font-size: 1.375rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.detail__status {
  margin-top: 4px;
  font-size: 0.875rem;
  font-weight: 600;
  color: #15803d;

  &--vence_pronto {
    color: #b45309;
  }
  &--debe {
    color: #b91c1c;
  }
}

.detail__facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 0 0 20px;
  padding: 16px;
  border-radius: var(--sw-radius-md);
  background: var(--sw-surface-2);

  dd {
    margin: 4px 0 0;
    font-weight: 600;
    font-size: 0.9375rem;
  }
}

@media (min-width: 600px) {
  .detail__facts {
    grid-template-columns: repeat(3, 1fr);
  }
}

.detail__actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail__links {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 20px;
}

.detail__link {
  border: 0;
  background: transparent;
  padding: 6px 0;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--sw-text-2);
  cursor: pointer;

  &--danger {
    color: #b91c1c;
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: 2px;
    border-radius: 4px;
  }
}
</style>
