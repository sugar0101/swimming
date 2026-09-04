<template>
  <q-page class="students">
    <!-- Banda superior: marca + tarjetas de datos del mes. -->
    <header class="students__band">
      <div class="students__band-inner">
        <div class="students__brand">
          <app-logo :size="40" class="students__logo" />
          <div class="students__brand-text">
            <div class="students__brand-name sw-heading">Swimming is Cool</div>
            <div class="students__brand-sub">Training Center · {{ monthTitle }}</div>
          </div>
          <q-btn
            flat
            round
            dense
            icon="sym_o_logout"
            class="students__logout"
            aria-label="Cerrar sesión"
            @click="onLogout"
          />
        </div>

        <div class="students__stats">
          <stat-card label="Alumnos" :value="studentsStore.counts.total" />
          <stat-card label="Al día" :value="studentsStore.counts.alDia" />
          <stat-card label="Deben" :value="studentsStore.counts.deben" />
          <stat-card
            label="Recaudado"
            :value="formatMoney(paymentsStore.collected)"
            clickable
            @click="cashSheetOpen = true"
          />
          <stat-card
            label="Piscina"
            :value="`−${formatMoney(paymentsStore.poolCost)}`"
            clickable
            @click="cashSheetOpen = true"
          />
          <stat-card
            label="Neto"
            :value="formatMoney(paymentsStore.net)"
            accent
            clickable
            @click="cashSheetOpen = true"
          />
        </div>

        <button type="button" class="students__cash-link" @click="cashSheetOpen = true">
          Ver caja del mes
          <q-icon name="sym_o_chevron_right" size="16px" />
        </button>
      </div>
    </header>

    <div class="students__inner">
      <div class="students__head">
        <h1 class="students__title sw-heading">Alumnos</h1>
        <q-btn
          unelevated
          no-caps
          dense
          color="primary"
          icon="sym_o_add"
          label="Nuevo alumno"
          class="students__add gt-xs"
          @click="openStudentForm()"
        />
      </div>

      <!-- Los filtros son también el resumen: cada uno lleva su número. -->
      <div class="students__filters" role="tablist" aria-label="Filtrar por estado">
        <button
          v-for="filter in filters"
          :key="filter.key"
          type="button"
          role="tab"
          class="students__filter"
          :class="{ 'students__filter--active': activeFilter === filter.key }"
          :aria-selected="activeFilter === filter.key"
          @click="activeFilter = filter.key"
        >
          <span v-if="filter.dot" class="students__filter-dot" :style="{ background: filter.dot }" />
          {{ filter.label }}
          <span class="students__filter-count">{{ filter.count }}</span>
        </button>
      </div>

      <q-input
        v-if="studentsStore.activeStudents.length > 6"
        v-model="search"
        borderless
        dense
        clearable
        clear-icon="sym_o_close"
        placeholder="Buscar alumno"
        class="students__search"
      >
        <template #prepend>
          <q-icon name="sym_o_search" size="20px" />
        </template>
      </q-input>

      <div class="students__list">
        <template v-if="studentsStore.loading">
          <div v-for="i in 4" :key="i" class="students__skeleton">
            <q-skeleton type="circle" size="42px" />
            <div class="students__skeleton-lines">
              <q-skeleton type="text" width="45%" />
              <q-skeleton type="text" width="65%" />
            </div>
          </div>
        </template>

        <div v-else-if="studentsStore.activeStudents.length === 0" class="students__empty">
          <div class="students__empty-icon">
            <q-icon name="sym_o_pool" size="30px" />
          </div>
          <div class="students__empty-title">Aún no hay alumnos</div>
          <p class="students__empty-hint">
            Agrega el primero para empezar a llevar las mensualidades.
          </p>
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="sw-btn"
            icon="sym_o_add"
            label="Agregar alumno"
            @click="openStudentForm()"
          />
        </div>

        <div v-else-if="visibleStudents.length === 0" class="students__empty students__empty--compact">
          <div class="students__empty-title">Nada por aquí</div>
          <p class="students__empty-hint">Ningún alumno coincide con este filtro.</p>
        </div>

        <template v-else>
          <student-row
            v-for="student in visibleStudents"
            :key="student._id"
            :student="student"
            @select="openDetail"
          />
        </template>
      </div>
    </div>

    <!-- En móvil, crear alumno es el único botón fijo de la pantalla. -->
    <q-page-sticky
      v-if="studentsStore.activeStudents.length > 0"
      position="bottom-right"
      :offset="[16, 16]"
      class="lt-sm"
    >
      <q-btn
        unelevated
        no-caps
        rounded
        color="primary"
        icon="sym_o_add"
        label="Nuevo alumno"
        class="students__fab"
        @click="openStudentForm()"
      />
    </q-page-sticky>

    <student-form-dialog v-model="studentDialog" :student="editingStudent" />
    <student-detail-sheet
      v-model="detailDialog"
      :student="selectedStudent"
      @pay="confirmPayment"
      @edit="openStudentForm"
      @remove="confirmRemove"
    />
    <cash-sheet v-model="cashSheetOpen" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import AppLogo from 'src/components/AppLogo.vue';
