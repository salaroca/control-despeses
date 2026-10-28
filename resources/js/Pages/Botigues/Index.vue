<script setup>
import { ref } from 'vue';
import { router, useForm } from '@inertiajs/vue3';
import { IconPencil, IconTrash } from '@tabler/icons-vue';
import AppLayout from '../../Layouts/AppLayout.vue';
import PricesTabs from '../../Components/PricesTabs.vue';

defineProps({
    shopsList: { type: Array, required: true },
});

const createForm = useForm({ name: '' });

function submitCreate() {
    createForm.post('/botigues', {
        preserveScroll: true,
        onSuccess: () => createForm.reset(),
    });
}

const editingId = ref(null);
const editForm = ref(null);

function startEdit(shop) {
    editingId.value = shop.id;
    editForm.value = useForm({ name: shop.name });
}

function cancelEdit() {
    editingId.value = null;
    editForm.value = null;
}

function submitEdit(shop) {
    editForm.value.put(`/botigues/${shop.id}`, {
        preserveScroll: true,
        onSuccess: () => cancelEdit(),
    });
}

function destroyShop(shop) {
    const pricesWarning = shop.prices_count > 0
        ? ` També s'esborraran els seus ${shop.prices_count} preus apuntats.`
        : '';

    if (!confirm(`Segur que vols eliminar la botiga "${shop.name}"?${pricesWarning}`)) {
        return;
    }

    router.delete(`/botigues/${shop.id}`, { preserveScroll: true });
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
                <h3 class="card-title">Afegeix una botiga</h3>
            </div>
            <div class="card-body">
                <form class="row g-2 align-items-start" @submit.prevent="submitCreate">
                    <div class="col-12 col-md-6">
                        <input
                            v-model="createForm.name"
                            type="text"
                            class="form-control form-control-lg"
                            placeholder="Nom de la botiga (p. ex. Bon Preu)"
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

        <div v-if="shopsList.length === 0" class="text-center text-muted py-5">
            Encara no hi ha botigues registrades.
        </div>

        <ul v-else class="list-group">
            <li v-for="shop in shopsList" :key="shop.id" class="list-group-item">
                <div v-if="editingId === shop.id" class="d-flex gap-2 align-items-start py-1">
                    <div class="flex-grow-1">
                        <input v-model="editForm.name" type="text" class="form-control form-control-lg">
                        <div v-if="editForm.errors.name" class="text-danger small mt-1">
                            {{ editForm.errors.name }}
                        </div>
                    </div>
                    <button
                        type="button"
                        class="btn btn-primary"
                        :disabled="editForm.processing"
                        @click="submitEdit(shop)"
                    >
                        Desa
                    </button>
                    <button type="button" class="btn btn-outline-secondary" @click="cancelEdit">
                        Cancel·la
                    </button>
                </div>
                <div v-else class="d-flex justify-content-between align-items-center">
                    <span class="fw-semibold">{{ shop.name }}</span>
                    <div class="d-flex gap-2">
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-secondary"
                            aria-label="Edita botiga"
                            @click="startEdit(shop)"
                        >
                            <IconPencil :size="16" />
                        </button>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-danger"
                            aria-label="Elimina botiga"
                            @click="destroyShop(shop)"
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
