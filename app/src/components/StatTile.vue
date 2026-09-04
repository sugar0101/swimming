<template>
  <div class="tile">
    <div class="tile__main">
      <div class="tile__label">{{ label }}</div>
      <div class="tile__value sw-heading">{{ value }}</div>
      <div class="tile__delta">
        <template v-if="delta !== null">
          <span class="tile__delta-badge" :class="deltaClass">
            <q-icon
              :name="delta >= 0 ? 'sym_o_arrow_upward' : 'sym_o_arrow_downward'"
              size="12px"
            />
            {{ deltaText }}
          </span>
          <span class="tile__delta-label">{{ deltaLabel }}</span>
        </template>
        <span v-else class="tile__delta-label">{{ deltaLabel }}</span>
      </div>
    </div>

    <!-- Sparkline: la forma del rango, sin ejes -->
    <svg
      v-if="sparkPath"
      class="tile__spark"
      :width="SPARK_W"
      :height="SPARK_H"
      aria-hidden="true"
    >
      <path :d="sparkPath" class="tile__spark-line" :class="sparkClass" />
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

// Tile de analítica: etiqueta + cifra grande + delta contra el periodo
// anterior + sparkline con la forma del rango. El delta es null cuando no
// hay periodo previo con qué comparar (se muestra solo la etiqueta).
const props = withDefaults(
  defineProps<{
    label: string;
    value: string | number;
    // Variación porcentual vs el periodo anterior (null = sin comparación).
    delta?: number | null;
    deltaLabel?: string;
    spark?: number[];
    // En costos (piscina) subir es malo: invierte el color del delta.
    invert?: boolean;
  }>(),
  { delta: null, deltaLabel: '', spark: () => [], invert: false }
);

const SPARK_W = 84;
const SPARK_H = 34;

const deltaText = computed(() => {
  const d = props.delta ?? 0;
  const rounded = Math.abs(d) >= 100 ? Math.round(d) : Math.round(d * 10) / 10;
  return `${d >= 0 ? '+' : ''}${rounded.toLocaleString('es-CO')}%`;
});

const isGood = computed(() => {
  const d = props.delta ?? 0;
  return props.invert ? d <= 0 : d >= 0;
});

const deltaClass = computed(() =>
  isGood.value ? 'tile__delta-badge--up' : 'tile__delta-badge--down'
);

const sparkClass = computed(() => {
  if (props.delta === null) return 'tile__spark-line--flat';
  return isGood.value ? 'tile__spark-line--up' : 'tile__spark-line--down';
});

// Polilínea suavizada con los puntos del rango.
const sparkPath = computed(() => {
  const values = props.spark;
  if (values.length < 2 || values.every((v) => v === values[0])) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = (SPARK_W - 4) / (values.length - 1);
  const coords = values.map((v, i) => ({
    x: 2 + i * step,
    y: 3 + (SPARK_H - 6) * (1 - (v - min) / span),
  }));
  const [first, ...rest] = coords;
  if (!first) return '';
  // Curva suave: puntos de control a mitad de camino entre vecinos.
  let d = `M ${first.x} ${first.y}`;
  for (let i = 0; i < rest.length; i += 1) {
    const prev = coords[i];
    const curr = rest[i];
    if (!prev || !curr) continue;
    const midX = (prev.x + curr.x) / 2;
    d += ` C ${midX} ${prev.y}, ${midX} ${curr.y}, ${curr.x} ${curr.y}`;
  }
  return d;
});
</script>

<style scoped lang="scss">
.tile {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 18px;
  background: var(--sw-bg);
  border: 1px solid var(--sw-border);
  border-radius: var(--sw-radius-lg);
  box-shadow: var(--sw-shadow-sm);
  min-width: 0;
}

.tile__main {
  min-width: 0;
}

.tile__label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--sw-text-2);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile__value {
  margin-top: 4px;
  font-size: clamp(1.375rem, 2.4vw, 1.75rem);
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1.05;
  white-space: nowrap;
}

.tile__delta {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 18px;
}

.tile__delta-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 0.75rem;
  font-weight: 700;

  &--up {
    color: #15803d;
  }
  &--down {
    color: #b91c1c;
  }
}

.tile__delta-label {
  font-size: 0.75rem;
  color: var(--sw-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile__spark {
  flex-shrink: 0;
}

.tile__spark-line {
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;

  &--up {
    stroke: var(--sw-success);
  }
  &--down {
    stroke: var(--sw-danger);
  }
  &--flat {
    stroke: var(--sw-border-strong);
  }
}
</style>
