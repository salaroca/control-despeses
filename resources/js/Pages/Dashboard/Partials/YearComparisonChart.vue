<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const props = defineProps({
    monthLabels: { type: Array, required: true },
    year: { type: Number, required: true },
    // Last month of the selected year that is compared (the month picked on the Dashboard).
    untilMonth: { type: Number, required: true },
    currentData: { type: Array, required: true },
    previousData: { type: Array, required: true },
    // Same-period totals computed by the server ({ current, previous }). For the month in progress
    // they stop at today's day in both years, which the monthly arrays cannot express.
    periodTotals: { type: Object, default: null },
    // Day of the selected month where the period stops (only for the month in progress).
    cutoffDay: { type: Number, default: null },
});

// Both years are the same measure (real expense) at two points in time, so they share one hue:
// the selected year keeps the Dashboard's usual blue and the previous year a lighter step of it
// (ordinal ramp validated with the dataviz palette script). Orange is avoided because it means
// "budget" on the Pressupostos charts.
const CURRENT_COLOR = '#2a78d6';
const PREVIOUS_COLOR = '#86b6ef';
const GRIDLINE_COLOR = '#e1e0d9';
const AXIS_COLOR = '#c3c2b7';

function formatAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function sumUntilMonth(values) {
    return values.slice(0, props.untilMonth).reduce((total, value) => total + value, 0);
}

const previousYear = computed(() => props.year - 1);

const hasData = computed(() => [...props.currentData, ...props.previousData].some((value) => value > 0));

// The same period in both years (January up to the selected month), so a year still in progress
// is not compared against a complete one.
const periodLabel = computed(() => {
    const lastMonth = props.monthLabels[props.untilMonth - 1];

    if (props.cutoffDay !== null) {
        return props.untilMonth === 1
            ? `1–${props.cutoffDay} ${lastMonth}`
            : `${props.monthLabels[0]}–${props.cutoffDay} ${lastMonth}`;
    }

    return props.untilMonth === 1 ? lastMonth : `${props.monthLabels[0]}–${lastMonth}`;
});

const currentPeriodTotal = computed(() => props.periodTotals?.current ?? sumUntilMonth(props.currentData));
const previousPeriodTotal = computed(() => props.periodTotals?.previous ?? sumUntilMonth(props.previousData));
const difference = computed(() => currentPeriodTotal.value - previousPeriodTotal.value);

const percentage = computed(() => {
    if (previousPeriodTotal.value === 0) {
        return null;
    }

    return new Intl.NumberFormat('ca-ES', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' })
        .format(difference.value / previousPeriodTotal.value);
});

// Spending more than last year is the "bad" direction, so it is shown in red with an up arrow.
const isSpendingMore = computed(() => difference.value > 0);

const formattedDifference = computed(() => `${difference.value > 0 ? '+' : ''}${formatAmount(difference.value)}`);

const chartData = computed(() => ({
    labels: props.monthLabels,
    datasets: [
        {
            label: String(previousYear.value),
            data: props.previousData,
            backgroundColor: PREVIOUS_COLOR,
            borderRadius: 4,
            maxBarThickness: 16,
        },
        {
            label: String(props.year),
            // Months after the selected one are left empty instead of drawn as 0.
            data: props.currentData.map((value, index) => (index < props.untilMonth ? value : null)),
            backgroundColor: CURRENT_COLOR,
            borderRadius: 4,
            maxBarThickness: 16,
        },
    ],
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    // Hovering a month shows both years together.
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
        Sense despeses ni aquest any ni l'anterior.
    </div>
    <template v-else>
        <div class="d-flex flex-wrap gap-3 align-items-baseline mb-3 period-summary">
            <div>
                <span class="text-secondary">{{ periodLabel }} {{ year }}:</span>
                <strong class="ms-1">{{ formatAmount(currentPeriodTotal) }}</strong>
            </div>
            <div>
                <span class="text-secondary">{{ periodLabel }} {{ previousYear }}:</span>
                <strong class="ms-1">{{ formatAmount(previousPeriodTotal) }}</strong>
            </div>
            <div v-if="difference === 0" class="period-difference text-secondary">
                Igual que el {{ previousYear }}
            </div>
            <div v-else class="period-difference" :class="isSpendingMore ? 'text-danger' : 'text-success'">
                <component :is="isSpendingMore ? IconTrendingUp : IconTrendingDown" :size="18" class="me-1" />
                <strong>{{ formattedDifference }}</strong>
                <span v-if="percentage"> ({{ percentage }})</span>
                <span class="ms-1">{{ isSpendingMore ? 'més' : 'menys' }} que el {{ previousYear }}</span>
            </div>
        </div>
        <div style="height: 260px;">
            <Bar :data="chartData" :options="chartOptions" />
        </div>
    </template>
</template>
