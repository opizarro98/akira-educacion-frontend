import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';

import { environment } from 'src/environments/environment';
import { LoginResponse, UserProfile } from '../models/auth.models';

const TOKEN_KEY = 'akira.token';
const USER_KEY = 'akira.user';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private readonly http = inject(HttpClient);
    private readonly router = inject(Router);

    private readonly tokenSignal = signal<string | null>(null);
    private readonly userSignal = signal<UserProfile | null>(null);

    readonly token = this.tokenSignal.asReadonly();
    readonly user = this.userSignal.asReadonly();
    readonly isAuthenticated = computed(() => this.tokenSignal() !== null);
    readonly roles = computed(() => this.userSignal()?.roles ?? []);

    constructor() {
        this.restoreSession();
    }

    login(email: string, password: string): Observable<UserProfile> {
        return this.http
            .post<LoginResponse>(`${environment.apiUrl}/auth/login`, { email, password })
            .pipe(
                tap((response) => {
                    this.tokenSignal.set(response.accessToken);
                    this.userSignal.set(response.user);
                    localStorage.setItem(TOKEN_KEY, response.accessToken);
                    localStorage.setItem(USER_KEY, JSON.stringify(response.user));
                }),
                map((response) => response.user)
            );
    }

    logout(): void {
        this.clearSession();
        void this.router.navigate(['/login']);
    }

    clearSession(): void {
        this.tokenSignal.set(null);
        this.userSignal.set(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
    }

    hasRole(role: string): boolean {
        return this.roles().includes(role);
    }

    hasAnyRole(roles: string[]): boolean {
        return roles.length === 0 || roles.some((role) => this.hasRole(role));
    }

    isPlatformAdmin(): boolean {
        return this.hasRole('PLATFORM_ADMIN');
    }

    homeRoute(): string {
        if (this.isPlatformAdmin()) {
            return '/platform/institutions';
        }
        return '/dashboard';
    }

    roleLabel(): string {
        const roles = this.roles();
        if (roles.includes('PLATFORM_ADMIN')) {
            return 'Administrador de plataforma';
        }
        if (roles.includes('INSTITUTION_ADMIN')) {
            return 'Administrador institucional';
        }
        if (roles.includes('SECRETARY')) {
            return 'Secretaría';
        }
        if (roles.includes('TREASURY')) {
            return 'Tesorería';
        }
        if (roles.includes('DIRECTOR')) {
            return 'Dirección';
        }
        return 'Usuario';
    }

    private restoreSession(): void {
        const token = localStorage.getItem(TOKEN_KEY);
        const user = localStorage.getItem(USER_KEY);
        if (!token || !user) {
            return;
        }
        try {
            this.tokenSignal.set(token);
            this.userSignal.set(JSON.parse(user) as UserProfile);
        } catch {
            this.clearSession();
        }
    }
}
