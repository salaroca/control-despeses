import { mount } from '@vue/test-utils';
import { describe, expect, test } from 'vitest';
import Welcome from '../Pages/Welcome.vue';

describe('Welcome', () => {
    test('renders the app title', () => {
        const wrapper = mount(Welcome);

        expect(wrapper.text()).toContain('Control de despeses');
    });
});
