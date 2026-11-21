<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = 'admin@minishop.test';

        $admin = User::where('email', $email)->first() ?? new User();
        $admin->email    = $email;
        $admin->name     = 'Admin MiniShop';
        $admin->password = Hash::make('admin12345');
        $admin->is_admin = true;
        $admin->save();
    }
}