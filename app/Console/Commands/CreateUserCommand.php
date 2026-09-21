<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateUserCommand extends Command
{
    /**
     * @var string
     */
    protected $signature = 'app:create-user {name} {email}';

    /**
     * @var string
     */
    protected $description = "Crea un usuari per iniciar sessió a l'aplicació (la contrasenya es demana de forma oculta)";

    public function handle(): int
    {
        $name = $this->argument('name');
        $email = $this->argument('email');

        $validator = Validator::make(
            ['name' => $name, 'email' => $email],
            [
                'name' => ['required', 'string', 'max:255'],
                'email' => ['required', 'email', 'unique:users,email'],
            ],
        );

        if ($validator->fails()) {
            $this->error($validator->errors()->first());

            return self::FAILURE;
        }

        $password = $this->secret('Contrasenya (no es mostrarà en pantalla)');
        $confirmation = $this->secret('Repeteix la contrasenya');

        if ($password !== $confirmation) {
            $this->error('Les contrasenyes no coincideixen.');

            return self::FAILURE;
        }

        if (strlen($password) < 8) {
            $this->error('La contrasenya ha de tenir com a mínim 8 caràcters.');

            return self::FAILURE;
        }

        User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
        ]);

        $this->info("Usuari {$email} creat correctament.");

        return self::SUCCESS;
    }
}
