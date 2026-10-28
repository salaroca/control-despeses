<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import {
    BarElement,
    CategoryScale,
    Chart as ChartJS,
    Legend,
    LinearScale,
    LineElement,
    PointElement,
    Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Tooltip, Legend);

const props = defineProps({
    monthLabels: { type: Array, required: true },
    budgetData: { type: Array, required: true },
    actualData: { type: Array, required: true },
    // How many months the real average divides by (months already reached this year).
    actualMonths: { type: Number, default: 12 },
});

// Categorical slots 1 and 2 of the validated dataviz palette, in fixed order.
// Real keeps the same blue as the Dashboard charts (which also show real expense);
// green/red stay reserved for the under/over-budget status used in the tables.
const ACTUAL_COLOR = '#2a78d6';
const BUDGET_COLOR = '#eb6834';
const GRIDLINE_COLOR = '#e1e0d9';
const AXIS_COLOR = '#c3c2b7';

function formatAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

// Same rules as the "Mitjana/mes" table column: budget ÷ 12, real ÷ months already reached.
function yearlyAverage(values, divisor) {
    return divisor > 0 ? values.reduce((total, value) => total + value, 0) / divisor : 0;
}

// A flat dashed line across every month at the average, in the same color as its bars.
function averageLine(label, values, color, divisor) {
    const average = yearlyAverage(values, divisor);

    return {
        type: 'line',
        label,
        data: values.map(() => average),
        borderColor: color,
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        pointHoverRadius: 0,
    };
}

const hasData = computed(() => [...props.budgetData, ...props.actualData].some((value) => value > 0));

const chartData = computed(() => ({
    labels: props.monthLabels,
    datasets: [
        {
            label: 'Pressupost',
            data: props.budgetData,
            backgroundColor: BUDGET_COLOR,
            borderRadius: 4,
            maxBarThickness: 16,
        },
        {
            label: 'Real',
            data: props.actualData,
            backgroundColor: ACTUAL_COLOR,
            borderRadius: 4,
            maxBarThickness: 16,
        },
        averageLine('Mitjana pressupost', props.budgetData, BUDGET_COLOR, props.budgetData.length),
        averageLine('Mitjana real', props.actualData, ACTUAL_COLOR, props.actualMonths),
    ],
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    // Hovering a month shows both bars' values together, so budget and real can be compared at once.
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
        Sense pressupost ni despeses aquest any.
    </div>
    <div v-else style="height: 240px;">
        <Bar :data="chartData" :options="chartOptions" />
    </div>
</template>
