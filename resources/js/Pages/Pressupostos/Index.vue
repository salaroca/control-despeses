<script setup>
import { computed, reactive, ref } from 'vue';
import { Link, router, usePage } from '@inertiajs/vue3';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-vue';
import AppLayout from '../../Layouts/AppLayout.vue';
import CategoryMonthlyChart from './Partials/CategoryMonthlyChart.vue';

const props = defineProps({
    year: { type: Number, required: true },
    budgets: { type: Array, required: true },
    actuals: { type: Array, required: true },
    bankActuals: { type: Array, required: true },
});

const page = usePage();
const categoriesList = computed(() => page.props.categoriesList);
const banksList = computed(() => page.props.banksList);

// The active tab lives in the URL (?tab=real / ?tab=charts) so it survives switching year.
const TABS = ['budget', 'real', 'charts'];
const tabFromUrl = new URLSearchParams(page.url.split('?')[1] ?? '').get('tab');
const activeTab = ref(TABS.includes(tabFromUrl) ? tabFromUrl : 'budget');

function yearHref(targetYear) {
    return activeTab.value === 'budget'
        ? `/pressupostos?year=${targetYear}`
        : `/pressupostos?year=${targetYear}&tab=${activeTab.value}`;
}

const monthLabels = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function cellKey(subcategoryId, month) {
    return `${subcategoryId}-${month}`;
}

const amounts = reactive({});
// Saved amounts come as "60.00"; the inputs show them without trailing zeros ("60", "60.5").
props.budgets.forEach((budget) => {
    amounts[cellKey(budget.subcategory_id, budget.month)] = String(Number(budget.amount));
});

const actuals = {};
props.actuals.forEach((actual) => {
    actuals[cellKey(actual.subcategory_id, actual.month)] = actual.total;
});

function getAmount(subcategoryId, month) {
    return amounts[cellKey(subcategoryId, month)] ?? '';
}

function setAmount(subcategoryId, month, value) {
    amounts[cellKey(subcategoryId, month)] = value;
}

// Compares the budgeted cell against the real expense for that subcategory/month —
// green when spending stayed at or under budget, red when it went over.
// Cells with no budget entered yet aren't colored: there's nothing to judge.
function cellVariant(subcategoryId, month) {
    const key = cellKey(subcategoryId, month);
    const budgetedRaw = amounts[key];

    if (budgetedRaw === undefined || budgetedRaw === '' || budgetedRaw === null) {
        return '';
    }

    const budgeted = Number(budgetedRaw);

    if (Number.isNaN(budgeted)) {
        return '';
    }

    const spent = actuals[key] ?? 0;

    return spent <= budgeted ? 'table-success' : 'table-danger';
}

// The Real tables show whole euros, so "over budget" is judged on whole euros too: a figure is only
// flagged when it is visibly above its budget (e.g. 53,15 against 53 shows "53" and is not flagged).
function isAmountOver(actual, budget) {
    return Math.round(actual) > Math.round(budget);
}

// True when the subcategory has a budget that month and the real expense goes over it.
function isOverBudget(subcategoryId, month) {
    if (cellVariant(subcategoryId, month) !== 'table-danger') {
        return false;
    }

    return isAmountOver(getActual(subcategoryId, month) ?? 0, Number(getAmount(subcategoryId, month)));
}

function actualTooltip(subcategoryId, month) {
    const spent = actuals[cellKey(subcategoryId, month)];

    return spent === undefined ? 'Despesa real: cap' : `Despesa real: ${formatAmount(spent)}`;
}

const savingKeys = reactive({});

function saveCell(subcategoryId, month) {
    const key = cellKey(subcategoryId, month);
    const raw = amounts[key];
    const amount = raw === '' || raw === null ? null : Number(raw);

    savingKeys[key] = true;
    router.post(
        '/pressupostos',
        {
            subcategory_id: subcategoryId,
            year: props.year,
            month,
            amount,
        },
        {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                savingKeys[key] = false;
            },
        },
    );
}

function subcategoryTotal(subcategoryId) {
    return months.reduce((total, month) => {
        const value = Number(amounts[cellKey(subcategoryId, month)] ?? 0);

        return total + (Number.isNaN(value) ? 0 : value);
    }, 0);
}

function categoryMonthTotal(category, month) {
    return category.subcategories.reduce((total, subcategory) => {
        const value = Number(amounts[cellKey(subcategory.id, month)] ?? 0);

        return total + (Number.isNaN(value) ? 0 : value);
    }, 0);
}

