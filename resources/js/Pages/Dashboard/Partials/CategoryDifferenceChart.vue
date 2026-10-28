<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const props = defineProps({
    // { name, current, previous } per category, already sorted (biggest increase first).
    items: { type: Array, required: true },
    year: { type: Number, required: true },
    // When true, clicking a bar emits "select" with that item's name (to drill down into it).
    isClickable: { type: Boolean, default: false },
});

const emit = defineEmits(['select']);

// Diverging by sign, same colors as the deviation trend chart: spending more than the previous
// year is the "bad" direction (red), spending less is green. The caption under the chart states
// the meaning in words, so it never relies on color alone.
const MORE_COLOR = '#d63939';
const LESS_COLOR = '#2fb344';
const GRIDLINE_COLOR = '#e1e0d9';
const AXIS_COLOR = '#c3c2b7';
const ROW_HEIGHT = 28;

function formatAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDifference(amount) {
    return `${amount > 0 ? '+' : ''}${formatAmount(amount)}`;
}

const previousYear = computed(() => props.year - 1);

const differenceList = computed(() => props.items.map((item) => item.current - item.previous));

// One row per category, so the card grows with the number of categories instead of squashing bars.
const chartHeight = computed(() => `${Math.max(160, props.items.length * ROW_HEIGHT + 40)}px`);

const chartData = computed(() => ({
    labels: props.items.map((item) => item.name),
    datasets: [
        {
            data: differenceList.value,
            backgroundColor: differenceList.value.map((difference) => (difference > 0 ? MORE_COLOR : LESS_COLOR)),
            borderRadius: 4,
            maxBarThickness: 18,
        },
    ],
}));

function onChartClick(event, elementList) {
    if (props.isClickable && elementList.length > 0) {
        emit('select', props.items[elementList[0].index].name);
    }
}

const chartOptions = computed(() => ({
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    onClick: onChartClick,
    // A hand cursor over the bars hints that they can be clicked.
    onHover: (event, elementList) => {
        if (props.isClickable && event.native?.target) {
            event.native.target.style.cursor = elementList.length > 0 ? 'pointer' : 'default';
        }
    },
    plugins: {
        legend: { display: false },
        tooltip: {
            callbacks: {
                label: (context) => {
                    const item = props.items[context.dataIndex];

                    return [
                        formatDifference(context.parsed.x),
                        `${props.year}: ${formatAmount(item.current)}`,
                        `${previousYear.value}: ${formatAmount(item.previous)}`,
                    ];
                },
            },
        },
    },
    scales: {
        x: {
            grid: { color: GRIDLINE_COLOR },
            border: { color: AXIS_COLOR },
            ticks: { callback: (value) => formatDifference(value) },
        },
        y: { grid: { display: false }, border: { color: AXIS_COLOR } },
    },
}));
</script>

<template>
    <div v-if="items.length === 0" class="text-muted small py-4 text-center">
        Sense dades per a aquest període.
    </div>
    <template v-else>
        <div :style="{ height: chartHeight }">
            <Bar :data="chartData" :options="chartOptions" />
        </div>
        <p class="text-secondary small mt-2 mb-0 difference-caption">
            Vermell: gastes més que el {{ previousYear }} · Verd: gastes menys.
        </p>
    </template>
</template>
