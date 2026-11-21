<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->validated('email'))->first();

        if (! $user || ! $user->is_admin || ! Hash::check($request->validated('password'), $user->password)) {
            return ApiResponse::error('Email atau password salah', 'INVALID_CREDENTIALS', 401);
        }

        return ApiResponse::success([
            'token' => $user->createToken('admin')->plainTextToken,
            'user'  => ['id' => $user->id, 'name' => $user->name, 'email' => $user->email],
        ], 'Login berhasil');
    }

    public function me(Request $request)
    {
        $user = $request->user();

        return ApiResponse::success(['id' => $user->id, 'name' => $user->name, 'email' => $user->email]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return ApiResponse::success(null, 'Logout berhasil');
    }
}