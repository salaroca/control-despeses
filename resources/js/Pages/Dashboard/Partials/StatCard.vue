<script setup>
defineProps({
    label: { type: String, required: true },
    value: { type: String, required: true },
    variant: { type: String, default: null },
    icon: { type: [Object, Function], default: null },
});
</script>

<template>
    <div class="card">
        <div class="card-body">
            <div class="subheader">{{ label }}</div>
            <div
                class="h1 mb-0 d-flex align-items-center gap-2"
                :class="{ 'text-success': variant === 'good', 'text-danger': variant === 'critical' }"
            >
                <component :is="icon" v-if="icon" :size="22" />
                {{ value }}
            </div>
        </div>
    </div>
</template>
