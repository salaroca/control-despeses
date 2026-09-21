<script setup>
import { computed, ref } from 'vue';
import { router, useForm, usePage } from '@inertiajs/vue3';
import { IconPencil, IconTrash } from '@tabler/icons-vue';
import AppLayout from '../../Layouts/AppLayout.vue';

const page = usePage();
const categoriesList = computed(() => page.props.categoriesList);
const banksList = computed(() => page.props.banksList);
const deleteError = computed(() => page.props.errors?.delete);

function bankName(bankId) {
    return banksList.value.find((bank) => bank.id === bankId)?.name;
}

const createCategoryForm = useForm({ name: '' });

function submitCreateCategory() {
    createCategoryForm.post('/categories', {
        preserveScroll: true,
        onSuccess: () => createCategoryForm.reset(),
    });
}

const createSubcategoryForm = useForm({ category_id: '', bank_id: '', name: '' });

function submitCreateSubcategory() {
    createSubcategoryForm.post('/subcategories', {
        preserveScroll: true,
        onSuccess: () => createSubcategoryForm.reset(),
    });
}

const editingCategoryId = ref(null);
const editingCategoryForm = ref(null);

function startEditCategory(category) {
    editingCategoryId.value = category.id;
    editingCategoryForm.value = useForm({ name: category.name });
}

function cancelEditCategory() {
    editingCategoryId.value = null;
    editingCategoryForm.value = null;
}

function submitEditCategory(category) {
    editingCategoryForm.value.put(`/categories/${category.id}`, {
        preserveScroll: true,
        onSuccess: () => cancelEditCategory(),
    });
}

function destroyCategory(category) {
    if (!confirm(`Segur que vols eliminar la categoria "${category.name}" i totes les seves subcategories?`)) {
        return;
    }

    router.delete(`/categories/${category.id}`, { preserveScroll: true });
}

const editingSubcategoryId = ref(null);
const editingSubcategoryForm = ref(null);

function startEditSubcategory(subcategory) {
    editingSubcategoryId.value = subcategory.id;
    editingSubcategoryForm.value = useForm({
        category_id: subcategory.category_id,
        bank_id: subcategory.bank_id ?? '',
        name: subcategory.name,
    });
}

function cancelEditSubcategory() {
    editingSubcategoryId.value = null;
    editingSubcategoryForm.value = null;
}

function submitEditSubcategory(subcategory) {
    editingSubcategoryForm.value.put(`/subcategories/${subcategory.id}`, {
        preserveScroll: true,
        onSuccess: () => cancelEditSubcategory(),
    });
}

function destroySubcategory(subcategory) {
    if (!confirm(`Segur que vols eliminar la subcategoria "${subcategory.name}"?`)) {
        return;
    }

    router.delete(`/subcategories/${subcategory.id}`, { preserveScroll: true });
}
</script>

