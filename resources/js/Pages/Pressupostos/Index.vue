<script setup>
import { computed, reactive } from 'vue';
import { Link, router, usePage } from '@inertiajs/vue3';
import AppLayout from '../../Layouts/AppLayout.vue';

const props = defineProps({
    year: { type: Number, required: true },
    budgets: { type: Array, required: true },
    actuals: { type: Array, required: true },
});

const page = usePage();
const categoriesList = computed(() => page.props.categoriesList);
const banksList = computed(() => page.props.banksList);

const monthLabels = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function cellKey(subcategoryId, month) {
    return `${subcategoryId}-${month}`;
}

const amounts = reactive({});
props.budgets.forEach((budget) => {
    amounts[cellKey(budget.subcategory_id, budget.month)] = String(budget.amount);
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

function formatAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
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
                        <Link :href="`/pressupostos?year=${year - 1}`" class="btn btn-outline-secondary btn-sm">
                            &laquo; {{ year - 1 }}
                        </Link>
                        <Link :href="`/pressupostos?year=${year + 1}`" class="btn btn-outline-secondary btn-sm">
                            {{ year + 1 }} &raquo;
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <div class="page-body">
    <div class="container-xxl">
        <h3 class="mb-2">Pressupost per subcategoria</h3>
        <p class="text-muted small">
            Introdueix l'import previst per a cada subcategoria i mes. Els canvis es desen automàticament
            en sortir de la casella. Un cop hi ha despesa real registrada aquell mes, la casella es pinta
            en <span class="text-success">verd</span> si t'hi has mantingut (gastat ≤ pressupostat) o en
            <span class="text-danger">vermell</span> si t'has passat. Passa el ratolí per sobre d'una
            casella per veure la despesa real d'aquell mes.
        </p>

        <div class="table-responsive">
            <table class="table table-sm table-bordered align-middle">
                <thead>
                    <tr class="table-light">
                        <th style="position: sticky; left: 0; background: inherit; min-width: 130px;">
                            Subcategoria
                        </th>
                        <th v-for="month in months" :key="month" class="text-center" style="min-width: 58px;">
                            {{ monthLabels[month - 1] }}
                        </th>
                        <th class="text-end" style="min-width: 85px;">Total any</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="category in categoriesList" :key="category.id">
                        <tr class="table-light" :data-category-row="category.id">
                            <td style="position: sticky; left: 0; background: inherit;" class="fw-semibold">
                                {{ category.name }}
                            </td>
                            <td
                                v-for="month in months"
                                :key="month"
                                class="text-end fw-semibold"
                                :data-month="month"
                            >
                                {{ formatAmount(categoryMonthTotal(category, month)) }}
                            </td>
                            <td class="text-end fw-semibold">
                                {{ formatAmount(categoryYearTotal(category)) }}
                            </td>
                        </tr>
                        <tr v-for="subcategory in category.subcategories" :key="subcategory.id">
                            <td style="position: sticky; left: 0; background: inherit;" class="ps-4">
                                {{ subcategory.name }}
                            </td>
                            <td
                                v-for="month in months"
                                :key="month"
                                class="budget-cell"
                                :class="cellVariant(subcategory.id, month)"
                            >
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    inputmode="decimal"
                                    class="form-control form-control-sm"
                                    :value="getAmount(subcategory.id, month)"
                                    :aria-label="`${subcategory.name} - ${monthLabels[month - 1]}`"
                                    @input="setAmount(subcategory.id, month, $event.target.value)"
                                    @blur="saveCell(subcategory.id, month)"
                                    @keydown.enter.prevent="$event.target.blur()"
                                >
                                <span class="budget-tooltip">{{ actualTooltip(subcategory.id, month) }}</span>
                            </td>
                            <td class="text-end fw-semibold">
                                {{ formatAmount(subcategoryTotal(subcategory.id)) }}
                            </td>
                        </tr>
                        <tr v-if="category.subcategories.length === 0">
                            <td :colspan="months.length + 2" class="text-muted small ps-4">
                                Sense subcategories
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </div>

        <h3 class="mt-4 mb-2">Total per banc</h3>
        <p class="text-muted small">
            Suma automàtica dels pressupostos de les subcategories, agrupats pel banc que tinguin assignat
            a Categories. No s'introdueix a mà: canvia el pressupost de la subcategoria o el seu banc perquè
            això es recalculi.
        </p>

        <div v-if="banksList.length === 0" class="text-muted small py-3">
            Encara no hi ha bancs registrats.
        </div>

        <div v-else class="table-responsive">
            <table class="table table-sm table-bordered align-middle">
                <thead>
                    <tr class="table-light">
                        <th style="position: sticky; left: 0; background: inherit; min-width: 130px;">
                            Banc
                        </th>
                        <th v-for="month in months" :key="month" class="text-center" style="min-width: 58px;">
                            {{ monthLabels[month - 1] }}
                        </th>
                        <th class="text-end" style="min-width: 85px;">Total any</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="bank in banksWithNone" :key="bank.id ?? 'none'" :data-bank-row="bank.id ?? 'none'">
                        <td style="position: sticky; left: 0; background: inherit;">
                            {{ bank.name }}
                        </td>
                        <td
                            v-for="month in months"
                            :key="month"
                            class="text-end"
                            :data-month="month"
                        >
                            {{ formatAmount(bankMonthTotal(bank.id, month)) }}
                        </td>
                        <td class="text-end fw-semibold">
                            {{ formatAmount(bankYearTotal(bank.id)) }}
                        </td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr class="table-light" data-bank-row="total">
                        <td style="position: sticky; left: 0; background: inherit;" class="fw-bold">
                            Total
                        </td>
                        <td
                            v-for="month in months"
                            :key="month"
                            class="text-end fw-bold"
                            :data-month="month"
                        >
                            {{ formatAmount(allBanksMonthTotal(month)) }}
                        </td>
                        <td class="text-end fw-bold">
                            {{ formatAmount(allBanksYearTotal()) }}
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
    </div>
    </div>
    </AppLayout>
</template>

<style scoped>
.budget-cell {
    position: relative;
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
