<template>
  <q-page>
    <div class="sw-page">
      <div class="sw-page__head">
        <h1 class="sw-page__title">Alumnos</h1>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="sym_o_add"
          label="Nuevo alumno"
          class="sw-btn-sm"
          @click="openStudentForm()"
        />
      </div>

      <div class="sw-field">
        <q-input
          v-model="search"
          borderless
          dense
          clearable
          clear-icon="sym_o_close"
          placeholder="Buscar por nombre o teléfono"
          class="students__search"
        >
          <template #prepend>
            <q-icon name="sym_o_search" size="20px" />
          </template>
        </q-input>
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

      <div class="students__list">
        <template v-if="studentsStore.loading">
          <div v-for="i in 4" :key="i" class="students__skeleton sw-card">
            <q-skeleton type="circle" size="42px" />
            <div class="students__skeleton-lines">
              <q-skeleton type="text" width="45%" />
              <q-skeleton type="text" width="65%" />
            </div>
          </div>
        </template>

        <empty-state
          v-else-if="studentsStore.activeStudents.length === 0"
          icon="sym_o_pool"
          title="Aún no hay alumnos"
          min-height="calc(100vh - 420px)"
        />

        <empty-state
          v-else-if="visibleStudents.length === 0"
          icon="sym_o_search_off"
          title="Ningún alumno coincide"
          min-height="calc(100vh - 420px)"
        />

        <div v-else class="sw-card students__table">
          <div class="sw-thead students__thead">
            <span class="students__th-who">Alumno</span>
            <span class="students__th-status">Estado</span>
            <span class="students__th-due">Vence</span>
            <span class="students__th-fee">Mensualidad</span>
            <span class="students__th-chevron" />
          </div>
          <student-row
            v-for="student in visibleStudents"
            :key="student._id"
            :student="student"
            @select="goDetail"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import EmptyState from 'src/components/EmptyState.vue';
import StudentRow from 'src/components/StudentRow.vue';
import StudentFormDialog from 'src/components/StudentFormDialog.vue';
import { useStudentsStore } from 'src/stores/students-store';
import { StudentDoc } from 'src/models/Student';
import { getStatus, SubscriptionStatus } from 'src/utils/subscription';

type FilterKey = 'todos' | SubscriptionStatus;

const $q = useQuasar();
const router = useRouter();
const studentsStore = useStudentsStore();

const activeFilter = ref<FilterKey>('todos');
const search = ref('');

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

const goDetail = (student: StudentDoc) => {
  router.push(`/alumnos/${student._id}`);
};

const openStudentForm = () => {
  $q.dialog({ component: StudentFormDialog, componentProps: { student: null } });
};
</script>

<style scoped lang="scss">
.students__search {
  :deep(.q-field__control) {
    padding: 0 18px;
  }

  :deep(.q-field__prepend) {
    color: var(--sw-text-3);
    padding-right: 10px;
  }
}

.students__filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
  margin: 12px -16px 0;
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

.students__list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

// Tabla-tarjeta: todas las filas en una tarjeta con divisores hairline.
.students__table {
  overflow: hidden;
}

.students__thead {
  display: none;
}

@media (min-width: 760px) {
  .students__thead {
    display: flex;
  }

  .students__th-who {
    flex: 1;
  }

  .students__th-status {
    width: 92px;
    flex-shrink: 0;
  }

  .students__th-due {
    width: 140px;
    flex-shrink: 0;
  }

  .students__th-fee {
    width: 84px;
    flex-shrink: 0;
    text-align: right;
  }

  .students__th-chevron {
    width: 18px;
    flex-shrink: 0;
  }
}

.students__skeleton {
  display: flex;
  gap: 14px;
  padding: 14px;
  align-items: center;
}

.students__skeleton-lines {
  flex: 1;
}

</style>
