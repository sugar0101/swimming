<template>
  <q-page>
    <template v-if="student">
      <!-- Barra propia de la pantalla: volver + nombre + acción. -->
      <header class="detail__bar">
        <div class="detail__bar-inner">
          <button type="button" class="detail__back" aria-label="Volver a alumnos" @click="goBack">
            <q-icon name="sym_o_chevron_left" size="22px" />
          </button>
          <div class="detail__identity">
            <h1 class="detail__name sw-heading">{{ student.name }}</h1>
          </div>
        </div>

        <!-- Tabs de la pantalla -->
        <div class="detail__tabs" role="tablist" aria-label="Secciones del alumno">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            type="button"
            role="tab"
            class="detail__tab"
            :class="{ 'detail__tab--active': activeTab === tab.key }"
            :aria-selected="activeTab === tab.key"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
            <span v-if="tab.count" class="detail__tab-count">{{ tab.count }}</span>
          </button>
        </div>
      </header>

      <div class="sw-page detail">
      <!-- Datos básicos: siempre editables -->
      <q-form v-if="activeTab === 'datos'" class="detail__panel" @submit.prevent="saveBasics">
        <div class="detail__panel-head">
          <h2 class="detail__panel-title sw-heading">Datos básicos</h2>
        </div>
        <div class="sw-card detail__form">
          <div class="detail__grid">
            <div class="sw-field detail__span-2">
              <label class="sw-overline sw-overline--plain sw-field__label" for="detail-name">
                Nombre completo
              </label>
              <q-input
                for="detail-name"
                v-model="basics.name"
                borderless
                placeholder="Ej: Yesicca Rojas"
                :rules="[(v) => !!v?.trim() || 'Escribe el nombre']"
                hide-bottom-space
              />
            </div>

            <div class="sw-field">
              <label class="sw-overline sw-overline--plain sw-field__label" for="detail-document">
                Documento
              </label>
              <q-input
                for="detail-document"
                v-model="basics.document"
                borderless
                inputmode="numeric"
                placeholder="Ej: 1023456789"
                hide-bottom-space
              />
            </div>

            <div class="sw-field">
              <label class="sw-overline sw-overline--plain sw-field__label" for="detail-age">
                Edad
              </label>
              <q-input
                for="detail-age"
                v-model.number="basics.age"
                borderless
                type="number"
                inputmode="numeric"
                placeholder="Ej: 9"
                :rules="[
                  (v) =>
                    v === '' ||
                    v === null ||
                    (typeof v === 'number' && v >= 0 && v <= 120) ||
                    'Edad inválida',
                ]"
                hide-bottom-space
              />
            </div>

            <div class="sw-field detail__span-2">
              <label class="sw-overline sw-overline--plain sw-field__label" for="detail-phone">
                Teléfono WhatsApp
              </label>
              <q-input
                for="detail-phone"
                v-model="basics.phone"
                borderless
                type="tel"
                inputmode="tel"
                placeholder="3025916027"
                hide-bottom-space
              />
            </div>
          </div>
        </div>

        <div class="detail__actions">
          <q-btn
            unelevated
            no-caps
            type="submit"
            color="primary"
            class="sw-btn"
            label="Guardar cambios"
            :loading="saving"
            :disable="!basicsDirty"
          />
          <q-btn
            v-if="whatsapp"
            unelevated
            no-caps
            class="sw-btn sw-btn--secondary"
            icon="fa-brands fa-whatsapp"
            label="Recordar por WhatsApp"
            :href="whatsapp"
            target="_blank"
            rel="noopener noreferrer"
          />
        </div>

        <div class="detail__danger-zone">
          <button type="button" class="detail__link detail__link--danger" @click="confirmRemove">
            Eliminar alumno
          </button>
        </div>
      </q-form>

      <!-- Asistencias -->
      <div v-else-if="activeTab === 'asistencias'" class="detail__panel">
        <div class="detail__panel-head">
          <h2 class="detail__panel-title sw-heading">Asistencias</h2>
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="sym_o_add"
            label="Registrar asistencia"
            class="sw-btn-sm"
            @click="openSessionDialog()"
          />
        </div>

        <empty-state
          v-if="sortedSessions.length === 0"
          icon="sym_o_event_available"
          title="Sin asistencias"
        />

        <button
          v-for="session in sortedSessions"
          :key="session._id"
          type="button"
          class="sw-card detail__session"
          @click="openSessionDialog(session)"
        >
          <div class="detail__session-body">
            <div class="detail__session-top">
              <span class="detail__session-date">
                {{ formatShortDate(session.date, true) }}
              </span>
              <span v-if="session.rating" class="detail__session-stars">
                <q-icon
                  v-for="n in 5"
                  :key="n"
                  name="sym_o_star"
                  size="14px"
                  :class="{ 'detail__session-star--on': n <= session.rating }"
                />
              </span>
            </div>
            <div v-if="session.note" class="detail__session-note">
              {{ session.note }}
            </div>
          </div>
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="sym_o_delete"
            class="detail__row-delete"
            aria-label="Eliminar asistencia"
            @click.stop="confirmRemoveSession(session)"
          />
        </button>
      </div>

      <!-- Pagos -->
      <div v-else-if="activeTab === 'pagos'" class="detail__panel">
        <div class="detail__panel-head">
          <h2 class="detail__panel-title sw-heading">Pagos</h2>
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="sym_o_add"
            label="Registrar pago"
            class="sw-btn-sm"
            @click="confirmPayment"
          />
        </div>

        <!-- Filtros: todos / mensualidad / piscina -->
        <div class="detail__filters" role="tablist" aria-label="Filtrar pagos">
          <button
            v-for="filter in payFilters"
            :key="filter.key"
            type="button"
            role="tab"
            class="detail__filter"
            :class="{ 'detail__filter--active': payFilter === filter.key }"
            :aria-selected="payFilter === filter.key"
            @click="payFilter = filter.key"
          >
            {{ filter.label }}
            <span class="detail__filter-count">{{ filter.count }}</span>
          </button>
        </div>

        <empty-state
          v-if="visiblePayRows.length === 0"
          icon="sym_o_payments"
          :title="payEmptyText"
        />

        <div v-else class="sw-card detail__paytable">
          <div v-for="row in visiblePayRows" :key="row.key" class="detail__payrow">
            <div class="detail__payrow-icon" :class="`detail__payrow-icon--${row.kind}`">
              <q-icon
                :name="row.kind === 'mensualidad' ? 'sym_o_south_west' : 'sym_o_north_east'"
                size="16px"
              />
            </div>
            <div class="detail__payment-body">
              <div class="detail__payment-date">{{ row.title }}</div>
              <div class="detail__payment-meta">{{ row.meta }}</div>
            </div>
            <div
              class="detail__payrow-amount"
              :class="{ 'detail__payrow-amount--in': row.kind === 'mensualidad' }"
            >
              {{ row.kind === 'mensualidad' ? '' : '−' }}{{ formatMoney(row.amount) }}
            </div>
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="sym_o_delete"
              class="detail__row-delete"
              :aria-label="row.kind === 'mensualidad' ? 'Eliminar mensualidad' : 'Eliminar pago de piscina'"
              @click="removePayRow(row)"
            />
          </div>
        </div>
      </div>

      <!-- Mensualidad: siempre editable -->
      <q-form v-else class="detail__panel" @submit.prevent="saveFees">
        <div class="detail__panel-head">
          <h2 class="detail__panel-title sw-heading">Mensualidad</h2>
        </div>
        <div class="sw-card detail__form">
          <div class="detail__grid">
            <money-field
              v-model="fees.monthlyFee"
              label="Mensualidad"
              field-id="detail-fee"
              placeholder="170.000"
            />

            <money-field v-model="fees.poolFee" label="Piscina" field-id="detail-pool" />

            <div>
              <date-field
                v-model="fees.startDate"
                label="Fecha de inicio"
                field-id="detail-start"
                required-message="Elige la fecha"
              />
              <div class="detail__hint">La mensualidad siempre vence este día del mes.</div>
            </div>

            <div>
              <date-field
                v-model="fees.paidThrough"
                label="Pagado hasta"
                field-id="detail-paid-through"
                required-message="Elige la fecha"
              />
              <div class="detail__hint">{{ paidThroughHint }}</div>
            </div>
          </div>
        </div>

        <div class="detail__actions">
          <q-btn
            unelevated
            no-caps
            type="submit"
            color="primary"
            class="sw-btn"
            label="Guardar cambios"
            :loading="saving"
            :disable="!feesDirty"
          />
          <q-btn
            unelevated
            no-caps
            class="sw-btn sw-btn--secondary"
            icon="sym_o_payments"
            label="Registrar pago"
            @click="confirmPayment"
          />
        </div>
      </q-form>
      </div>
    </template>

    <!-- Cargando o alumno inexistente -->
    <div v-else class="sw-page">
      <div v-if="studentsStore.loading" class="sw-card detail__loading">
        <q-skeleton type="circle" size="52px" />
        <div class="detail__loading-lines">
          <q-skeleton type="text" width="40%" />
          <q-skeleton type="text" width="60%" />
        </div>
      </div>
      <div v-else class="sw-card detail__missing">
        <div class="detail__missing-title sw-heading">Este alumno ya no existe</div>
        <q-btn
          unelevated
          no-caps
          color="primary"
          class="sw-btn"
          label="Volver a alumnos"
          @click="goBack"
        />
      </div>
    </div>

    <!-- En móvil, registrar pago siempre a mano. -->
    <q-page-sticky v-if="student" position="bottom-right" :offset="[16, 16]" class="lt-sm">
      <q-btn
        unelevated
        no-caps
        rounded
        color="primary"
        icon="sym_o_payments"
        label="Registrar pago"
        class="detail__fab"
        @click="confirmPayment"
      />
    </q-page-sticky>
  </q-page>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { collection, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from 'src/boot/firebase';
import { useCollection } from 'src/composables/firebase';
import DateField from 'src/components/DateField.vue';
import EmptyState from 'src/components/EmptyState.vue';
import MoneyField from 'src/components/MoneyField.vue';
import RegisterPaymentDialog from 'src/components/RegisterPaymentDialog.vue';
import SessionDialog from 'src/components/SessionDialog.vue';
import { SessionDoc, SessionSchema } from 'src/models/Session';
import { PaymentDoc, PaymentSchema } from 'src/models/Payment';
import { PoolPaymentSchema } from 'src/models/PoolPayment';
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

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const studentsStore = useStudentsStore();

const studentId = computed(() => String(route.params.id ?? ''));

const student = computed(
  () => studentsStore.students.find((s) => s._id === studentId.value) ?? null
);

const goBack = () => router.push('/alumnos');

// Tabs
type TabKey = 'datos' | 'asistencias' | 'pagos' | 'mensualidad';
const activeTab = ref<TabKey>('datos');

// ————— Formularios siempre editables —————
// Nacen del alumno y se re-sincronizan con cambios remotos mientras el
// usuario no los haya tocado.
const basics = reactive({
  name: '',
  document: '',
  age: '' as number | '',
  phone: '',
});
const fees = reactive({
  monthlyFee: 0,
  poolFee: 0,
  startDate: '',
  paidThrough: '',
});
const saving = ref(false);

const resetForms = (s: StudentDoc) => {
  basics.name = s.name;
  basics.document = s.document;
  basics.age = s.age ?? '';
  basics.phone = s.phone;
  fees.monthlyFee = s.monthlyFee;
  fees.poolFee = s.poolFee;
  fees.startDate = s.startDate;
  fees.paidThrough = s.paidThrough;
};

const basicsDirty = computed(() => {
  const s = student.value;
  if (!s) return false;
  return (
    basics.name !== s.name ||
    basics.document !== s.document ||
    (typeof basics.age === 'number' ? basics.age : null) !== s.age ||
    basics.phone !== s.phone
  );
});

const feesDirty = computed(() => {
  const s = student.value;
  if (!s) return false;
  return (
    fees.monthlyFee !== s.monthlyFee ||
    fees.poolFee !== s.poolFee ||
    fees.startDate !== s.startDate ||
    fees.paidThrough !== s.paidThrough
  );
});

// Primer llenado siempre (al montar o cambiar de alumno); los cambios
// remotos posteriores entran solo si aquí no hay edición a medias.
const loadedStudentId = ref('');
watch(
  student,
  (s) => {
    if (!s) return;
    if (loadedStudentId.value !== s._id) {
      resetForms(s);
      loadedStudentId.value = s._id;
      return;
    }
    if (!basicsDirty.value && !feesDirty.value) resetForms(s);
  },
  { immediate: true }
);

const saveStudent = async (patch: Partial<Parameters<typeof studentsStore.updateStudent>[1]>) => {
  const s = student.value;
  if (!s) return;
  saving.value = true;
  try {
    await studentsStore.updateStudent(s._id, {
      name: s.name,
      phone: s.phone,
      document: s.document,
      age: s.age,
      startDate: s.startDate,
      monthlyFee: s.monthlyFee,
      poolFee: s.poolFee,
      paidThrough: s.paidThrough,
      ...patch,
    });
    $q.notify({ message: 'Cambios guardados', color: 'positive' });
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

const saveBasics = () =>
  saveStudent({
    name: basics.name,
    document: basics.document,
    age: typeof basics.age === 'number' ? basics.age : null,
    phone: basics.phone,
  });

const saveFees = () =>
  saveStudent({
    monthlyFee: fees.monthlyFee,
    poolFee: fees.poolFee,
    startDate: fees.startDate,
    paidThrough: fees.paidThrough,
  });

const paidThroughHint = computed(() => {
  if (!fees.paidThrough) return '';
  const s = getStatus(fees.paidThrough);
  return `Con esta fecha queda: ${STATUS_LABEL[s]} · ${dueLabel(fees.paidThrough).toLowerCase()}.`;
});

// ————— Asistencias del alumno —————
const sessionsQuery = computed(() =>
  studentId.value
    ? query(collection(db, 'sessions'), where('studentId', '==', studentId.value))
    : null
);
const { documents: sessions } = useCollection(sessionsQuery, SessionSchema);

const sortedSessions = computed(() =>
  [...sessions.value].sort((a, b) => (a.date < b.date ? 1 : -1))
);

// ————— Pagos del alumno: mensualidades + sus pagos de piscina —————
const paymentsQuery = computed(() =>
  studentId.value
    ? query(collection(db, 'payments'), where('studentId', '==', studentId.value))
    : null
);
const { documents: studentPayments } = useCollection(paymentsQuery, PaymentSchema);

const poolQuery = computed(() =>
  studentId.value
    ? query(collection(db, 'poolPayments'), where('studentId', '==', studentId.value))
    : null
);
const { documents: studentPool } = useCollection(poolQuery, PoolPaymentSchema);

type PayFilter = 'todos' | 'mensualidad' | 'piscina';
const payFilter = ref<PayFilter>('todos');

type PayRow = {
  key: string;
  kind: 'mensualidad' | 'piscina';
  title: string;
  meta: string;
  amount: number;
  date: string;
  payment?: PaymentDoc;
  poolId?: string;
};

const payRows = computed<PayRow[]>(() => {
  const mensualidades = studentPayments.value.map<PayRow>((p) => ({
    key: `m-${p._id}`,
    kind: 'mensualidad',
    title: 'Mensualidad',
    meta: `${formatShortDate(p.date, true)} · cubre hasta ${formatShortDate(p.coversUntil)}`,
    amount: p.amount,
    date: p.date,
    payment: p,
  }));

  const piscina = studentPool.value.map<PayRow>((p) => ({
    key: `p-${p._id}`,
    kind: 'piscina',
    title: 'Piscina',
    meta: formatShortDate(p.date, true),
    amount: p.amount,
    date: p.date,
    poolId: p._id,
  }));

  return [...mensualidades, ...piscina].sort((a, b) => (a.date < b.date ? 1 : -1));
});

const countPayBy = (kind: PayRow['kind']) =>
  payRows.value.filter((r) => r.kind === kind).length;

const payFilters = computed(() => [
  { key: 'todos' as PayFilter, label: 'Todos', count: payRows.value.length },
  { key: 'mensualidad' as PayFilter, label: 'Mensualidad', count: countPayBy('mensualidad') },
  { key: 'piscina' as PayFilter, label: 'Piscina', count: countPayBy('piscina') },
]);

const visiblePayRows = computed(() =>
  payRows.value.filter((r) => payFilter.value === 'todos' || r.kind === payFilter.value)
);

const payEmptyText = computed(() => {
  if (payFilter.value === 'piscina') return 'Sin pagos de piscina';
  if (payFilter.value === 'mensualidad') return 'Sin mensualidades';
  return 'Sin pagos';
});

const removePayRow = (row: PayRow) => {
  if (row.kind === 'mensualidad' && row.payment) confirmRemovePayment(row.payment);
  else if (row.poolId) confirmRemovePool(row.poolId);
};

const confirmRemovePool = (id: string) => {
  $q.dialog({
    title: 'Eliminar pago de piscina',
    message: 'Este pago dejará de restarse del neto del mes.',
    ok: { label: 'Eliminar', color: 'negative', unelevated: true, noCaps: true },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
  }).onOk(async () => {
    await deleteDoc(doc(db, `poolPayments/${id}`));
  });
};

const TABS = computed(() => [
  { key: 'datos' as TabKey, label: 'Datos básicos', count: 0 },
  { key: 'asistencias' as TabKey, label: 'Asistencias', count: sessions.value.length },
  { key: 'pagos' as TabKey, label: 'Pagos', count: payRows.value.length },
  { key: 'mensualidad' as TabKey, label: 'Mensualidad', count: 0 },
]);

// ————— Derivados —————
const due = computed(() => (student.value ? dueLabel(student.value.paidThrough) : ''));

const whatsapp = computed(() => {
  if (!student.value?.phone.trim()) return '';
  return whatsappLink(
    student.value.phone,
    reminderMessage(student.value.name.split(/\s+/)[0] ?? '', due.value)
  );
});

// ————— Acciones —————
// Abre el mismo diálogo de Registrar pago de la app, con este alumno ya
// seleccionado (campos de mensualidad, piscina y "paga hasta" editables).
const confirmPayment = () => {
  if (!student.value) return;
  $q.dialog({
    component: RegisterPaymentDialog,
    componentProps: { studentId: studentId.value },
  });
};

const confirmRemove = () => {
  const chosen = student.value;
  if (!chosen) return;
  $q.dialog({
    title: 'Eliminar alumno',
    message: `Se elimina a ${chosen.name} de la lista. Sus pagos registrados se conservan.`,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true, noCaps: true },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
  }).onOk(async () => {
    await studentsStore.removeStudent(chosen._id);
    $q.notify({ message: 'Alumno eliminado', color: 'dark' });
    goBack();
  });
};

const openSessionDialog = (session?: SessionDoc) => {
  if (!student.value) return;
  $q.dialog({
    component: SessionDialog,
    componentProps: {
      studentId: studentId.value,
      studentName: student.value.name,
      session: session ?? null,
    },
  });
};

const confirmRemoveSession = (session: SessionDoc) => {
  $q.dialog({
    title: 'Eliminar asistencia',
    message: `Se elimina la asistencia del ${formatShortDate(session.date, true)} de la bitácora.`,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true, noCaps: true },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
  }).onOk(async () => {
    await deleteDoc(doc(db, `sessions/${session._id}`));
  });
};

const confirmRemovePayment = (payment: PaymentDoc) => {
  $q.dialog({
    title: 'Eliminar pago',
    message: `Se elimina el pago del ${formatShortDate(payment.date, true)} y la cobertura retrocede un mes.`,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true, noCaps: true },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
  }).onOk(async () => {
    await studentsStore.undoPayment(payment);
  });
};
</script>

