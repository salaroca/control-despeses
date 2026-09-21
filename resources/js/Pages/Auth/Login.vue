<script setup>
import { useForm } from '@inertiajs/vue3';
import { IconWallet } from '@tabler/icons-vue';

const form = useForm({
    email: '',
    password: '',
});

function submit() {
    form.post('/login', {
        onFinish: () => form.reset('password'),
    });
}
</script>

<template>
    <div class="page page-center">
        <div class="container container-tight py-4">
            <div class="text-center mb-4">
                <div class="d-inline-flex align-items-center gap-2 text-primary">
                    <IconWallet :size="32" />
                    <span class="h2 mb-0">Control de despeses</span>
                </div>
            </div>
            <div class="card card-md">
                <div class="card-body">
                    <h2 class="h2 text-center mb-4">Inicia sessió</h2>
                    <form @submit.prevent="submit">
                        <div class="mb-3">
                            <label class="form-label">Correu electrònic</label>
                            <input
                                v-model="form.email"
                                type="email"
                                class="form-control"
                                autofocus
                                autocomplete="email"
                            >
                            <div v-if="form.errors.email" class="text-danger small mt-1">
                                {{ form.errors.email }}
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Contrasenya</label>
                            <input
                                v-model="form.password"
                                type="password"
                                class="form-control"
                                autocomplete="current-password"
                            >
                            <div v-if="form.errors.password" class="text-danger small mt-1">
                                {{ form.errors.password }}
                            </div>
                        </div>
                        <div class="form-footer">
                            <button type="submit" class="btn btn-primary w-100" :disabled="form.processing">
                                Inicia sessió
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