function categoryYearTotal(category) {
    return months.reduce((total, month) => total + categoryMonthTotal(category, month), 0);
}

// Budget average per calendar month over the whole year (January–December), always ÷ 12:
// the budget is a plan for the full year.
function monthlyAverage(yearTotal) {
    return yearTotal / months.length;
}

// Real expense only exists for months we've already reached, so its average divides by
// those: 12 for past years, January up to the current month (included) for the current
// year, and nothing for future years (the average is then 0).
const today = new Date();
const elapsedMonths = props.year < today.getFullYear()
    ? months.length
    : (props.year === today.getFullYear() ? today.getMonth() + 1 : 0);

function actualMonthlyAverage(yearTotal) {
    return elapsedMonths > 0 ? yearTotal / elapsedMonths : 0;
}

// Month to highlight in the Real tables (only when looking at the current year).
const currentMonth = props.year === today.getFullYear() ? today.getMonth() + 1 : null;

function formatAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}

// The Real tables show whole euros without the € sign (stated once above the table), so the
// many figures stay short and easy to scan.
function formatTableAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { maximumFractionDigits: 0 }).format(amount);
}

// The bank budget isn't entered separately — it's the subcategory budgets summed
// per bank, since the bank is set once per subcategory (in Categories), not per budget cell.
const banksWithNone = computed(() => [...banksList.value, { id: null, name: 'Sense banc' }]);

function subcategoriesForBank(bankId) {
    return categoriesList.value.flatMap((category) => category.subcategories)
        .filter((subcategory) => (subcategory.bank_id ?? null) === bankId);
}

function bankMonthTotal(bankId, month) {
    return subcategoriesForBank(bankId).reduce((total, subcategory) => {
        const value = Number(amounts[cellKey(subcategory.id, month)] ?? 0);

        return total + (Number.isNaN(value) ? 0 : value);
    }, 0);
}

function bankYearTotal(bankId) {
    return months.reduce((total, month) => total + bankMonthTotal(bankId, month), 0);
}

function allBanksMonthTotal(month) {
    return banksWithNone.value.reduce((total, bank) => total + bankMonthTotal(bank.id, month), 0);
}

function allBanksYearTotal() {
    return banksWithNone.value.reduce((total, bank) => total + bankYearTotal(bank.id), 0);
}

// --- "Real" tab: read-only real expense, same layout as the budget grid ---

function getActual(subcategoryId, month) {
    return actuals[cellKey(subcategoryId, month)];
}

function subcategoryActualTotal(subcategoryId) {
    return months.reduce((total, month) => total + (getActual(subcategoryId, month) ?? 0), 0);
}

function categoryActualMonthTotal(category, month) {
    return category.subcategories.reduce(
        (total, subcategory) => total + (getActual(subcategory.id, month) ?? 0),
        0,
    );
}

function categoryActualYearTotal(category) {
    return months.reduce((total, month) => total + categoryActualMonthTotal(category, month), 0);
}

// Real table: only categories and subcategories with some expense this year are listed.
const visibleActualCategories = computed(() => categoriesList.value
    .map((category) => ({
        ...category,
        subcategories: category.subcategories.filter((subcategory) => subcategoryActualTotal(subcategory.id) !== 0),
    }))
    .filter((category) => category.subcategories.length > 0));

// Categories start folded; opening one shows its subcategories.
const expandedCategoryIds = ref(new Set());

function isCategoryExpanded(categoryId) {
    return expandedCategoryIds.value.has(categoryId);
}

function toggleCategory(categoryId) {
    const nextIds = new Set(expandedCategoryIds.value);

    if (nextIds.has(categoryId)) {
        nextIds.delete(categoryId);
    } else {
        nextIds.add(categoryId);
    }

    expandedCategoryIds.value = nextIds;
}

// The real monthly average is "over budget" when it is above the budget's average over the same
// months (January up to the months already reached). Comparing against the budget ÷ 12 instead would
// flag every yearly bill paid early in the year (e.g. a January insurance) as over budget until
// December. Only judged when the row has some budget in that period.
function isAverageOverBudget(actualTotal, budgetToDate) {
    return budgetToDate > 0
        && isAmountOver(actualMonthlyAverage(actualTotal), budgetToDate / elapsedMonths);
}

// The "Total" column is red when the real expense already goes over the budget of the whole year.
// Only judged when the row has some budget.
function isTotalOverBudget(actualTotal, budgetYearTotal) {
    return budgetYearTotal > 0 && isAmountOver(actualTotal, budgetYearTotal);
}