import StatCard from 'src/components/StatCard.vue';
import StudentRow from 'src/components/StudentRow.vue';
import StudentFormDialog from 'src/components/StudentFormDialog.vue';
import StudentDetailSheet from 'src/components/StudentDetailSheet.vue';
import CashSheet from 'src/components/CashSheet.vue';
import { useAuthStore } from 'src/stores/auth-store';
import { useStudentsStore } from 'src/stores/students-store';
import { usePaymentsStore } from 'src/stores/payments-store';
import { StudentDoc } from 'src/models/Student';
import { formatMoney } from 'src/utils/money';
import { formatMonthName, formatShortDate } from 'src/utils/dates';
import { coverageAfterPayment, getStatus, SubscriptionStatus } from 'src/utils/subscription';

type FilterKey = 'todos' | SubscriptionStatus;

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();
const studentsStore = useStudentsStore();
const paymentsStore = usePaymentsStore();

const monthTitle = computed(() => {
  const name = formatMonthName(paymentsStore.month);
  return name.charAt(0).toUpperCase() + name.slice(1);
});

const onLogout = async () => {
  await authStore.logout();
  await router.replace('/login');
};

const activeFilter = ref<FilterKey>('todos');
const search = ref('');
const cashSheetOpen = ref(false);

const statusOf = (student: StudentDoc) => getStatus(student.paidThrough);

const countBy = (key: SubscriptionStatus) =>
  studentsStore.activeStudents.filter((s) => statusOf(s) === key).length;

const filters = computed(() => [
  { key: 'todos' as FilterKey, label: 'Todos', count: studentsStore.activeStudents.length, dot: '' },
  { key: 'debe' as FilterKey, label: 'Deben', count: countBy('debe'), dot: 'var(--sw-danger)' },
  {
    key: 'vence_pronto' as FilterKey,
    label: 'Vencen pronto',
    count: countBy('vence_pronto'),
    dot: 'var(--sw-warning)',
  },
  { key: 'al_dia' as FilterKey, label: 'Al día', count: countBy('al_dia'), dot: 'var(--sw-success)' },
]);

// Orden: primero quienes deben, luego los que vencen pronto, luego al día;
// dentro de cada grupo, por fecha de vencimiento.
const ORDER: Record<SubscriptionStatus, number> = { debe: 0, vence_pronto: 1, al_dia: 2 };

const visibleStudents = computed(() => {
  const term = (search.value ?? '').trim().toLowerCase();
  return studentsStore.activeStudents
    .filter((s) => activeFilter.value === 'todos' || statusOf(s) === activeFilter.value)
    .filter((s) => !term || s.name.toLowerCase().includes(term) || s.phone.includes(term))
    .sort((a, b) => {
      const byStatus = ORDER[statusOf(a)] - ORDER[statusOf(b)];
      if (byStatus !== 0) return byStatus;
      return a.paidThrough < b.paidThrough ? -1 : 1;
    });
});

const studentDialog = ref(false);
const editingStudent = ref<StudentDoc | null>(null);
const detailDialog = ref(false);
const selectedStudent = ref<StudentDoc | null>(null);

const openStudentForm = (student?: StudentDoc) => {
  detailDialog.value = false;
  editingStudent.value = student ?? null;
  studentDialog.value = true;
};

const openDetail = (student: StudentDoc) => {
  selectedStudent.value = student;
  detailDialog.value = true;
};

