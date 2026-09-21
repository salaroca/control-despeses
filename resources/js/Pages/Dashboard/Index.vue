<script setup>
import { computed, ref } from 'vue';
import { router } from '@inertiajs/vue3';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-vue';
import AppLayout from '../../Layouts/AppLayout.vue';
import ExpenseBreakdownChart from './Partials/ExpenseBreakdownChart.vue';
import StatCard from './Partials/StatCard.vue';

const props = defineProps({
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    monthlyTotal: { type: Number, required: true },
    annualTotal: { type: Number, required: true },
    monthlyBudget: { type: Number, required: true },
    annualBudget: { type: Number, required: true },
    byCategory: { type: Array, required: true },
    bySubcategory: { type: Array, required: true },
});

const selectedMonth = ref(`${String(props.year).padStart(4, '0')}-${String(props.month).padStart(2, '0')}`);

function onMonthChange() {
    const [year, month] = selectedMonth.value.split('-').map(Number);
    router.get('/dashboard', { year, month });
}

function formatAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDeviation(deviation) {
    const sign = deviation > 0 ? '+' : '';

    return `${sign}${formatAmount(deviation)}`;
}

function deviationVariant(deviation) {
    return deviation >= 0 ? 'good' : 'critical';
}

function deviationIcon(deviation) {
    return deviation >= 0 ? IconTrendingUp : IconTrendingDown;
}

const monthlyDeviation = computed(() => props.monthlyBudget - props.monthlyTotal);
const annualDeviation = computed(() => props.annualBudget - props.annualTotal);

const monthNames = [
    'gener', 'febrer', 'març', 'abril', 'maig', 'juny',
    'juliol', 'agost', 'setembre', 'octubre', 'novembre', 'desembre',
];
const monthLabel = computed(() => monthNames[props.month - 1]);
</script>

<template>
    <AppLayout>
    <div class="page-header d-print-none">
        <div class="container-xl">
            <div class="row g-2 align-items-center">
                <div class="col">
                    <h2 class="page-title">Dashboard</h2>
                </div>
                <div class="col-auto ms-auto d-print-none">
                    <input v-model="selectedMonth" type="month" class="form-control" @change="onMonthChange">
                </div>
            </div>
        </div>
    </div>
    <div class="page-body">
    <div class="container-xl">
        <h3 class="mb-3">Aquest mes ({{ monthLabel }} {{ year }})</h3>
        <div class="row row-cards mb-4">
            <div class="col-sm-6 col-lg-4">
                <StatCard label="Gastat" :value="formatAmount(monthlyTotal)" />
            </div>
            <div class="col-sm-6 col-lg-4">
                <StatCard label="Pressupostat" :value="formatAmount(monthlyBudget)" />
            </div>
            <div class="col-sm-6 col-lg-4">
                <StatCard
                    label="Desviació"
                    :value="formatDeviation(monthlyDeviation)"
                    :variant="deviationVariant(monthlyDeviation)"
                    :icon="deviationIcon(monthlyDeviation)"
                />
            </div>
        </div>

        <h3 class="mb-3">Aquest any ({{ year }})</h3>
        <div class="row row-cards mb-4">
            <div class="col-sm-6 col-lg-4">
                <StatCard label="Gastat" :value="formatAmount(annualTotal)" />
            </div>
            <div class="col-sm-6 col-lg-4">
                <StatCard label="Pressupostat" :value="formatAmount(annualBudget)" />
            </div>
            <div class="col-sm-6 col-lg-4">
                <StatCard
                    label="Desviació"
                    :value="formatDeviation(annualDeviation)"
                    :variant="deviationVariant(annualDeviation)"
                    :icon="deviationIcon(annualDeviation)"
                />
            </div>
        </div>

        <div class="row row-cards">
            <div class="col-12 col-lg-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Despesa per categoria ({{ monthLabel }})</h3>
                    </div>
                    <div class="card-body">
                        <ExpenseBreakdownChart :items="byCategory" />
                    </div>
                </div>
            </div>
            <div class="col-12 col-lg-6">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Despesa per subcategoria ({{ monthLabel }})</h3>
                    </div>
                    <div class="card-body">
                        <ExpenseBreakdownChart :items="bySubcategory" />
                    </div>
                </div>
            </div>
        </div>
    </div>
    </div>
    </AppLayout>
</template>
