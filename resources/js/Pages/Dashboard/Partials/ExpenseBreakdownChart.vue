<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const props = defineProps({
    items: { type: Array, required: true },
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

const chartOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (context) => formatAmount(context.parsed.x),
            },
        },
    },
    scales: {
        x: {
            beginAtZero: true,
            grid: { color: GRIDLINE_COLOR },
            border: { color: AXIS_COLOR },
            ticks: { callback: (value) => formatAmount(value) },
        },
        y: {
            grid: { display: false },
            border: { color: AXIS_COLOR },
        },
    },
};

const chartHeight = computed(() => Math.max(120, props.items.length * 36));
</script>

<template>
    <div v-if="items.length === 0" class="text-muted small py-4 text-center">
        Sense despeses aquest mes.
    </div>
    <div v-else :style="{ height: chartHeight + 'px' }">
        <Bar :data="chartData" :options="chartOptions" />
    </div>
</template>
