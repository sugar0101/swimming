<template>
  <q-page>
    <div class="sw-page">
      <div class="sw-page__head">
        <h1 class="sw-page__title">Asistencias</h1>
        <q-btn
          unelevated
          no-caps
          color="primary"
          icon="sym_o_add"
          label="Registrar asistencia"
          class="sw-btn-sm"
          @click="openRegister()"
        />
      </div>

      <!-- Navegación por día: ayer / calendario / mañana -->
      <div class="att__datebar">
        <q-btn
          unelevated
          round
          dense
          icon="sym_o_chevron_left"
          class="att__nav"
          aria-label="Día anterior"
          @click="shiftDay(-1)"
        />

        <button type="button" class="att__date">
          <q-icon name="sym_o_calendar_month" size="18px" />
          {{ dateTitle }}
          <q-popup-proxy
            ref="calendarPopup"
            transition-show="jump-up"
            transition-hide="jump-down"
            :transition-duration="220"
          >
            <q-date
              :model-value="date"
              minimal
              mask="YYYY-MM-DD"
              class="att__calendar"
              @update:model-value="pickDate"
            />
          </q-popup-proxy>
        </button>

        <q-btn
          unelevated
          round
          dense
          icon="sym_o_chevron_right"
          class="att__nav"
          aria-label="Día siguiente"
          @click="shiftDay(1)"
        />
      </div>

      <!-- Asistencias del día -->
      <div class="att__list">
        <template v-if="loading">
          <div v-for="i in 3" :key="i" class="sw-card att__skeleton">
            <q-skeleton type="circle" size="38px" />
            <q-skeleton type="text" width="50%" />
          </div>
        </template>

        <empty-state
          v-else-if="rows.length === 0"
          icon="sym_o_event_available"
          title="Sin asistencias este día"
          min-height="calc(100vh - 420px)"
        />

        <template v-else>
          <div class="att__count">
            {{ rows.length }} {{ rows.length === 1 ? 'alumno entrenó' : 'alumnos entrenaron' }} este día
          </div>
          <button
            v-for="row in rows"
            :key="row.session._id"
            type="button"
            class="sw-card att__row"
            @click="openRegister(row.session)"
          >
            <div class="att__row-avatar">{{ row.initials }}</div>
            <div class="att__row-body">
              <div class="att__row-name">{{ row.name }}</div>
              <div v-if="row.session.note" class="att__row-note">{{ row.session.note }}</div>
            </div>
            <span v-if="row.session.rating" class="att__row-stars">
              <q-icon
                v-for="n in 5"
                :key="n"
                name="sym_o_star"
                size="14px"
                :class="{ 'att__row-star--on': n <= row.session.rating }"
              />
            </span>
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="sym_o_delete"
              class="att__row-delete"
              aria-label="Eliminar asistencia"
              @click.stop="confirmRemove(row)"
            />
          </button>
        </template>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { QPopupProxy, useQuasar } from 'quasar';
import { collection, deleteDoc, doc, query, where } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { db } from 'src/boot/firebase';
import { useCollection } from 'src/composables/firebase';
import EmptyState from 'src/components/EmptyState.vue';
import SessionDialog from 'src/components/SessionDialog.vue';
import { SessionDoc, SessionSchema } from 'src/models/Session';
import { useStudentsStore } from 'src/stores/students-store';
import { todayIso } from 'src/utils/dates';

const $q = useQuasar();
const studentsStore = useStudentsStore();

const date = ref(todayIso());
const calendarPopup = ref<QPopupProxy | null>(null);

const isToday = computed(() => date.value === todayIso());

// "Hoy · miércoles 3 sep" / "martes 2 sep 2026"
const dateTitle = computed(() => {
  const label = format(parseISO(date.value), 'EEEE d MMM', { locale: es });
  const pretty = label.charAt(0).toUpperCase() + label.slice(1);
  return isToday.value ? `Hoy · ${pretty}` : pretty;
});

const shiftDay = (delta: number) => {
  const next = new Date(parseISO(date.value));
  next.setDate(next.getDate() + delta);
  date.value = format(next, 'yyyy-MM-dd');
};

const pickDate = (value: string | null) => {
  if (value) date.value = value;
  calendarPopup.value?.hide();
};

// Asistencias del día seleccionado, en vivo.
const sessionsQuery = computed(() =>
  query(collection(db, 'sessions'), where('date', '==', date.value))
);
const { documents: sessions, loading } = useCollection(sessionsQuery, SessionSchema);

// Une cada asistencia con el nombre del alumno (del store global).
const rows = computed(() =>
  sessions.value
    .map((session) => {
      const student = studentsStore.students.find((s) => s._id === session.studentId);
      const name = student?.name ?? 'Alumno eliminado';
      return {
        session,
        name,
        initials: name
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? '')
          .join(''),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name))
);

const openRegister = (session?: SessionDoc) => {
  $q.dialog({
    component: SessionDialog,
    componentProps: {
      session: session ?? null,
      studentId: session?.studentId ?? null,
      studentName: session
        ? studentsStore.students.find((s) => s._id === session.studentId)?.name ?? ''
        : null,
      defaultDate: date.value,
    },
  });
};

const confirmRemove = (row: { session: SessionDoc; name: string }) => {
  $q.dialog({
    title: 'Eliminar asistencia',
    message: `Se elimina la asistencia de ${row.name} de este día.`,
    ok: { label: 'Eliminar', color: 'negative', unelevated: true, noCaps: true },
    cancel: { label: 'Cancelar', flat: true, noCaps: true },
  }).onOk(async () => {
    await deleteDoc(doc(db, `sessions/${row.session._id}`));
  });
};
</script>

<style scoped lang="scss">
.att__datebar {
  display: flex;
  align-items: center;
  gap: 12px;
}

// Círculos del mismo alto que la píldora central: todo respira igual.
.att__nav {
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

.att__date {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  height: 46px;
  border-radius: 999px;
  border: 1px solid var(--sw-border);
  background: var(--sw-bg);
  box-shadow: var(--sw-shadow-sm);
  font: inherit;
  font-family: var(--sw-font-heading);
  font-size: 0.9375rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--sw-text);
  cursor: pointer;
  transition: border-color 120ms var(--sw-ease);

  .q-icon {
    color: var(--sw-primary);
  }

  &:hover {
    border-color: var(--sw-border-strong);
  }

  &:focus-visible {
    outline: 2px solid var(--sw-primary);
    outline-offset: 2px;
  }
}

.att__list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.att__count {
  font-size: 0.8125rem;
  color: var(--sw-text-2);
  padding: 0 2px;
}

.att__skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;

  .q-skeleton--type-text {
    flex: 1;
  }
}

.att__row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  font: inherit;
  color: inherit;
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

.att__row-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 0.75rem;
  flex-shrink: 0;
  background: var(--sw-primary-tint);
  color: #0e5c8a;
}

.att__row-body {
  flex: 1;
  min-width: 0;
}

.att__row-name {
  font-weight: 600;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.att__row-note {
  margin-top: 1px;
  font-size: 0.7813rem;
  color: var(--sw-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.att__row-stars {
  display: inline-flex;
  color: var(--sw-border-strong);
  flex-shrink: 0;

  .att__row-star--on {
    color: var(--sw-warning);
  }
}

.att__row-delete {
  color: var(--sw-text-3);
  flex-shrink: 0;
}
</style>

<style lang="scss">
// El calendario vive en un portal: estilo global.
.att__calendar {
  border-radius: var(--sw-radius-lg);
  box-shadow: 0 18px 48px rgba(16, 24, 40, 0.18);
}
</style>