<style scoped lang="scss">
// Barra de la pantalla: blanca, pegada arriba, con las tabs integradas.
.detail__bar {
  position: sticky;
  top: 0;
  z-index: 5;
  background: var(--sw-bg);
  border-bottom: 1px solid var(--sw-border);
  padding-top: env(safe-area-inset-top);
}

.detail__bar-inner {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 16px 8px;
}

// Volver: círculo gris suave con chevron.
.detail__back {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sw-surface-2);
  color: var(--sw-text-2);
  cursor: pointer;
  flex-shrink: 0;
  transition: background 120ms var(--sw-ease), color 120ms var(--sw-ease);

  &:hover {
    background: var(--sw-border);
    color: var(--sw-text);
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: 2px;
  }
}

.detail__identity {
  flex: 1;
  min-width: 0;
}

.detail__name {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Tabs subrayadas dentro de la barra.
.detail__tabs {
  max-width: 1100px;
  margin: 0 auto;
  display: flex;
  gap: 2px;
  padding: 0 16px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.detail__tab {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 12px 14px;
  border: 0;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  background: transparent;
  color: var(--sw-text-2);
  font: inherit;
  font-size: 0.8438rem;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  flex-shrink: 0;
  transition: color 120ms var(--sw-ease), border-color 120ms var(--sw-ease);

  &:hover {
    color: var(--sw-text);
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: -2px;
    border-radius: 6px;
  }

  &--active {
    color: var(--sw-primary);
    border-bottom-color: var(--sw-primary);
  }
}

.detail__tab-count {
  font-variant-numeric: tabular-nums;
  font-size: 0.6875rem;
  background: var(--sw-surface-2);
  border-radius: 999px;
  padding: 1px 7px;
}

.detail__tab--active .detail__tab-count {
  background: var(--sw-primary-tint);
}

.detail__panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.detail__panel-title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.2;
}

.detail__panel-summary {
  margin-top: 2px;
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}

// Formularios inline (Datos básicos y Mensualidad).
.detail__form {
  padding: 20px 18px;
  margin-bottom: 14px;
}

.detail__grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
}

