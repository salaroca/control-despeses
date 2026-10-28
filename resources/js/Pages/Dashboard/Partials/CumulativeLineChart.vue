<script setup>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { CategoryScale, Chart as ChartJS, Legend, LinearScale, LineElement, PointElement, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Tooltip, Legend);

const props = defineProps({
    monthLabels: { type: Array, required: true },
    // Each series: { label, values (12 monthly amounts), color, lastMonth (optional, 1-12) }.
    // The line is the running total; months after lastMonth are left empty instead of flat.
    seriesList: { type: Array, required: true },
});

const GRIDLINE_COLOR = '#e1e0d9';
const AXIS_COLOR = '#c3c2b7';

function formatAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function runningTotal(values, lastMonth) {
    let total = 0;

    return values.map((value, index) => {
        total += value;

        return index < lastMonth ? total : null;
    });
}

const hasData = computed(() => props.seriesList.some((series) => series.values.some((value) => value > 0)));

const chartData = computed(() => ({
    labels: props.monthLabels,
    datasets: props.seriesList.map((series) => ({
        label: series.label,
        data: runningTotal(series.values, series.lastMonth ?? 12),
        borderColor: series.color,
        backgroundColor: series.color,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0,
    })),
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    // Hovering a month shows every line's value at once.
    interaction: { mode: 'index', intersect: false },
    plugins: {
        legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 12, boxHeight: 12 } },
        tooltip: {
            callbacks: {
                label: (context) => `${context.dataset.label}: ${formatAmount(context.parsed.y)}`,
            },
        },
    },
    scales: {
        x: { grid: { display: false }, border: { color: AXIS_COLOR } },
        y: {
            beginAtZero: true,
            grid: { color: GRIDLINE_COLOR },
            border: { color: AXIS_COLOR },
            ticks: { callback: (value) => formatAmount(value) },
        },
    },
};
</script>

<template>
    <div v-if="!hasData" class="text-muted small py-4 text-center">
        Sense dades per a aquest període.
    </div>
    <div v-else style="height: 260px;">
        <Line :data="chartData" :options="chartOptions" />
    </div>
</template>
