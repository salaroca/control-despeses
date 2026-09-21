<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const props = defineProps({
    items: { type: Array, required: true },
});

// Diverging: green = under budget, red = over budget. Matches Tabler's own
// success/danger tokens, so it reads consistently with the stat-card colors.
const GOOD_COLOR = '#2fb344';
const CRITICAL_COLOR = '#d63939';
const GRIDLINE_COLOR = '#e1e0d9';
const AXIS_COLOR = '#c3c2b7';

function formatAmount(amount) {
    const sign = amount > 0 ? '+' : '';

    return `${sign}${new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount)}`;
}

const chartData = computed(() => ({
    labels: props.items.map((item) => item.label),
    datasets: [
        {
            data: props.items.map((item) => item.deviation),
            backgroundColor: props.items.map((item) => (item.deviation >= 0 ? GOOD_COLOR : CRITICAL_COLOR)),
            borderRadius: 4,
            maxBarThickness: 32,
        },
    ],
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (context) => formatAmount(context.parsed.y),
            },
        },
    },
    scales: {
        x: {
            grid: { display: false },
            border: { color: AXIS_COLOR },
        },
        y: {
            grid: { color: GRIDLINE_COLOR },
            border: { color: AXIS_COLOR },
            ticks: { callback: (value) => formatAmount(value) },
        },
    },
};
</script>

<template>
    <div v-if="items.length === 0" class="text-muted small py-4 text-center">
        Sense dades per a aquest període.
    </div>
    <div v-else style="height: 260px;">
        <Bar :data="chartData" :options="chartOptions" />
    </div>
</template>
