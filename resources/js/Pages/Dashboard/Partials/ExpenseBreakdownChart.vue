<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const props = defineProps({
    items: { type: Array, required: true },
    // Horizontal (default): one row per item, the card grows taller as items are added —
    // best when there are few items and names need room to stay readable.
    // Vertical: fixed card height, grows wider instead (horizontal scroll) — best when
    // there can be many items and an ever-taller card would be worse than a bit of scroll.
    horizontal: { type: Boolean, default: true },
});

// Validated sequential single-hue blue (step 450) from the dataviz palette —
// magnitude here is already encoded by bar length, so one flat hue is enough.
const BAR_COLOR = '#2a78d6';
const GRIDLINE_COLOR = '#e1e0d9';
const AXIS_COLOR = '#c3c2b7';

function formatAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

const chartData = computed(() => ({
    labels: props.items.map((item) => item.name),
    datasets: [
        {
            data: props.items.map((item) => item.total),
            backgroundColor: BAR_COLOR,
            borderRadius: 4,
            maxBarThickness: 24,
        },
    ],
}));

const valueAxis = computed(() => ({
    beginAtZero: true,
    grid: { color: GRIDLINE_COLOR },
    border: { color: AXIS_COLOR },
    ticks: { callback: (value) => formatAmount(value) },
}));

const labelAxis = {
    grid: { display: false },
    border: { color: AXIS_COLOR },
};

const chartOptions = computed(() => ({
    indexAxis: props.horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (context) => formatAmount(props.horizontal ? context.parsed.x : context.parsed.y),
            },
        },
    },
    scales: props.horizontal
        ? { x: valueAxis.value, y: labelAxis }
        : { y: valueAxis.value, x: labelAxis },
}));

const chartHeight = computed(() => (props.horizontal ? Math.max(120, props.items.length * 36) : 260));
const chartMinWidth = computed(() => Math.max(props.items.length * 50, 240));
</script>

<template>
    <div v-if="items.length === 0" class="text-muted small py-4 text-center">
        Sense despeses aquest mes.
    </div>
    <div
        v-else
        :style="{ height: chartHeight + 'px' }"
        :class="{ 'overflow-x-auto': !horizontal }"
    >
        <div :style="horizontal ? { height: '100%' } : { minWidth: chartMinWidth + 'px', height: '100%' }">
            <Bar :data="chartData" :options="chartOptions" />
        </div>
    </div>
</template>