function categoryBudgetYearTotal(categoryId) {
    const category = categoriesList.value.find((candidate) => candidate.id === categoryId);

    return category ? categoryYearTotal(category) : 0;
}

function budgetYearTotal() {
    return categoriesList.value.reduce((total, category) => total + categoryYearTotal(category), 0);
}

// Category and total rows, month by month: over budget when that month's real expense is above that
// month's budget. The category budget includes its subcategories without expenses.
function isMonthOverBudget(actual, budget) {
    return budget > 0 && isAmountOver(actual, budget);
}

function categoryBudgetMonthTotal(categoryId, month) {
    const category = categoriesList.value.find((candidate) => candidate.id === categoryId);

    return category ? categoryMonthTotal(category, month) : 0;
}

function budgetMonthTotal(month) {
    return categoriesList.value.reduce((total, category) => total + categoryMonthTotal(category, month), 0);
}

const elapsedMonthList = months.slice(0, elapsedMonths);

function subcategoryBudgetToDate(subcategoryId) {
    return elapsedMonthList.reduce((total, month) => {
        const value = Number(amounts[cellKey(subcategoryId, month)] ?? 0);

        return total + (Number.isNaN(value) ? 0 : value);
    }, 0);
}

// The Real table lists categories without their empty subcategories, but a category's budget
// must still include them, so the full category is looked up by id.
function categoryBudgetToDate(categoryId) {
    const category = categoriesList.value.find((candidate) => candidate.id === categoryId);

    return category
        ? category.subcategories.reduce((total, subcategory) => total + subcategoryBudgetToDate(subcategory.id), 0)
        : 0;
}

function budgetToDate() {
    return categoriesList.value.reduce((total, category) => total + categoryBudgetToDate(category.id), 0);
}

// Budget tab: categories start open (to type directly) and can be folded one by one.
const collapsedBudgetCategoryIds = ref(new Set());

function isBudgetCategoryExpanded(categoryId) {
    return !collapsedBudgetCategoryIds.value.has(categoryId);
}

function toggleBudgetCategory(categoryId) {
    const nextIds = new Set(collapsedBudgetCategoryIds.value);

    if (nextIds.has(categoryId)) {
        nextIds.delete(categoryId);
    } else {
        nextIds.add(categoryId);
    }

    collapsedBudgetCategoryIds.value = nextIds;
}

function expandAllBudgetCategories() {
    collapsedBudgetCategoryIds.value = new Set();
}

function collapseAllBudgetCategories() {
    collapsedBudgetCategoryIds.value = new Set(categoriesList.value.map((category) => category.id));
}

function expandAllCategories() {
    expandedCategoryIds.value = new Set(visibleActualCategories.value.map((category) => category.id));
}

function collapseAllCategories() {
    expandedCategoryIds.value = new Set();
}

function actualMonthTotal(month) {
    return categoriesList.value.reduce((total, category) => total + categoryActualMonthTotal(category, month), 0);
}

function actualYearTotal() {
    return months.reduce((total, month) => total + actualMonthTotal(month), 0);
}

// Unlike the budget bank table, this uses the bank set on each expense, which is
// what the server groups by — an expense can be paid from a different bank than
// the one assigned to its subcategory.
const bankActuals = {};
props.bankActuals.forEach((actual) => {
    bankActuals[cellKey(actual.bank_id ?? 'none', actual.month)] = actual.total;
});

function bankActualMonthTotal(bankId, month) {
    return bankActuals[cellKey(bankId ?? 'none', month)] ?? 0;
}

function bankActualYearTotal(bankId) {
    return months.reduce((total, month) => total + bankActualMonthTotal(bankId, month), 0);
}

// --- "Gràfics" tab: one chart per category, budget vs real for each month ---

function categoryBudgetSeries(category) {
    return months.map((month) => categoryMonthTotal(category, month));
}

function categoryActualSeries(category) {
    return months.map((month) => categoryActualMonthTotal(category, month));
}
</script>

