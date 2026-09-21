<script setup>
import { computed, reactive } from 'vue';
import { Link, router, usePage } from '@inertiajs/vue3';
import AppLayout from '../../Layouts/AppLayout.vue';

const props = defineProps({
    year: { type: Number, required: true },
    budgets: { type: Array, required: true },
});

const page = usePage();
const categoriesList = computed(() => page.props.categoriesList);

const monthLabels = ['Gen', 'Feb', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Des'];
const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

function cellKey(subcategoryId, month) {
    return `${subcategoryId}-${month}`;
}

const amounts = reactive({});
props.budgets.forEach((budget) => {
    amounts[cellKey(budget.subcategory_id, budget.month)] = String(budget.amount);
});

function getAmount(subcategoryId, month) {
    return amounts[cellKey(subcategoryId, month)] ?? '';
}

function setAmount(subcategoryId, month, value) {
    amounts[cellKey(subcategoryId, month)] = value;
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

function formatAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(amount);
}
</script>

<template>
    <AppLayout>
    <div class="container py-4">
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
            <h1 class="h3 mb-0">Pressupost {{ year }}</h1>
            <div class="d-flex align-items-center gap-2">
                <Link :href="`/pressupostos?year=${year - 1}`" class="btn btn-outline-secondary btn-sm">
                    &laquo; {{ year - 1 }}
                </Link>
                <Link :href="`/pressupostos?year=${year + 1}`" class="btn btn-outline-secondary btn-sm">
                    {{ year + 1 }} &raquo;
                </Link>
            </div>
        </div>

        <p class="text-muted small">
            Introdueix l'import previst per a cada subcategoria i mes. Els canvis es desen automàticament
            en sortir de la casella.
        </p>

        <div class="table-responsive">
            <table class="table table-sm table-bordered align-middle">
                <thead>
                    <tr class="table-light">
                        <th style="position: sticky; left: 0; background: inherit; min-width: 180px;">
                            Subcategoria
                        </th>
                        <th v-for="month in months" :key="month" class="text-center" style="min-width: 90px;">
                            {{ monthLabels[month - 1] }}
                        </th>
                        <th class="text-end" style="min-width: 110px;">Total any</th>
                    </tr>
                </thead>
                <tbody>
                    <template v-for="category in categoriesList" :key="category.id">
                        <tr class="table-light">
                            <td :colspan="months.length + 2" class="fw-semibold">
                                {{ category.name }}
                            </td>
                        </tr>
                        <tr v-for="subcategory in category.subcategories" :key="subcategory.id">
                            <td style="position: sticky; left: 0; background: inherit;" class="ps-4">
                                {{ subcategory.name }}
                            </td>
                            <td v-for="month in months" :key="month">
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
    </div>
    </AppLayout>
</template>
