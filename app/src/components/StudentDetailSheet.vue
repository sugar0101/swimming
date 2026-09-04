<template>
  <q-dialog
    v-model="open"
    position="bottom"
    transition-show="slide-up"
    transition-hide="slide-down"
    :transition-duration="380"
  >
    <q-card v-if="student" class="sw-sheet detail">
      <div class="sw-sheet__grip" />

      <div class="detail__header">
        <div class="detail__avatar" :class="`detail__avatar--${status}`">{{ initials }}</div>
        <div class="detail__titles">
          <h2 class="detail__name sw-heading">{{ student.name }}</h2>
          <div class="detail__status" :class="`detail__status--${status}`">
            {{ statusLabel }} · {{ due }}
          </div>
        </div>
        <q-btn flat round dense icon="sym_o_close" aria-label="Cerrar" v-close-popup />
      </div>

      <dl class="detail__facts">
        <div class="detail__fact">
          <dt class="sw-overline sw-overline--plain">Mensualidad</dt>
          <dd>{{ fee }}</dd>
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
          @click="$emit('pay', student)"
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
        <button type="button" class="detail__link" @click="$emit('edit', student)">
          Editar datos
        </button>
        <button type="button" class="detail__link detail__link--danger" @click="$emit('remove', student)">
          Eliminar alumno
        </button>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { StudentDoc } from 'src/models/Student';
import { formatMoney } from 'src/utils/money';
import { ageFrom, formatShortDate } from 'src/utils/dates';
import {
  STATUS_LABEL,
  dueLabel,
  getStatus,
  reminderMessage,
  whatsappLink,
} from 'src/utils/subscription';

const props = defineProps<{
  modelValue: boolean;
  student: StudentDoc | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'pay', student: StudentDoc): void;
  (e: 'edit', student: StudentDoc): void;
  (e: 'remove', student: StudentDoc): void;
}>();

const open = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const status = computed(() => (props.student ? getStatus(props.student.paidThrough) : 'al_dia'));
const statusLabel = computed(() => STATUS_LABEL[status.value]);
const due = computed(() => (props.student ? dueLabel(props.student.paidThrough) : ''));
const fee = computed(() => formatMoney(props.student?.monthlyFee ?? 0));
const paidThrough = computed(() =>
  props.student ? formatShortDate(props.student.paidThrough, true) : ''
);
const startDate = computed(() =>
  props.student ? formatShortDate(props.student.startDate, true) : ''
);

const ageLabel = computed(() => {
  const age = ageFrom(props.student?.birthDate ?? '');
  return age === null ? '—' : `${age} ${age === 1 ? 'año' : 'años'}`;
});

const initials = computed(() =>
  (props.student?.name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
);

const whatsapp = computed(() => {
  if (!props.student?.phone.trim()) return '';
  return whatsappLink(
    props.student.phone,
    reminderMessage(props.student.name.split(/\s+/)[0] ?? '', due.value)
  );
});
</script>

<style scoped lang="scss">
.detail__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 18px;
}

.detail__avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--sw-font-heading);
  font-weight: 700;
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

.detail__titles {
  flex: 1;
  min-width: 0;
}

.detail__name {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail__status {
  font-size: 0.8125rem;
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
  margin: 0 0 18px;
  padding: 14px;
  border-radius: var(--sw-radius-md);
  background: var(--sw-surface-2);

  dd {
    margin: 4px 0 0;
    font-weight: 600;
    font-size: 0.9375rem;
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
  margin-top: 16px;
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
