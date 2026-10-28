<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from 'chart.js';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-vue';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const props = defineProps({
    // { year, spent, budgeted, monthsCounted, isCurrent } per year, oldest first.
    items: { type: Array, required: true },
});

// Same colors as the Pressupostos charts: blue = real expense, orange = budget.
const ACTUAL_COLOR = '#2a78d6';
const BUDGET_COLOR = '#eb6834';
const GRIDLINE_COLOR = '#e1e0d9';
const AXIS_COLOR = '#c3c2b7';

function formatAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

function formatSigned(amount) {
    return `${amount > 0 ? '+' : ''}${formatAmount(amount)}`;
}

function yearLabel(item) {
    return item.isCurrent ? `${item.year} (en curs)` : String(item.year);
}

// Each row with the figures the table needs. The change against the previous year uses the monthly
// average, so a year still in progress is compared fairly against a complete one.
const rowList = computed(() => props.items.map((item, index) => {
    const monthlyAverage = item.monthsCounted > 0 ? item.spent / item.monthsCounted : 0;
    const previous = index > 0 ? props.items[index - 1] : null;
    const previousAverage = previous && previous.monthsCounted > 0 ? previous.spent / previous.monthsCounted : 0;

    return {
        ...item,
        label: yearLabel(item),
        deviation: item.budgeted > 0 ? item.budgeted - item.spent : null,
        monthlyAverage,
        change: previousAverage > 0 ? (monthlyAverage - previousAverage) / previousAverage : null,
    };
}));

function formatChange(change) {
    return new Intl.NumberFormat('ca-ES', { style: 'percent', maximumFractionDigits: 1, signDisplay: 'exceptZero' })
        .format(change);
}

const chartData = computed(() => ({
    labels: rowList.value.map((row) => row.label),
    datasets: [
        {
            label: 'Pressupostat',
            data: rowList.value.map((row) => row.budgeted),
            backgroundColor: BUDGET_COLOR,
            borderRadius: 4,
            maxBarThickness: 40,
        },
        {
            label: 'Gastat',
            data: rowList.value.map((row) => row.spent),
            backgroundColor: ACTUAL_COLOR,
            borderRadius: 4,
            maxBarThickness: 40,
        },
    ],
}));

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
    <div v-if="items.length === 0" class="text-muted small py-4 text-center">
        Encara no hi ha despeses.
    </div>
    <template v-else>
        <div style="height: 260px;">
            <Bar :data="chartData" :options="chartOptions" />
        </div>

        <div class="table-responsive mt-3">
            <table class="table table-vcenter yearly-table">
                <thead>
                    <tr>
                        <th>Any</th>
                        <th class="text-end">Gastat</th>
                        <th class="text-end">Pressupostat</th>
                        <th class="text-end">Desviació</th>
                        <th class="text-end">Mitjana/mes</th>
                        <th class="text-end">Variació vs. any anterior</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="row in rowList" :key="row.year" :data-year-row="row.year">
                        <td class="fw-semibold">
                            {{ row.year }}
                            <span v-if="row.isCurrent" class="badge bg-secondary-lt ms-1">en curs</span>
                        </td>
                        <td class="text-end" data-spent>{{ formatAmount(row.spent) }}</td>
                        <td class="text-end" data-budgeted>{{ row.budgeted > 0 ? formatAmount(row.budgeted) : '–' }}</td>
                        <td class="text-end" data-deviation>
                            <span
                                v-if="row.deviation !== null"
                                :class="row.deviation >= 0 ? 'text-success' : 'text-danger'"
                            >
                                <component :is="row.deviation >= 0 ? IconTrendingUp : IconTrendingDown" :size="16" class="me-1" />
                                {{ formatSigned(row.deviation) }}
                            </span>
                            <span v-else class="text-muted">–</span>
                        </td>
                        <td class="text-end" data-average>{{ formatAmount(row.monthlyAverage) }}</td>
                        <td class="text-end" data-change>
                            <!-- Spending more than the previous year is the "bad" direction (red, up arrow). -->
                            <span v-if="row.change !== null" :class="row.change > 0 ? 'text-danger' : 'text-success'">
                                <component :is="row.change > 0 ? IconTrendingUp : IconTrendingDown" :size="16" class="me-1" />
                                {{ formatChange(row.change) }}
                            </span>
                            <span v-else class="text-muted">–</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p class="text-secondary small mb-0">
            Desviació = pressupostat − gastat (en verd si t'hi has mantingut). La variació compara la mitjana
            mensual, perquè l'any en curs encara no és sencer.
        </p>
    </template>
</template>

<style scoped>
.yearly-table {
    font-variant-numeric: tabular-nums;
}
</style>
