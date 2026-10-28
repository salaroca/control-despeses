<script setup>
import { computed, ref } from 'vue';
import { router, useForm } from '@inertiajs/vue3';
import { IconPencil, IconTrash } from '@tabler/icons-vue';
import AppLayout from '../../Layouts/AppLayout.vue';
import PricesTabs from '../../Components/PricesTabs.vue';

const props = defineProps({
    productsList: { type: Array, required: true },
});

// What a product's price is compared by. Optional: it can be left empty until the first price.
const UNIT_OPTIONS = [
    { value: 'kg', label: 'Quilo (kg)' },
    { value: 'l', label: 'Litre (l)' },
    { value: 'u', label: 'Unitat (u)' },
];

const NO_GROUP = 'Sense grup';

function unitLabel(unit) {
    return UNIT_OPTIONS.find((option) => option.value === unit)?.label ?? null;
}

// Existing groups, to suggest them when typing (same names as the Obsidian ingredients).
const groupList = computed(() => [...new Set(props.productsList.map((product) => product.group).filter(Boolean))]
    .sort((first, second) => first.localeCompare(second, 'ca')));

// --- Create ---
const createForm = useForm({ name: '', group: '', unit: '' });

function submitCreate() {
    createForm
        .transform((data) => ({ ...data, group: data.group || null, unit: data.unit || null }))
        .post('/articles', {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
}

// --- Filters ---
const searchTerm = ref('');
const groupFilter = ref('');

function normalize(text) {
    return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

const filteredProductList = computed(() => {
    const term = normalize(searchTerm.value.trim());

    return props.productsList.filter((product) => (term === '' || normalize(product.name).includes(term))
        && (groupFilter.value === '' || (product.group ?? NO_GROUP) === groupFilter.value));
});

// Products grouped by group, groups in alphabetical order and "Sense grup" last.
const groupedProductList = computed(() => {
    const byGroup = new Map();

    filteredProductList.value.forEach((product) => {
        const group = product.group ?? NO_GROUP;

        if (!byGroup.has(group)) {
            byGroup.set(group, []);
        }

        byGroup.get(group).push(product);
    });

    return [...byGroup.entries()]
        .sort(([first], [second]) => {
            if (first === NO_GROUP) {
                return 1;
            }

            if (second === NO_GROUP) {
                return -1;
            }

            return first.localeCompare(second, 'ca');
        })
        .map(([group, products]) => ({ group, products }));
});

const hasProductsWithoutGroup = computed(() => props.productsList.some((product) => !product.group));

function clearFilters() {
    searchTerm.value = '';
    groupFilter.value = '';
}

// --- Edit / delete ---
const editingId = ref(null);
const editForm = ref(null);

function startEdit(product) {
    editingId.value = product.id;
    editForm.value = useForm({ name: product.name, group: product.group ?? '', unit: product.unit ?? '' });
}

function cancelEdit() {
    editingId.value = null;
    editForm.value = null;
}

function submitEdit(product) {
    editForm.value
        .transform((data) => ({ ...data, group: data.group || null, unit: data.unit || null }))
        .put(`/articles/${product.id}`, {
            preserveScroll: true,
            onSuccess: () => cancelEdit(),
        });
}

function destroyProduct(product) {
    const pricesWarning = product.prices_count > 0
        ? ` També s'esborraran els seus ${product.prices_count} preus apuntats.`
        : '';

    if (!confirm(`Segur que vols eliminar l'article "${product.name}"?${pricesWarning}`)) {
        return;
    }

    router.delete(`/articles/${product.id}`, { preserveScroll: true });
}
</script>

<template>
    <AppLayout>
    <div class="page-header d-print-none">
        <div class="container-xl">
            <div class="row g-2 align-items-center">
                <div class="col">
                    <h2 class="page-title">Preus</h2>
                </div>
            </div>
        </div>
    </div>
    <div class="page-body">
    <div class="container-xl">
        <PricesTabs />

        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title">Afegeix un article</h3>
            </div>
            <div class="card-body">
                <form class="row g-2 align-items-start" @submit.prevent="submitCreate">
                    <div class="col-12 col-md-5">
                        <input
                            v-model="createForm.name"
                            type="text"
                            class="form-control form-control-lg"
                            placeholder="Nom de l'article (p. ex. Arròs)"
                        >
                        <div v-if="createForm.errors.name" class="text-danger small mt-1">
                            {{ createForm.errors.name }}
                        </div>
                    </div>
                    <div class="col-12 col-md-3">
                        <input
                            v-model="createForm.group"
                            type="text"
                            class="form-control form-control-lg"
                            list="product-groups"
                            placeholder="Grup (opcional)"
                        >
                    </div>
                    <div class="col-12 col-md-2">
                        <select v-model="createForm.unit" class="form-select form-select-lg" aria-label="Es compara per">
                            <option value="">Es compara per…</option>
                            <option v-for="option in UNIT_OPTIONS" :key="option.value" :value="option.value">
                                {{ option.label }}
                            </option>
                        </select>
                        <div v-if="createForm.errors.unit" class="text-danger small mt-1">
                            {{ createForm.errors.unit }}
                        </div>
                    </div>
                    <div class="col-12 col-md-auto">
                        <button type="submit" class="btn btn-primary btn-lg" :disabled="createForm.processing">
                            Afegeix
                        </button>
                    </div>
                </form>
                <datalist id="product-groups">
                    <option v-for="group in groupList" :key="group" :value="group" />
                </datalist>
            </div>
        </div>

        <div v-if="productsList.length === 0" class="text-center text-muted py-5">
            Encara no hi ha articles registrats.
        </div>

        <template v-else>
            <div class="row g-2 mb-3 align-items-center">
                <div class="col-12 col-md-5">
                    <input
                        v-model="searchTerm"
                        type="search"
                        class="form-control"
                        placeholder="Cerca un article…"
                        aria-label="Cerca un article"
                    >
                </div>
                <div class="col-12 col-md-4">
                    <select v-model="groupFilter" class="form-select" aria-label="Filtra per grup">
                        <option value="">Tots els grups</option>
                        <option v-for="group in groupList" :key="group" :value="group">{{ group }}</option>
                        <option v-if="hasProductsWithoutGroup" :value="NO_GROUP">{{ NO_GROUP }}</option>
                    </select>
                </div>
                <div class="col-auto">
                    <button
                        v-if="searchTerm || groupFilter"
                        type="button"
                        class="btn btn-outline-secondary"
                        @click="clearFilters"
                    >
                        Neteja
                    </button>
                </div>
                <div class="col text-md-end text-secondary small" data-products-count>
                    {{ filteredProductList.length }} de {{ productsList.length }} articles
                </div>
            </div>

            <div v-if="filteredProductList.length === 0" class="text-center text-muted py-4">
                Cap article coincideix amb la cerca.
            </div>

            <div v-for="section in groupedProductList" :key="section.group" class="mb-4" :data-group-section="section.group">
                <h3 class="h4 mb-2">
                    {{ section.group }}
                    <span class="text-secondary fw-normal small">({{ section.products.length }})</span>
                </h3>
                <ul class="list-group">
                    <li
                        v-for="product in section.products"
                        :key="product.id"
                        class="list-group-item"
                        :data-product-row="product.id"
                    >
                        <div v-if="editingId === product.id" class="row g-2 align-items-start py-1">
                            <div class="col-12 col-md-5">
                                <input
                                    v-model="editForm.name"
                                    type="text"
                                    class="form-control"
                                    aria-label="Nom de l'article"
                                >
                                <div v-if="editForm.errors.name" class="text-danger small mt-1">
                                    {{ editForm.errors.name }}
                                </div>
                            </div>
                            <div class="col-12 col-md-3">
                                <input
                                    v-model="editForm.group"
                                    type="text"
                                    class="form-control"
                                    list="product-groups"
                                    placeholder="Grup"
                                    aria-label="Grup"
                                >
                            </div>
                            <div class="col-12 col-md-2">
                                <select v-model="editForm.unit" class="form-select" aria-label="Es compara per">
                                    <option value="">—</option>
                                    <option v-for="option in UNIT_OPTIONS" :key="option.value" :value="option.value">
                                        {{ option.label }}
                                    </option>
                                </select>
                            </div>
                            <div class="col-12 col-md-auto d-flex gap-2">
                                <button
                                    type="button"
                                    class="btn btn-primary"
                                    :disabled="editForm.processing"
                                    @click="submitEdit(product)"
                                >
                                    Desa
                                </button>
                                <button type="button" class="btn btn-outline-secondary" @click="cancelEdit">
                                    Cancel·la
                                </button>
                            </div>
                        </div>
                        <div v-else class="d-flex justify-content-between align-items-center gap-2">
                            <div>
                                <span class="fw-semibold">{{ product.name }}</span>
                                <span v-if="unitLabel(product.unit)" class="badge bg-secondary-lt ms-2" data-unit>
                                    {{ unitLabel(product.unit) }}
                                </span>
                            </div>
                            <div class="d-flex gap-2">
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary"
                                    aria-label="Edita article"
                                    @click="startEdit(product)"
                                >
                                    <IconPencil :size="16" />
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-danger"
                                    aria-label="Elimina article"
                                    @click="destroyProduct(product)"
                                >
                                    <IconTrash :size="16" />
                                </button>
                            </div>
                        </div>
                    </li>
                </ul>
            </div>
        </template>
    </div>
    </div>
    </AppLayout>
</template>
