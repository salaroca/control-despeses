<script setup>
import { computed, ref } from 'vue';
import { router } from '@inertiajs/vue3';
import { IconTrendingDown, IconTrendingUp } from '@tabler/icons-vue';
import AppLayout from '../../Layouts/AppLayout.vue';
import CategoryDifferenceChart from './Partials/CategoryDifferenceChart.vue';
import CumulativeLineChart from './Partials/CumulativeLineChart.vue';
import DeviationTrendChart from './Partials/DeviationTrendChart.vue';
import ExpenseBreakdownChart from './Partials/ExpenseBreakdownChart.vue';
import StatCard from './Partials/StatCard.vue';
import YearComparisonChart from './Partials/YearComparisonChart.vue';
import YearlyEvolution from './Partials/YearlyEvolution.vue';

const props = defineProps({
    year: { type: Number, required: true },
    month: { type: Number, required: true },
    monthlyTotal: { type: Number, required: true },
    annualTotal: { type: Number, required: true },
    monthlyBudget: { type: Number, required: true },
    annualBudget: { type: Number, required: true },
    byCategory: { type: Array, required: true },
    bySubcategory: { type: Array, required: true },
    byBank: { type: Array, required: true },
    deviationTrend: { type: Array, required: true },
    yearComparison: { type: Object, required: true },
    monthlyBudgets: { type: Array, required: true },
    categoryComparison: { type: Array, required: true },
    comparisonPeriod: { type: Object, required: true },
    yearlyTotals: { type: Array, required: true },
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

const monthAbbreviations = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];

// "Gen–Oct", or "Gen–19 Oct" when the month in progress is cut at today's day.
const periodLabel = computed(() => {
    const lastMonth = monthAbbreviations[props.month - 1];
    const cutoffDay = props.comparisonPeriod.cutoffDay;

    if (cutoffDay !== null) {
        return props.month === 1 ? `1–${cutoffDay} ${lastMonth}` : `${monthAbbreviations[0]}–${cutoffDay} ${lastMonth}`;
    }

    return props.month === 1 ? lastMonth : `${monthAbbreviations[0]}–${lastMonth}`;
});

// Category whose subcategories are shown under the difference chart ('' = none).
const selectedCategory = ref('');

const selectedCategoryData = computed(() => props.categoryComparison
    .find((category) => category.name === selectedCategory.value) ?? null);

// Same colors as the rest of the app: blue = real expense, orange = budget (as on the Pressupostos
// charts), light blue = the previous year's real expense (as on the year comparison bars).
const ACTUAL_COLOR = '#2a78d6';
const BUDGET_COLOR = '#eb6834';
const PREVIOUS_YEAR_COLOR = '#86b6ef';

const budgetCumulativeSeries = computed(() => [
    { label: 'Pressupost', values: props.monthlyBudgets, color: BUDGET_COLOR },
    { label: 'Real', values: props.yearComparison.current, color: ACTUAL_COLOR, lastMonth: props.month },
]);

const yearCumulativeSeries = computed(() => [
    { label: String(props.year - 1), values: props.yearComparison.previous, color: PREVIOUS_YEAR_COLOR },
    { label: String(props.year), values: props.yearComparison.current, color: ACTUAL_COLOR, lastMonth: props.month },
]);

const trendWindow = ref(3);

const trendItems = computed(() => props.deviationTrend
    .slice(-trendWindow.value)
    .map((item) => ({
        label: `${monthAbbreviations[item.month - 1]} ${String(item.year).slice(2)}`,
        deviation: item.deviation,
    })));
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
        <!-- Three blocks, each with its own title and accent color, so a chart is never mistaken
             for another period: the selected month, the selected year, and the comparison with the
             previous year. -->
        <section class="dashboard-section section-month mb-5" data-section="month">
            <div class="section-heading">
                <h2 class="section-title">Aquest mes</h2>
                <span class="section-subtitle">{{ monthLabel }} {{ year }}</span>
            </div>
            <div class="row row-cards mb-3">
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

            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">Despesa per subcategoria</h3>
                </div>
                <div class="card-body">
                    <ExpenseBreakdownChart :items="bySubcategory" :horizontal="false" />
                </div>
            </div>

            <div class="row row-cards">
                <div class="col-12 col-lg-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title">Despesa per categoria</h3>
                        </div>
                        <div class="card-body">
                            <ExpenseBreakdownChart :items="byCategory" />
                        </div>
                    </div>
                </div>
                <div class="col-12 col-lg-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title">Despesa per banc</h3>
                        </div>
                        <div class="card-body">
                            <ExpenseBreakdownChart :items="byBank" />
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="dashboard-section section-year mb-5" data-section="year">
            <div class="section-heading">
                <h2 class="section-title">Aquest any</h2>
                <span class="section-subtitle">{{ year }}</span>
            </div>
            <div class="row row-cards mb-3">
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

            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">Despesa acumulada vs. pressupost</h3>
                </div>
                <div class="card-body">
                    <CumulativeLineChart :month-labels="monthAbbreviations" :series-list="budgetCumulativeSeries" />
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Desviació pressupost vs. despesa real</h3>
                    <div class="card-actions">
                        <div class="btn-group">
                            <button
                                v-for="window in [3, 6, 12]"
                                :key="window"
                                type="button"
                                class="btn btn-sm"
                                :class="trendWindow === window ? 'btn-primary' : 'btn-outline-primary'"
                                @click="trendWindow = window"
                            >
                                {{ window }}m
                            </button>
                        </div>
                    </div>
                </div>
                <div class="card-body">
                    <DeviationTrendChart :items="trendItems" />
                </div>
            </div>
        </section>

        <section class="dashboard-section section-comparison mb-5" data-section="comparison">
            <div class="section-heading">
                <h2 class="section-title">Comparativa amb {{ year - 1 }}</h2>
                <span class="section-subtitle">{{ year }} vs. {{ year - 1 }} · {{ periodLabel }}</span>
            </div>

            <div class="card mb-3">
                <div class="card-header">
                    <h3 class="card-title">Mes a mes</h3>
                </div>
                <div class="card-body">
                    <YearComparisonChart
                        :month-labels="monthAbbreviations"
                        :year="year"
                        :until-month="month"
                        :current-data="yearComparison.current"
                        :previous-data="yearComparison.previous"
                        :period-totals="comparisonPeriod"
                        :cutoff-day="comparisonPeriod.cutoffDay"
                    />
                </div>
            </div>

            <div class="row row-cards">
                <div class="col-12 col-lg-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title">Acumulat {{ year }} vs. {{ year - 1 }}</h3>
                        </div>
                        <div class="card-body">
                            <CumulativeLineChart :month-labels="monthAbbreviations" :series-list="yearCumulativeSeries" />
                        </div>
                    </div>
                </div>
                <div class="col-12 col-lg-6">
                    <div class="card h-100">
                        <div class="card-header">
                            <h3 class="card-title">Diferència per categoria vs. {{ year - 1 }} ({{ periodLabel }})</h3>
                        </div>
                        <div class="card-body">
                            <CategoryDifferenceChart
                                :items="categoryComparison"
                                :year="year"
                                is-clickable
                                @select="selectedCategory = $event"
                            />

                            <div v-if="categoryComparison.length" class="mt-3 pt-3 border-top">
                                <label class="form-label" for="category-detail">
                                    Detall per subcategoria (o clica una barra)
                                </label>
                                <select id="category-detail" v-model="selectedCategory" class="form-select">
                                    <option value="">Tria una categoria…</option>
                                    <option v-for="category in categoryComparison" :key="category.name" :value="category.name">
                                        {{ category.name }}
                                    </option>
                                </select>

                                <div v-if="selectedCategoryData" class="mt-3 subcategory-detail">
                                    <h4 class="mb-2">{{ selectedCategoryData.name }}: subcategories</h4>
                                    <CategoryDifferenceChart :items="selectedCategoryData.subcategories" :year="year" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <section class="dashboard-section section-evolution" data-section="evolution">
            <div class="section-heading">
                <h2 class="section-title">Evolució anual</h2>
                <span class="section-subtitle">tots els anys</span>
            </div>
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Total de cada any</h3>
                </div>
                <div class="card-body">
                    <YearlyEvolution :items="yearlyTotals" />
                </div>
            </div>
        </section>
    </div>
    </div>
    </AppLayout>
</template>

<style scoped>
/* Each block has an accent color: a bar next to its title and a thin stripe on the left of its cards.
   Green/red are avoided (they mean on/over budget). Orange is used for the month block, whose charts
   never show the orange "budget" series. */
.section-month {
    --section-accent: var(--tblr-orange);
}

.section-year {
    --section-accent: var(--tblr-primary);
}

.section-comparison {
    --section-accent: var(--tblr-purple);
}

.section-evolution {
    --section-accent: var(--tblr-pink);
}

.section-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 0.75rem;
    margin-bottom: 1rem;
    padding-left: 0.75rem;
    border-left: 4px solid var(--section-accent);
}

.section-title {
    margin: 0;
    font-size: 1.25rem;
}

.section-subtitle {
    color: var(--tblr-secondary);
}

.dashboard-section :deep(.card) {
    border-left: 3px solid var(--section-accent);
}
</style>