<template>
    <AppLayout>
    <div class="page-header d-print-none">
        <div class="container-xxl">
            <div class="row g-2 align-items-center">
                <div class="col">
                    <h2 class="page-title">Pressupost {{ year }}</h2>
                </div>
                <div class="col-auto ms-auto d-print-none">
                    <div class="d-flex align-items-center gap-2">
                        <Link :href="yearHref(year - 1)" class="btn btn-outline-secondary btn-sm">
                            &laquo; {{ year - 1 }}
                        </Link>
                        <Link :href="yearHref(year + 1)" class="btn btn-outline-secondary btn-sm">
                            {{ year + 1 }} &raquo;
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="page-body">
    <div class="container-xxl">
        <ul class="nav nav-tabs mb-3">
            <li class="nav-item">
                <button
                    type="button"
                    class="nav-link"
                    :class="{ active: activeTab === 'budget' }"
                    data-tab="budget"
                    @click="activeTab = 'budget'"
                >
                    Pressupost
                </button>
            </li>
            <li class="nav-item">
                <button
                    type="button"
                    class="nav-link"
                    :class="{ active: activeTab === 'real' }"
                    data-tab="real"
                    @click="activeTab = 'real'"
                >
                    Real
                </button>
            </li>
            <li class="nav-item">
                <button
                    type="button"
                    class="nav-link"
                    :class="{ active: activeTab === 'charts' }"
                    data-tab="charts"
                    @click="activeTab = 'charts'"
                >
                    Gràfics
                </button>
            </li>
        </ul>

        <div v-if="activeTab === 'budget'">
        <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-2">
            <div>
                <h3 class="mb-1">Pressupost per subcategoria</h3>
                <p class="text-secondary small mb-0">
                    Escriu l'import previst de cada subcategoria i mes; es desa sol en sortir de la casella.
                    En <span class="text-danger fw-semibold">vermell</span>: aquell mes la despesa real l'ha superat.
                    Passa el ratolí per sobre d'una casella per veure'n la despesa real. Totals en euros, arrodonits.
                </p>
            </div>
            <div class="btn-list">
                <button type="button" class="btn btn-sm" data-budget-expand-all @click="expandAllBudgetCategories">
                    Obre-ho tot
                </button>
                <button type="button" class="btn btn-sm" data-budget-collapse-all @click="collapseAllBudgetCategories">
                    Tanca-ho tot
                </button>
            </div>
        </div>

        <div class="table-responsive">
            <table class="table table-sm table-vcenter real-table budget-table">
                <thead>
                    <tr>
                        <th class="sticky-col" style="min-width: 170px;">Subcategoria</th>
                        <th
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                            style="min-width: 64px;"
                        >
                            {{ monthLabels[month - 1] }}
                        </th>
                        <th class="text-end" style="min-width: 70px;">Total</th>
                        <th class="text-end average-col" style="min-width: 80px;">Mitjana/mes</th>
                    </tr>
                </thead>
                <tbody v-for="category in categoriesList" :key="category.id">
                    <tr class="category-row" :data-category-row="category.id">
                        <td class="sticky-col">
                            <button
                                type="button"
                                class="category-toggle"
                                :aria-expanded="isBudgetCategoryExpanded(category.id)"
                                :data-budget-toggle-category="category.id"
                                @click="toggleBudgetCategory(category.id)"
                            >
                                <component
                                    :is="isBudgetCategoryExpanded(category.id) ? IconChevronDown : IconChevronRight"
                                    :size="16"
                                    class="me-1"
                                />
                                {{ category.name }}
                            </button>
                        </td>
                        <td
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                            :data-month="month"
                        >
                            {{ formatTableAmount(categoryMonthTotal(category, month)) }}
                        </td>
                        <td class="text-end">{{ formatTableAmount(categoryYearTotal(category)) }}</td>
                        <td class="text-end average-col" data-average>
                            {{ formatTableAmount(monthlyAverage(categoryYearTotal(category))) }}
                        </td>
                    </tr>
                    <template v-if="isBudgetCategoryExpanded(category.id)">
                        <tr
                            v-for="subcategory in category.subcategories"
                            :key="subcategory.id"
                            class="subcategory-row"
                            :data-budget-subcategory-row="subcategory.id"
                        >
                            <td class="sticky-col subcategory-name">{{ subcategory.name }}</td>
                            <td
                                v-for="month in months"
                                :key="month"
                                class="budget-cell"
                                :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                                :data-month="month"
                                :data-over-budget="isOverBudget(subcategory.id, month) || undefined"
                            >
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    inputmode="decimal"
                                    class="budget-input"
                                    :class="{ 'text-danger fw-semibold': isOverBudget(subcategory.id, month) }"
                                    :value="getAmount(subcategory.id, month)"
                                    :aria-label="`${subcategory.name} - ${monthLabels[month - 1]}`"
                                    @input="setAmount(subcategory.id, month, $event.target.value)"
                                    @blur="saveCell(subcategory.id, month)"
                                    @keydown.enter.prevent="$event.target.blur()"
                                >
                                <span class="budget-tooltip">{{ actualTooltip(subcategory.id, month) }}</span>
                            </td>
                            <td class="text-end">{{ formatTableAmount(subcategoryTotal(subcategory.id)) }}</td>
                            <td class="text-end average-col" data-average>
                                {{ formatTableAmount(monthlyAverage(subcategoryTotal(subcategory.id))) }}
                            </td>
                        </tr>
                        <tr v-if="category.subcategories.length === 0" class="subcategory-row">
                            <td :colspan="months.length + 3" class="subcategory-name small">
                                Sense subcategories
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <h3 class="mt-4 mb-1">Total per banc</h3>
        <p class="text-secondary small">
            Suma automàtica dels pressupostos de les subcategories, agrupats pel banc que tinguin assignat
            a Categories (en euros, arrodonits). No s'introdueix a mà: canvia el pressupost de la subcategoria
            o el seu banc perquè això es recalculi.
        </p>

        <div v-if="banksList.length === 0" class="text-muted small py-3">
            Encara no hi ha bancs registrats.
        </div>

        <div v-else class="table-responsive">
            <table class="table table-sm table-vcenter real-table">
                <thead>
                    <tr>
                        <th class="sticky-col" style="min-width: 170px;">Banc</th>
                        <th
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                            style="min-width: 64px;"
                        >
                            {{ monthLabels[month - 1] }}
                        </th>
                        <th class="text-end" style="min-width: 70px;">Total</th>
                        <th class="text-end average-col" style="min-width: 80px;">Mitjana/mes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="bank in banksWithNone" :key="bank.id ?? 'none'" :data-bank-row="bank.id ?? 'none'">
                        <td class="sticky-col">{{ bank.name }}</td>
                        <td
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                            :data-month="month"
                        >
                            {{ formatTableAmount(bankMonthTotal(bank.id, month)) }}
                        </td>
                        <td class="text-end">{{ formatTableAmount(bankYearTotal(bank.id)) }}</td>
                        <td class="text-end average-col" data-average>
                            {{ formatTableAmount(monthlyAverage(bankYearTotal(bank.id))) }}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="total-row" data-bank-row="total">
                        <td class="sticky-col">Total</td>
                        <td
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                            :data-month="month"
                        >
                            {{ formatTableAmount(allBanksMonthTotal(month)) }}
                        </td>
                        <td class="text-end">{{ formatTableAmount(allBanksYearTotal()) }}</td>
                        <td class="text-end average-col" data-average>
                            {{ formatTableAmount(monthlyAverage(allBanksYearTotal())) }}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
        </div>

        <div v-else-if="activeTab === 'real'">
        <div class="d-flex flex-wrap align-items-end justify-content-between gap-2 mb-2">
            <div>
                <h3 class="mb-1">Despesa real per subcategoria</h3>
                <p class="text-secondary small mb-0">
                    Imports en euros, arrodonits. Clica una categoria per veure'n les subcategories.
                    En <span class="text-danger fw-semibold">vermell</span>: un mes, que aquell mes t'has passat
                    del pressupost; el Total, que ja has superat el pressupost de tot l'any.
                    <span class="text-danger fw-semibold">▲</span> a Mitjana/mes: vas per sobre del pressupostat
                    de gener fins al mes actual.
                </p>
            </div>
            <div class="btn-list">
                <button type="button" class="btn btn-sm" data-expand-all @click="expandAllCategories">
                    Obre-ho tot
                </button>
                <button type="button" class="btn btn-sm" data-collapse-all @click="collapseAllCategories">
                    Tanca-ho tot
                </button>
            </div>
        </div>

        <div class="table-responsive">
            <table class="table table-sm table-vcenter real-table">
                <thead>
                    <tr>
                        <th class="sticky-col" style="min-width: 170px;">Subcategoria</th>
                        <th
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                            style="min-width: 56px;"
                        >
                            {{ monthLabels[month - 1] }}
                        </th>
                        <th class="text-end" style="min-width: 70px;">Total</th>
                        <th class="text-end average-col" style="min-width: 80px;">Mitjana/mes</th>
                    </tr>
                </thead>
                <tbody v-if="visibleActualCategories.length === 0">
                    <tr>
                        <td :colspan="months.length + 3" class="text-secondary text-center py-4">
                            Encara no hi ha despeses aquest any.
                        </td>
                    </tr>
                </tbody>
                <template v-else>
                <tbody v-for="category in visibleActualCategories" :key="category.id">
                    <tr class="category-row" :data-actual-category-row="category.id">
                        <td class="sticky-col">
                            <button
                                type="button"
                                class="category-toggle"
                                :aria-expanded="isCategoryExpanded(category.id)"
                                :data-toggle-category="category.id"
                                @click="toggleCategory(category.id)"
                            >
                                <component
                                    :is="isCategoryExpanded(category.id) ? IconChevronDown : IconChevronRight"
                                    :size="16"
                                    class="me-1"
                                />
                                {{ category.name }}
                            </button>
                        </td>
                        <td
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                            :data-month="month"
                        >
                            <span
                                v-if="isMonthOverBudget(categoryActualMonthTotal(category, month), categoryBudgetMonthTotal(category.id, month))"
                                class="text-danger fw-semibold"
                                data-over-budget
                            >{{ formatTableAmount(categoryActualMonthTotal(category, month)) }}<span class="visually-hidden"> (per sobre del pressupost)</span></span>
                            <template v-else>{{ formatTableAmount(categoryActualMonthTotal(category, month)) }}</template>
                        </td>
                        <td
                            class="text-end"
                            :class="{ 'text-danger fw-semibold': isTotalOverBudget(categoryActualYearTotal(category), categoryBudgetYearTotal(category.id)) }"
                            data-total
                        >
                            {{ formatTableAmount(categoryActualYearTotal(category)) }}<span
                                v-if="isTotalOverBudget(categoryActualYearTotal(category), categoryBudgetYearTotal(category.id))"
                                class="visually-hidden"
                            > (per sobre del pressupost de l'any)</span>
                        </td>
                        <td class="text-end average-col" data-average>
                            <span
                                v-if="isAverageOverBudget(categoryActualYearTotal(category), categoryBudgetToDate(category.id))"
                                class="text-danger fw-semibold"
                                data-over-budget
                            >▲ {{ formatTableAmount(actualMonthlyAverage(categoryActualYearTotal(category))) }}<span class="visually-hidden"> (per sobre del pressupost)</span></span>
                            <template v-else>{{ formatTableAmount(actualMonthlyAverage(categoryActualYearTotal(category))) }}</template>
                        </td>
                    </tr>
                    <template v-if="isCategoryExpanded(category.id)">
                        <tr
                            v-for="subcategory in category.subcategories"
                            :key="subcategory.id"
                            class="subcategory-row"
                            :data-actual-subcategory-row="subcategory.id"
                        >
                            <td class="sticky-col subcategory-name">{{ subcategory.name }}</td>
                            <td
                                v-for="month in months"
                                :key="month"
                                class="text-end"
                                :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                                :data-month="month"
                            >
                                <span
                                    v-if="getActual(subcategory.id, month) !== undefined && isOverBudget(subcategory.id, month)"
                                    class="text-danger fw-semibold"
                                    data-over-budget
                                >{{ formatTableAmount(getActual(subcategory.id, month)) }}<span class="visually-hidden"> (per sobre del pressupost)</span></span>
                                <span v-else-if="getActual(subcategory.id, month) !== undefined">
                                    {{ formatTableAmount(getActual(subcategory.id, month)) }}
                                </span>
                                <span v-else class="text-muted">–</span>
                            </td>
                            <td
                                class="text-end"
                                :class="{ 'text-danger fw-semibold': isTotalOverBudget(subcategoryActualTotal(subcategory.id), subcategoryTotal(subcategory.id)) }"
                                data-total
                            >
                                {{ formatTableAmount(subcategoryActualTotal(subcategory.id)) }}<span
                                    v-if="isTotalOverBudget(subcategoryActualTotal(subcategory.id), subcategoryTotal(subcategory.id))"
                                    class="visually-hidden"
                                > (per sobre del pressupost de l'any)</span>
                            </td>
                            <td class="text-end average-col" data-average>
                                <span
                                    v-if="isAverageOverBudget(subcategoryActualTotal(subcategory.id), subcategoryBudgetToDate(subcategory.id))"
                                    class="text-danger fw-semibold"
                                    data-over-budget
                                >▲ {{ formatTableAmount(actualMonthlyAverage(subcategoryActualTotal(subcategory.id))) }}<span class="visually-hidden"> (per sobre del pressupost)</span></span>
                                <template v-else>{{ formatTableAmount(actualMonthlyAverage(subcategoryActualTotal(subcategory.id))) }}</template>
                            </td>
                        </tr>
                    </template>
                </tbody>
                </template>
                <tfoot>
                    <tr class="total-row" data-actual-total-row>
                        <td class="sticky-col">Total</td>
                        <td
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                            :data-month="month"
                        >
                            <span
                                v-if="isMonthOverBudget(actualMonthTotal(month), budgetMonthTotal(month))"
                                class="text-danger fw-semibold"
                                data-over-budget
                            >{{ formatTableAmount(actualMonthTotal(month)) }}<span class="visually-hidden"> (per sobre del pressupost)</span></span>
                            <template v-else>{{ formatTableAmount(actualMonthTotal(month)) }}</template>
                        </td>
                        <td
                            class="text-end"
                            :class="{ 'text-danger fw-semibold': isTotalOverBudget(actualYearTotal(), budgetYearTotal()) }"
                            data-total
                        >
                            {{ formatTableAmount(actualYearTotal()) }}<span
                                v-if="isTotalOverBudget(actualYearTotal(), budgetYearTotal())"
                                class="visually-hidden"
                            > (per sobre del pressupost de l'any)</span>
                        </td>
                        <td class="text-end average-col" data-average>
                            <span
                                v-if="isAverageOverBudget(actualYearTotal(), budgetToDate())"
                                class="text-danger fw-semibold"
                                data-over-budget
                            >▲ {{ formatTableAmount(actualMonthlyAverage(actualYearTotal())) }}<span class="visually-hidden"> (per sobre del pressupost)</span></span>
                            <template v-else>{{ formatTableAmount(actualMonthlyAverage(actualYearTotal())) }}</template>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>

        <h3 class="mt-4 mb-1">Despesa real per banc</h3>
        <p class="text-secondary small">
            Imports en euros, arrodonits, segons el banc amb què s'han pagat (el que tries a cada despesa).
            Les despeses sense banc es compten a "Sense banc".
        </p>

        <div class="table-responsive">
            <table class="table table-sm table-vcenter real-table">
                <thead>
                    <tr>
                        <th class="sticky-col" style="min-width: 170px;">Banc</th>
                        <th
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                            style="min-width: 56px;"
                        >
                            {{ monthLabels[month - 1] }}
                        </th>
                        <th class="text-end" style="min-width: 70px;">Total</th>
                        <th class="text-end average-col" style="min-width: 80px;">Mitjana/mes</th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="bank in banksWithNone"
                        :key="bank.id ?? 'none'"
                        :data-actual-bank-row="bank.id ?? 'none'"
                    >
                        <td class="sticky-col">{{ bank.name }}</td>
                        <td
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                            :data-month="month"
                        >
                            {{ formatTableAmount(bankActualMonthTotal(bank.id, month)) }}
                        </td>
                        <td class="text-end">{{ formatTableAmount(bankActualYearTotal(bank.id)) }}</td>
                        <td class="text-end average-col" data-average>
                            {{ formatTableAmount(actualMonthlyAverage(bankActualYearTotal(bank.id))) }}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="total-row" data-actual-bank-row="total">
                        <td class="sticky-col">Total</td>
                        <td
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :class="{ 'current-month': month === currentMonth, 'alt-month': month % 2 === 0 }"
                            :data-month="month"
                        >
                            {{ formatTableAmount(actualMonthTotal(month)) }}
                        </td>
                        <td class="text-end">{{ formatTableAmount(actualYearTotal()) }}</td>
                        <td class="text-end average-col" data-average>
                            {{ formatTableAmount(actualMonthlyAverage(actualYearTotal())) }}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
        </div>

        <div v-else>
        <h3 class="mb-2">Pressupost vs. real per categoria</h3>
        <p class="text-muted small">
            Per a cada categoria, el pressupost i la despesa real de cada mes de l'any, un al costat de l'altre.
            Passa el ratolí per sobre d'un mes per veure'n les xifres exactes.
        </p>

        <div class="row row-cards">
            <div
                v-for="category in categoriesList"
                :key="category.id"
                class="col-12 col-lg-6"
                :data-chart-category="category.id"
            >
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">{{ category.name }}</h3>
                    </div>
                    <div class="card-body">
                        <CategoryMonthlyChart
                            :month-labels="monthLabels"
                            :budget-data="categoryBudgetSeries(category)"
                            :actual-data="categoryActualSeries(category)"
                            :actual-months="elapsedMonths"
                        />
                    </div>
                </div>
            </div>
        </div>
        </div>
    </div>
    </div>
    </AppLayout>
</template>

<style scoped>
.budget-cell {
    position: relative;
}

/* El vermell "table-danger" de Bootstrap és molt clar (pensat per a text sobre fons blanc).
   Es reforça la intensitat perquè es distingeixi d'un cop d'ull a la graella. */
/* Caselles d'entrada del pressupost: sense marc ni fletxetes, com un full de càlcul. El requadre
   només apareix en passar-hi el ratolí o en escriure-hi. */
.budget-input {
    width: 100%;
    min-width: 0;
    padding: 0.125rem 0.25rem;
    border: 1px solid transparent;
    border-radius: 4px;
    background: transparent;
    color: inherit;
    text-align: right;
    font-variant-numeric: tabular-nums;
    -moz-appearance: textfield;
    appearance: textfield;
}

.budget-input::-webkit-outer-spin-button,
.budget-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

.budget-input:hover {
    border-color: var(--tblr-border-color);
}

.budget-input:focus {
    outline: none;
    border-color: var(--tblr-primary);
    background-color: var(--tblr-bg-surface);
    box-shadow: 0 0 0 2px var(--tblr-primary-lt);
}

/* Taules de la pestanya Real: sense vores verticals, xifres alineades i fàcils de comparar. */
.real-table {
    font-variant-numeric: tabular-nums;
}

.real-table thead th {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--tblr-secondary);
    border-bottom-width: 2px;
}

/* La primera columna queda fixa en fer scroll horitzontal al mòbil. */
.real-table .sticky-col {
    position: sticky;
    left: 0;
    z-index: 1;
    background-color: var(--tblr-bg-surface);
}

.real-table .category-row .sticky-col {
    background-color: var(--tblr-bg-surface-secondary);
}

.real-table .category-row td {
    font-weight: 700;
    background-color: var(--tblr-bg-surface-secondary);
    border-top: 1px solid var(--tblr-border-color);
}

/* Subcategories: smaller and lighter than their category, indented with a vertical guide line
   that ties them to the category row above. */
.real-table .subcategory-row td {
    font-size: 0.8125rem;
    border-bottom-color: transparent;
}

.real-table .subcategory-name {
    padding-left: 1.75rem;
    color: var(--tblr-secondary);
    background-image: linear-gradient(var(--tblr-border-color), var(--tblr-border-color));
    background-size: 2px 100%;
    background-position: 0.85rem 0;
    background-repeat: no-repeat;
}

.real-table .total-row td {
    font-weight: 700;
    border-top: 2px solid var(--tblr-border-color);
    border-bottom: 0;
}

.category-toggle {
    display: inline-flex;
    align-items: center;
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font-weight: inherit;
    cursor: pointer;
}

/* Un mes sí i un no amb un fons molt suau, perquè l'ull segueixi cada columna avall. Es fa amb una capa
   semitransparent del color del text (background-image), així se suma al gris de les categories i al groc
   del mes actual en lloc de tapar-los, i funciona igual en mode fosc. */
.real-table .alt-month {
    background-image: linear-gradient(rgba(var(--tblr-body-color-rgb), 0.04), rgba(var(--tblr-body-color-rgb), 0.04));
}

/* Columna del mes en curs: un fons groc suau per situar-se ràpid (semitransparent, vàlid en mode fosc).
   Es repeteix per a les files de categoria perquè el seu fons gris no el tapi. */
.real-table .current-month,
.real-table .category-row td.current-month {
    background-color: var(--tblr-yellow-lt);
}

.real-table .category-row td.average-col {
    background-color: var(--tblr-primary-lt);
}

/* Fons diferenciat per a la columna "Mitjana/mes", perquè no es confongui amb els imports mensuals
   ni amb el total de l'any. El blau clar de Tabler és semitransparent: funciona també sobre les
   files grises de categoria i en mode fosc. */
.average-col {
    background-color: var(--tblr-primary-lt);
}

.budget-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 4px;
    padding: 2px 8px;
    background: #1a1a1a;
    color: #fff;
    font-size: 0.7rem;
    white-space: nowrap;
    border-radius: 4px;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: opacity 0.1s ease;
    z-index: 10;
}

.budget-cell:hover .budget-tooltip {
    opacity: 1;
    visibility: visible;
}
</style>
