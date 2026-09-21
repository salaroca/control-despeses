<script setup>
import { computed } from 'vue';

const props = defineProps({
    form: { type: Object, required: true },
    categoriesList: { type: Array, required: true },
    banksList: { type: Array, required: true },
    submitLabel: { type: String, default: 'Afegeix' },
    showCancel: { type: Boolean, default: false },
});

const emit = defineEmits(['submit', 'cancel']);

const subcategoryOptions = computed(() => {
    const category = props.categoriesList.find((item) => item.id === Number(props.form.category_id));

    return category ? category.subcategories : [];
});

function onCategoryChange() {
    props.form.subcategory_id = '';
}
</script>

<template>
    <form class="row g-2 align-items-start" @submit.prevent="emit('submit')">
        <div class="col-12 col-md-2">
            <label class="form-label">Categoria</label>
            <select
                v-model="form.category_id"
                class="form-select form-select-lg"
                @change="onCategoryChange"
            >
                <option value="" disabled>Selecciona categoria</option>
                <option v-for="category in categoriesList" :key="category.id" :value="category.id">
                    {{ category.name }}
                </option>
            </select>
        </div>

        <div class="col-12 col-md-2">
            <label class="form-label">Subcategoria</label>
            <select
                v-model="form.subcategory_id"
                class="form-select form-select-lg"
                :disabled="!form.category_id"
            >
                <option value="" disabled>Selecciona subcategoria</option>
                <option v-for="subcategory in subcategoryOptions" :key="subcategory.id" :value="subcategory.id">
                    {{ subcategory.name }}
                </option>
            </select>
            <div v-if="form.errors.subcategory_id" class="text-danger small mt-1">
                {{ form.errors.subcategory_id }}
            </div>
        </div>

        <div class="col-12 col-md-2">
            <label class="form-label">Banc</label>
            <select v-model="form.bank_id" class="form-select form-select-lg">
                <option value="">Cap</option>
                <option v-for="bank in banksList" :key="bank.id" :value="bank.id">
                    {{ bank.name }}
                </option>
            </select>
            <div v-if="form.errors.bank_id" class="text-danger small mt-1">{{ form.errors.bank_id }}</div>
        </div>

        <div class="col-6 col-md-2">
            <label class="form-label">Import (€)</label>
            <input
                v-model="form.amount"
                type="number"
                step="0.01"
                min="0.01"
                inputmode="decimal"
                class="form-control form-control-lg"
            >
            <div v-if="form.errors.amount" class="text-danger small mt-1">{{ form.errors.amount }}</div>
        </div>

        <div class="col-6 col-md-2">
            <label class="form-label">Data</label>
            <input v-model="form.date" type="date" class="form-control form-control-lg">
            <div v-if="form.errors.date" class="text-danger small mt-1">{{ form.errors.date }}</div>
        </div>

        <div class="col-12 col-md-2">
            <label class="form-label">Nota</label>
            <input
                v-model="form.note"
                type="text"
                maxlength="255"
                class="form-control form-control-lg"
                placeholder="Opcional"
            >
            <div v-if="form.errors.note" class="text-danger small mt-1">{{ form.errors.note }}</div>
        </div>

        <div class="col-12 d-flex gap-2 mt-2">
            <button type="submit" class="btn btn-primary btn-lg" :disabled="form.processing">
                {{ submitLabel }}
            </button>
            <button
                v-if="showCancel"
                type="button"
                class="btn btn-outline-secondary btn-lg"
                @click="emit('cancel')"
            >
                Cancel·la
            </button>
        </div>
    </form>
</template>
