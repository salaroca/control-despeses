<script setup>
import { computed, ref } from 'vue';
import { Link, router, useForm, usePage } from '@inertiajs/vue3';
import { IconPencil, IconSearch, IconTrash, IconX } from '@tabler/icons-vue';
import AppLayout from '../../Layouts/AppLayout.vue';
import ExpenseForm from './Partials/ExpenseForm.vue';

const props = defineProps({
    expenses: { type: Object, required: true },
    filters: { type: Object, required: true },
});

const page = usePage();
const categoriesList = computed(() => page.props.categoriesList);
const banksList = computed(() => page.props.banksList);

const searchTerm = ref(props.filters.search ?? '');
const subcategoryFilter = ref(props.filters.subcategory_id ?? '');
let searchDebounce = null;

function applyFilters() {
    router.get(
        '/despeses',
        {
            search: searchTerm.value || undefined,
            subcategory_id: subcategoryFilter.value || undefined,
        },
        { preserveState: true, preserveScroll: true, replace: true },
    );
}

function onSearchInput() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(applyFilters, 300);
}

function clearFilters() {
    searchTerm.value = '';
    subcategoryFilter.value = '';
    applyFilters();
}

const hasActiveFilters = computed(() => searchTerm.value !== '' || subcategoryFilter.value !== '');

function emptyExpenseData() {
    return {
        category_id: '',
        subcategory_id: '',
        bank_id: '',
        amount: '',
        date: new Date().toISOString().slice(0, 10),
        note: '',
    };
}

const createForm = useForm(emptyExpenseData());

function submitCreate() {
    createForm.post('/despeses', {
        preserveScroll: true,
        onSuccess: () => createForm.reset(),
    });
}

const editingId = ref(null);
const editForm = ref(null);

function startEdit(expense) {
    editingId.value = expense.id;
    editForm.value = useForm({
        category_id: expense.subcategory.category_id,
        subcategory_id: expense.subcategory_id,
        bank_id: expense.bank_id ?? '',
        amount: expense.amount,
        date: expense.date.slice(0, 10),
        note: expense.note ?? '',
    });
}

function cancelEdit() {
    editingId.value = null;
    editForm.value = null;
}

function submitEdit(expense) {
    editForm.value.put(`/despeses/${expense.id}`, {
        preserveScroll: true,
        onSuccess: () => {
            editingId.value = null;
            editForm.value = null;
        },
    });
}

function destroyExpense(expense) {
    if (!confirm('Segur que vols eliminar aquesta despesa?')) {
        return;
    }

    router.delete(`/despeses/${expense.id}`, { preserveScroll: true });
}

function formatAmount(amount) {
    return new Intl.NumberFormat('ca-ES', { style: 'currency', currency: 'EUR' }).format(Number(amount));
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('ca-ES');
}
</script>

<template>
    <AppLayout>
    <div class="page-header d-print-none">
        <div class="container-xl">
            <div class="row g-2 align-items-center">
                <div class="col">
                    <h2 class="page-title">Despeses</h2>
                </div>
            </div>
        </div>
    </div>
    <div class="page-body">
    <div class="container-xl">
        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title">Afegeix una despesa</h3>
            </div>
            <div class="card-body">
                <ExpenseForm
                    :form="createForm"
                    :categories-list="categoriesList"
                    :banks-list="banksList"
                    submit-label="Afegeix"
                    @submit="submitCreate"
                />
            </div>
        </div>

        <div class="card mb-3">
            <div class="card-body">
                <div class="row g-2 align-items-end">
                    <div class="col-12 col-md-6">
                        <label class="form-label">Cerca a la nota</label>
                        <div class="input-group">
                            <span class="input-group-text"><IconSearch :size="16" /></span>
                            <input
                                v-model="searchTerm"
                                type="text"
                                class="form-control"
                                placeholder="Cerca per text a la nota..."
                                @input="onSearchInput"
                            >
                        </div>
                    </div>
                    <div class="col-12 col-md-4">
                        <label class="form-label">Subcategoria</label>
                        <select
                            v-model="subcategoryFilter"
                            class="form-select"
                            aria-label="Filtra per subcategoria"
                            @change="applyFilters"
                        >
                            <option value="">Totes</option>
                            <optgroup v-for="category in categoriesList" :key="category.id" :label="category.name">
                                <option
                                    v-for="subcategory in category.subcategories"
                                    :key="subcategory.id"
                                    :value="subcategory.id"
                                >
                                    {{ subcategory.name }}
                                </option>
                            </optgroup>
                        </select>
                    </div>
                    <div class="col-12 col-md-2">
                        <button
                            type="button"
                            class="btn btn-outline-secondary w-100"
                            :disabled="!hasActiveFilters"
                            @click="clearFilters"
                        >
                            <IconX :size="16" /> Neteja
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="expenses.data.length === 0 && hasActiveFilters" class="text-center text-muted py-5">
            Cap despesa coincideix amb la cerca.
        </div>

        <div v-else-if="expenses.data.length === 0" class="text-center text-muted py-5">
            Encara no hi ha despeses registrades.
        </div>

        <ul v-else class="list-group mb-3">
            <li v-for="expense in expenses.data" :key="expense.id" class="list-group-item">
                <div v-if="editingId === expense.id" class="py-2">
                    <ExpenseForm
                        :form="editForm"
                        :categories-list="categoriesList"
                        :banks-list="banksList"
                        submit-label="Desa"
                        show-cancel
                        @submit="submitEdit(expense)"
                        @cancel="cancelEdit"
                    />
                </div>
                <div v-else class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <div>
                        <div class="fw-semibold">
                            {{ expense.subcategory.category.name }} · {{ expense.subcategory.name }}
                        </div>
                        <div class="text-muted small">
                            {{ formatDate(expense.date) }}
                            <span v-if="expense.bank"> · {{ expense.bank.name }}</span>
                            <span v-if="expense.note"> — {{ expense.note }}</span>
                        </div>
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <span class="fw-bold">{{ formatAmount(expense.amount) }}</span>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            aria-label="Edita"
                            @click="startEdit(expense)"
                        >
                            <IconPencil :size="16" />
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            aria-label="Elimina"
                            @click="destroyExpense(expense)"
                        >
                            <IconTrash :size="16" />
                        </button>
                    </div>
                </div>
            </li>
        </ul>

        <div v-if="expenses.prev_page_url || expenses.next_page_url" class="d-flex justify-content-between">
            <Link
                v-if="expenses.prev_page_url"
                :href="expenses.prev_page_url"
                class="btn btn-outline-primary"
                preserve-scroll
            >
                Anterior
            </Link>
            <span v-else></span>
            <Link
                v-if="expenses.next_page_url"
                :href="expenses.next_page_url"
                class="btn btn-outline-primary"
                preserve-scroll
            >
                Següent
            </Link>
        </div>
    </div>
    </div>
    </AppLayout>
</template>