<template>
    <AppLayout>
    <div class="page-header d-print-none">
        <div class="container-xl">
            <div class="row g-2 align-items-center">
                <div class="col">
                    <h2 class="page-title">Categories</h2>
                </div>
            </div>
        </div>
    </div>
    <div class="page-body">
    <div class="container-xl">
        <div v-if="deleteError" class="alert alert-danger">{{ deleteError }}</div>

        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title">Afegeix una categoria</h3>
            </div>
            <div class="card-body">
                <form class="row g-2 align-items-start" @submit.prevent="submitCreateCategory">
                    <div class="col-12 col-md-6">
                        <input
                            v-model="createCategoryForm.name"
                            type="text"
                            class="form-control form-control-lg"
                            placeholder="Nom de la categoria"
                        >
                        <div v-if="createCategoryForm.errors.name" class="text-danger small mt-1">
                            {{ createCategoryForm.errors.name }}
                        </div>
                    </div>
                    <div class="col-12 col-md-auto">
                        <button type="submit" class="btn btn-primary btn-lg" :disabled="createCategoryForm.processing">
                            Afegeix
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title">Afegeix una subcategoria</h3>
            </div>
            <div class="card-body">
                <form class="row g-2 align-items-start" @submit.prevent="submitCreateSubcategory">
                    <div class="col-12 col-md-4">
                        <select v-model="createSubcategoryForm.category_id" class="form-select form-select-lg">
                            <option value="" disabled>Selecciona categoria</option>
                            <option v-for="category in categoriesList" :key="category.id" :value="category.id">
                                {{ category.name }}
                            </option>
                        </select>
                        <div v-if="createSubcategoryForm.errors.category_id" class="text-danger small mt-1">
                            {{ createSubcategoryForm.errors.category_id }}
                        </div>
                    </div>
                    <div class="col-12 col-md-3">
                        <input
                            v-model="createSubcategoryForm.name"
                            type="text"
                            class="form-control form-control-lg"
                            placeholder="Nom de la subcategoria"
                        >
                        <div v-if="createSubcategoryForm.errors.name" class="text-danger small mt-1">
                            {{ createSubcategoryForm.errors.name }}
                        </div>
                    </div>
                    <div class="col-12 col-md-3">
                        <select v-model="createSubcategoryForm.bank_id" class="form-select form-select-lg">
                            <option value="">Cap banc</option>
                            <option v-for="bank in banksList" :key="bank.id" :value="bank.id">
                                {{ bank.name }}
                            </option>
                        </select>
                        <div v-if="createSubcategoryForm.errors.bank_id" class="text-danger small mt-1">
                            {{ createSubcategoryForm.errors.bank_id }}
                        </div>
                    </div>
                    <div class="col-12 col-md-auto">
                        <button
                            type="submit"
                            class="btn btn-primary btn-lg"
                            :disabled="createSubcategoryForm.processing"
                        >
                            Afegeix
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div v-if="categoriesList.length === 0" class="text-center text-muted py-5">
            Encara no hi ha categories.
        </div>

        <div v-else class="list-group">
            <div v-for="category in categoriesList" :key="category.id" class="list-group-item">
                <div v-if="editingCategoryId === category.id" class="d-flex flex-wrap gap-2 align-items-start py-1">
                    <input
                        v-model="editingCategoryForm.name"
                        type="text"
                        class="form-control form-control-lg"
                        style="flex: 1 1 200px;"
                    >
                    <div class="d-flex gap-2 flex-shrink-0">
                        <button
                            type="button"
                            class="btn btn-primary"
                            :disabled="editingCategoryForm.processing"
                            @click="submitEditCategory(category)"
                        >
                            Desa
                        </button>
                        <button type="button" class="btn btn-outline-secondary" @click="cancelEditCategory">
                            Cancel·la
                        </button>
                    </div>
                </div>
                <div v-else class="d-flex justify-content-between align-items-center">
                    <span class="fw-semibold">{{ category.name }}</span>
                    <div class="d-flex gap-2">
                        <button
                            type="button"
                            class="btn btn-outline-secondary"
                            aria-label="Edita categoria"
                            @click="startEditCategory(category)"
                        >
                            <IconPencil :size="20" />
                        </button>
                        <button
                            type="button"
                            class="btn btn-outline-danger"
                            aria-label="Elimina categoria"
                            @click="destroyCategory(category)"
                        >
                            <IconTrash :size="20" />
                        </button>
                    </div>
                </div>

                <ul class="list-unstyled ms-3 mt-2 mb-0">
                    <li
                        v-for="subcategory in category.subcategories"
                        :key="subcategory.id"
                        class="py-1 border-top"
                    >
                        <div
                            v-if="editingSubcategoryId === subcategory.id"
                            class="d-flex flex-wrap gap-2 align-items-start py-1"
                        >
                            <input
                                v-model="editingSubcategoryForm.name"
                                type="text"
                                class="form-control"
                                style="flex: 1 1 160px;"
                            >
                            <select
                                v-model="editingSubcategoryForm.bank_id"
                                class="form-select"
                                style="flex: 1 1 140px;"
                            >
                                <option value="">Cap banc</option>
                                <option v-for="bank in banksList" :key="bank.id" :value="bank.id">
                                    {{ bank.name }}
                                </option>
                            </select>
                            <div class="d-flex gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    class="btn btn-primary"
                                    :disabled="editingSubcategoryForm.processing"
                                    @click="submitEditSubcategory(subcategory)"
                                >
                                    Desa
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-outline-secondary"
                                    @click="cancelEditSubcategory"
                                >
                                    Cancel·la
                                </button>
                            </div>
                        </div>
                        <div v-else class="d-flex justify-content-between align-items-center flex-wrap gap-2">
                            <span class="text-muted d-flex align-items-center gap-2">
                                {{ subcategory.name }}
                                <span v-if="bankName(subcategory.bank_id)" class="badge bg-blue-lt">
                                    {{ bankName(subcategory.bank_id) }}
                                </span>
                            </span>
                            <div class="d-flex gap-2">
                                <button
                                    type="button"
                                    class="btn btn-outline-secondary"
                                    aria-label="Edita subcategoria"
                                    @click="startEditSubcategory(subcategory)"
                                >
                                    <IconPencil :size="18" />
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-outline-danger"
                                    aria-label="Elimina subcategoria"
                                    @click="destroySubcategory(subcategory)"
                                >
                                    <IconTrash :size="18" />
                                </button>
                            </div>
                        </div>
                    </li>
                    <li v-if="category.subcategories.length === 0" class="text-muted small py-1">
                        Sense subcategories
                    </li>
                </ul>
            </div>
        </div>
    </div>
    </div>
    </AppLayout>
</template>
