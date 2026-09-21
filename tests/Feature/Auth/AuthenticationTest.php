<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('the login page renders for a guest', function () {
    $response = $this->get('/login');

    $response->assertInertia(fn ($page) => $page->component('Auth/Login'));
});

test('a user can log in with the correct credentials', function () {
    $user = User::factory()->create(['password' => Hash::make('contrasenya-secreta')]);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'contrasenya-secreta',
    ]);

    $response->assertRedirect('/despeses');
    $this->assertAuthenticatedAs($user);
});

test('a user cannot log in with an incorrect password', function () {
    $user = User::factory()->create(['password' => Hash::make('contrasenya-secreta')]);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'contrasenya-incorrecta',
    ]);

    $response->assertSessionHasErrors('email');
    $this->assertGuest();
});

test('a logged in user can log out', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/logout');

    $response->assertRedirect('/login');
    $this->assertGuest();
});

test('a guest is redirected to the login page when visiting a protected page', function () {
    $response = $this->get('/despeses');

    $response->assertRedirect('/login');
});

test('an authenticated user is redirected away from the login page', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->get('/login');

    $response->assertRedirect('/');
});