const confirmPayment = (student: StudentDoc) => {
  detailDialog.value = false;
  const coversUntil = formatShortDate(coverageAfterPayment(student), true);
  $q.dialog({
    title: 'Registrar pago',
    message: `${student.name} paga ${formatMoney(student.monthlyFee)} de la mensualidad y queda al día hasta el ${coversUntil}.`,
    ok: { label: 'Registrar', color: 'primary', unelevated: true, noCaps: true },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
  }).onOk(async () => {
    try {
      await studentsStore.registerPayment(student);
      $q.notify({ message: 'Pago registrado', color: 'positive' });
    } catch (error) {
      console.error(error);
      $q.notify({ message: 'No se pudo registrar el pago.', color: 'negative' });
    }
  });
};

const confirmRemove = (student: StudentDoc) => {
  detailDialog.value = false;
  $q.dialog({
    title: 'Eliminar alumno',
    message: `Se elimina a ${student.name} de la lista. Sus pagos registrados se conservan.`,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true, noCaps: true },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
  }).onOk(async () => {
    await studentsStore.removeStudent(student._id);
    $q.notify({ message: 'Alumno eliminado', color: 'dark' });
  });
};
</script>

<style scoped lang="scss">
.students {
  background: var(--sw-bg);
}

// Banda azul: la marca y los datos del mes viven aquí.
.students__band {
  background: linear-gradient(160deg, #0e4f7e 0%, #137cb8 55%, #2aa3d8 100%);
  color: #fff;
  padding-top: env(safe-area-inset-top);
}

.students__band-inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 16px 16px 20px;
}

.students__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.students__logo {
  border-radius: 12px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.35);
}

.students__brand-text {
  flex: 1;
  min-width: 0;
}

.students__brand-name {
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1.2;
  white-space: nowrap;
}

.students__brand-sub {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.75);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.students__logout {
  color: rgba(255, 255, 255, 0.85);
}

.students__stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

@media (min-width: 600px) {
  .students__stats {
    gap: 12px;
  }
}

.students__cash-link {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  margin-top: 12px;
  padding: 4px 0;
  border: 0;
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: #fff;
  }

  &:focus-visible {
    outline: 2px solid #fff;
    outline-offset: 2px;
    border-radius: 4px;
  }
}

.students__inner {
  max-width: 720px;
  margin: 0 auto;
  padding: 20px 16px 110px;
}

@media (min-width: 600px) {
  .students__inner {
    padding-bottom: 48px;
  }
}

.students__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.students__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.students__add {
  border-radius: 999px;
  padding: 0 14px 0 10px;
  height: 36px;
  font-weight: 600;
}

.students__filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  margin: 0 -16px;
  padding: 0 16px 4px;

  &::-webkit-scrollbar {
    display: none;
  }
}

.students__filter {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 12px;
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

    .students__filter-count {
      color: rgba(255, 255, 255, 0.7);
    }
  }
}

.students__filter-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.students__filter-count {
  color: var(--sw-text-3);
  font-variant-numeric: tabular-nums;
}

.students__search {
  margin-top: 12px;

  :deep(.q-field__control) {
    height: 42px;
    border-radius: 10px;
    background: var(--sw-surface-2);
    padding: 0 12px;
  }

  :deep(.q-field__prepend) {
    color: var(--sw-text-3);
  }
}

.students__list {
  margin-top: 8px;
}

.students__skeleton {
  display: flex;
  gap: 14px;
  padding: 14px 4px;
  align-items: center;
}

.students__skeleton-lines {
  flex: 1;
}

.students__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 16px 24px;

  &--compact {
    padding: 36px 16px;
  }
}

.students__empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--sw-primary-tint);
  color: var(--sw-primary);
  margin-bottom: 16px;
}

.students__empty-title {
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 1.125rem;
}

.students__empty-hint {
  margin: 6px 0 20px;
  max-width: 280px;
  font-size: 0.9375rem;
  color: var(--sw-text-2);
}

.students__fab {
  height: 52px;
  padding: 0 20px 0 16px;
  font-weight: 700;
  font-size: 0.9375rem;
  box-shadow: 0 10px 28px rgba(19, 124, 184, 0.35);
}
</style>