@media (min-width: 600px) {
  .detail__grid {
    grid-template-columns: 1fr 1fr;
  }

  .detail__span-2 {
    grid-column: span 2;
  }
}

.detail__hint {
  margin-top: 8px;
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}

// Acciones apiladas: cada botón a todo el ancho.
.detail__actions {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .sw-btn {
    width: 100%;
  }
}

.detail__danger-zone {
  display: flex;
  justify-content: center;
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

// Cada asistencia es una tarjeta.
.detail__session {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  margin-top: 10px;
  padding: 12px 14px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: border-color 120ms var(--sw-ease), box-shadow 120ms var(--sw-ease);

  &:hover {
    border-color: var(--sw-border-strong);
    box-shadow: var(--sw-shadow-md);
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: 2px;
  }
}

.detail__session-body {
  flex: 1;
  min-width: 0;
}

.detail__session-top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.detail__session-date {
  font-weight: 600;
  font-size: 0.875rem;
}

.detail__session-stars {
  display: inline-flex;
  color: var(--sw-border-strong);

  .detail__session-star--on {
    color: var(--sw-warning);
  }
}

.detail__session-note {
  margin-top: 2px;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: var(--sw-text-2);
  white-space: pre-line;
}

// Filtros píldora del historial de pagos.
.detail__filters {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.detail__filter {
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

    .detail__filter-count {
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.detail__filter-count {
  color: var(--sw-text-3);
  font-variant-numeric: tabular-nums;
}

// Historial de pagos: una tarjeta con filas divididas.
.detail__paytable {
  overflow: hidden;
}

.detail__payrow {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;

  & + & {
    border-top: 1px solid var(--sw-border);
  }
}

.detail__payrow-icon {
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

.detail__payrow-amount {
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

.detail__payment-body {
  flex: 1;
  min-width: 0;
}

.detail__payment-date {
  font-weight: 600;
  font-size: 0.875rem;
}

.detail__payment-meta {
  margin-top: 2px;
  font-size: 0.8125rem;
  color: var(--sw-text-2);
}

.detail__payment-amount {
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: #15803d;
  white-space: nowrap;
}

.detail__row-delete {
  color: var(--sw-text-3);
}

.detail__loading {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
}

.detail__loading-lines {
  flex: 1;
}

.detail__missing {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 40px 16px;
  text-align: center;
}

.detail__missing-title {
  font-size: 1.125rem;
  font-weight: 700;
}

.detail__fab {
  height: 52px;
  padding: 0 20px 0 16px;
  font-weight: 700;
  font-size: 0.9375rem;
  box-shadow: 0 10px 28px rgba(19, 124, 184, 0.35);
}
</style>
