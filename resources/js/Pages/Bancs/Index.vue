<script setup>
import { computed, ref } from 'vue';
import { router, useForm, usePage } from '@inertiajs/vue3';
import { IconPencil, IconTrash } from '@tabler/icons-vue';
import AppLayout from '../../Layouts/AppLayout.vue';

const page = usePage();
const banksList = computed(() => page.props.banksList);

const createForm = useForm({ name: '' });

function submitCreate() {
    createForm.post('/bancs', {
        preserveScroll: true,
        onSuccess: () => createForm.reset(),
    });
}

const editingId = ref(null);
const editForm = ref(null);

function startEdit(bank) {
    editingId.value = bank.id;
    editForm.value = useForm({ name: bank.name });
}

function cancelEdit() {
    editingId.value = null;
    editForm.value = null;
}

function submitEdit(bank) {
    editForm.value.put(`/bancs/${bank.id}`, {
        preserveScroll: true,
        onSuccess: () => cancelEdit(),
    });
}

function destroyBank(bank) {
    if (!confirm(`Segur que vols eliminar el banc "${bank.name}"? Les despeses que en tenien deixaran d'estar assignades a cap banc.`)) {
        return;
    }

    router.delete(`/bancs/${bank.id}`, { preserveScroll: true });
}
</script>

<template>
    <AppLayout>
    <div class="page-header d-print-none">
        <div class="container-xl">
            <div class="row g-2 align-items-center">
                <div class="col">
                    <h2 class="page-title">Bancs</h2>
                </div>
            </div>
        </div>
    </div>
    <div class="page-body">
    <div class="container-xl">
        <div class="card mb-4">
            <div class="card-header">
                <h3 class="card-title">Afegeix un banc</h3>
            </div>
            <div class="card-body">
                <form class="row g-2 align-items-start" @submit.prevent="submitCreate">
                    <div class="col-12 col-md-6">
                        <input
                            v-model="createForm.name"
                            type="text"
                            class="form-control form-control-lg"
                            placeholder="Nom del banc"
                        >
                        <div v-if="createForm.errors.name" class="text-danger small mt-1">
                            {{ createForm.errors.name }}
                        </div>
                    </div>
                    <div class="col-12 col-md-auto">
                        <button type="submit" class="btn btn-primary btn-lg" :disabled="createForm.processing">
                            Afegeix
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div v-if="banksList.length === 0" class="text-center text-muted py-5">
            Encara no hi ha bancs registrats.
        </div>

        <ul v-else class="list-group">
            <li v-for="bank in banksList" :key="bank.id" class="list-group-item">
                <div v-if="editingId === bank.id" class="d-flex gap-2 align-items-start py-1">
                    <input v-model="editForm.name" type="text" class="form-control form-control-lg">
                    <button
                        type="button"
                        class="btn btn-primary"
                        :disabled="editForm.processing"
                        @click="submitEdit(bank)"
                    >
                        Desa
                    </button>
                    <button type="button" class="btn btn-outline-secondary" @click="cancelEdit">
                        Cancel·la
                    </button>
                </div>
                <div v-else class="d-flex justify-content-between align-items-center">
                    <span class="fw-semibold">{{ bank.name }}</span>
                    <div class="d-flex gap-2">
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            aria-label="Edita banc"
                            @click="startEdit(bank)"
                        >
                            <IconPencil :size="16" />
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            aria-label="Elimina banc"
                            @click="destroyBank(bank)"
                        >
                            <IconTrash :size="16" />
                        </button>
                    </div>
                </div>
            </li>
        </ul>
    </div>
    </div>
    </AppLayout>
</template>
