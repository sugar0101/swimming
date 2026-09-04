<template>
  <div ref="wrap" class="barchart" :style="{ height: `${height}px` }">
    <svg
      v-if="width > 0"
      :width="width"
      :height="height"
      role="img"
      :aria-label="ariaLabel"
    >
      <!-- Eje Y: solo cifras discretas, sin rejilla que compita con las barras -->
      <text
        v-for="tick in ticks"
        :key="tick"
        :x="pad.left - 10"
        :y="yFor(tick) + 3"
        text-anchor="end"
        class="barchart__tick"
      >
        {{ formatTick(tick) }}
      </text>

      <!-- Barras píldora: tinte suave; la destacada (pico u hover) en azul pleno -->
      <rect
        v-for="(point, i) in points"
        :key="point.key"
        :x="bandCenter(i) - barWidth / 2"
        :y="topFor(point)"
        :width="barWidth"
        :height="yFor(0) - topFor(point)"
        :rx="barWidth / 2"
        class="barchart__bar"
        :class="{
          'barchart__bar--hot': i === activeIndex && point.value > 0,
          'barchart__bar--zero': point.value === 0,
        }"
      />

      <!-- Etiquetas del eje X (subconjunto para no amontonar) -->
      <text
        v-for="i in labelIndexes"
        :key="`label-${i}`"
        :x="bandCenter(i)"
        :y="height - 8"
        text-anchor="middle"
        class="barchart__label"
        :class="{ 'barchart__label--hot': i === activeIndex }"
      >
        {{ points[i]?.label }}
      </text>

      <!-- Zonas de toque: más anchas que la barra; hover y foco de teclado -->
      <rect
        v-for="(point, i) in points"
        :key="`hit-${point.key}`"
        :x="pad.left + i * band"
        :y="0"
        :width="band"
        :height="height"
        class="barchart__hit"
        tabindex="0"
        :aria-label="`${point.title}: ${formatValue(point.value)}`"
        @pointerenter="hoverIndex = i"
        @pointerleave="hoverIndex = null"
        @focus="hoverIndex = i"
        @blur="hoverIndex = null"
      />
    </svg>

    <!-- Tooltip píldora oscura, fijo sobre la barra activa (pico u hover) -->
    <div v-if="active && active.value > 0" class="barchart__tip" :style="tipStyle">
      {{ formatValue(active.value) }}
    </div>

    <div v-if="isEmpty" class="barchart__empty">{{ emptyText }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

// Barras de una sola serie (el título de la tarjeta nombra la serie: sin
// leyenda). Estética de referencia: barras gruesas totalmente redondeadas en
// un tinte del azul, con la barra pico destacada en azul pleno y su valor en
// un tooltip píldora fijo; al pasar el mouse la destacada es la barra bajo el
// cursor. Accesible por teclado (cada barra recibe foco) y sin rejilla.
export type BarPoint = {
  key: string;
  // Etiqueta corta del eje X ("28 ago") y título completo del tooltip/aria.
  label: string;
  title: string;
  value: number;
};

const props = withDefaults(
  defineProps<{
    points: BarPoint[];
    ariaLabel: string;
    formatValue?: (n: number) => string;
    formatTick?: (n: number) => string;
    height?: number;
    emptyText?: string;
  }>(),
  {
    formatValue: (n: number) => n.toLocaleString('es-CO'),
    formatTick: (n: number) => n.toLocaleString('es-CO'),
    height: 224,
    emptyText: 'Sin datos en este rango.',
  }
);

const wrap = ref<HTMLElement | null>(null);
const width = ref(0);
let observer: ResizeObserver | null = null;

onMounted(() => {
  observer = new ResizeObserver((entries) => {
    width.value = Math.floor(entries[0]?.contentRect.width ?? 0);
  });
  if (wrap.value) observer.observe(wrap.value);
});

onBeforeUnmount(() => observer?.disconnect());

// El margen superior deja aire para el tooltip píldora.
const pad = { top: 40, right: 6, bottom: 26, left: 44 };

const maxValue = computed(() => Math.max(0, ...props.points.map((p) => p.value)));
const isEmpty = computed(() => props.points.every((p) => p.value === 0));

// Techo "bonito" del eje: 1 / 2 / 2.5 / 5 x 10^k.
const niceMax = computed(() => {
  const max = maxValue.value;
  if (max <= 0) return 4;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  for (const step of [1, 2, 2.5, 5, 10]) {
    if (step * pow >= max) return step * pow;
  }
  return 10 * pow;
});

const ticks = computed(() => [0, niceMax.value / 2, niceMax.value]);

const plotHeight = computed(() => props.height - pad.top - pad.bottom);

const yFor = (value: number) =>
  pad.top + plotHeight.value * (1 - value / niceMax.value);

// Tope de la barra; las de valor cero muestran un tocón de 5px como pista
// del carril (en gris, nunca en el color de datos).
const topFor = (point: BarPoint) =>
  point.value === 0 ? yFor(0) - 5 : Math.min(yFor(point.value), yFor(0) - 5);

const band = computed(() => {
  const inner = width.value - pad.left - pad.right;
  return props.points.length > 0 ? inner / props.points.length : inner;
});

const bandCenter = (i: number) => pad.left + i * band.value + band.value / 2;

// Barra gruesa tipo píldora, con aire entre vecinas.
const barWidth = computed(() => Math.max(4, Math.min(20, band.value * 0.55)));

// Subconjunto de etiquetas X: como máximo ~8, siempre la primera.
const labelIndexes = computed(() => {
  const n = props.points.length;
  if (n === 0) return [] as number[];
  const step = Math.max(1, Math.ceil(n / 8));
  const result: number[] = [];
  for (let i = 0; i < n; i += step) result.push(i);
  return result;
});

// Barra activa: la que está bajo el cursor o, en reposo, la del pico.
const hoverIndex = ref<number | null>(null);

const peakIndex = computed(() => {
  if (maxValue.value <= 0) return null;
  return props.points.findIndex((p) => p.value === maxValue.value);
});

const activeIndex = computed(() => hoverIndex.value ?? peakIndex.value);
const active = computed(() =>
  activeIndex.value === null ? null : props.points[activeIndex.value] ?? null
);

const tipStyle = computed(() => {
  if (activeIndex.value === null || !active.value) return {};
  const x = Math.min(Math.max(bandCenter(activeIndex.value), 56), width.value - 56);
  return { left: `${x}px`, top: `${topFor(active.value) - 8}px` };
});
</script>

<style scoped lang="scss">
.barchart {
  position: relative;
  width: 100%;
}

.barchart__tick,
.barchart__label {
  font-family: var(--sw-font-body);
  font-size: 0.6875rem;
  fill: var(--sw-text-3);
}

.barchart__tick {
  font-variant-numeric: tabular-nums;
}

.barchart__label--hot {
  fill: var(--sw-text);
  font-weight: 600;
}

.barchart__bar {
  fill: rgba(19, 124, 184, 0.16);
  transition: fill 140ms var(--sw-ease), y 200ms var(--sw-ease),
    height 200ms var(--sw-ease);

  &--hot {
    fill: var(--sw-primary);
  }

  &--zero {
    fill: var(--sw-border);
  }
}

.barchart__hit {
  fill: transparent;
  outline: none;
}

.barchart__tip {
  position: absolute;
  transform: translate(-50%, -100%);
  padding: 6px 12px;
  border-radius: 999px;
  background: var(--sw-text);
  color: #fff;
  font-family: var(--sw-font-heading);
  font-weight: 700;
  font-size: 0.8125rem;
  line-height: 1.2;
  pointer-events: none;
  white-space: nowrap;
  z-index: 2;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.25);
  transition: left 160ms var(--sw-ease), top 160ms var(--sw-ease);

  // Puntica del tooltip.
  &::after {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -4px;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid var(--sw-text);
  }
}

.barchart__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8125rem;
  color: var(--sw-text-3);
  pointer-events: none;
}
</style>
