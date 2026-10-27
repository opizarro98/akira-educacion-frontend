import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, provideRouter } from '@angular/router';

import { roleGuard } from './role.guard';
import { AuthService } from '../services/auth.service';

describe('roleGuard', () => {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/users' } as RouterStateSnapshot;

    function run(options: {
        authenticated?: boolean;
        roles?: string[];
        platformAdmin?: boolean;
    }) {
        const roles = options.roles ?? [];
        const auth = {
            isAuthenticated: () => options.authenticated ?? true,
            hasAnyRole: (expected: string[]) =>
                expected.length === 0 || expected.some((role) => roles.includes(role)),
            isPlatformAdmin: () => options.platformAdmin ?? false,
            homeRoute: () => '/dashboard'
        };
        TestBed.configureTestingModule({
            providers: [
                provideRouter([{ path: 'dashboard', children: [] }]),
                { provide: AuthService, useValue: auth }
            ]
        });
        return TestBed.runInInjectionContext(() => roleGuard(['INSTITUTION_ADMIN'])(route, state));
    }

    it('permite el acceso cuando el rol coincide', () => {
        expect(run({ roles: ['INSTITUTION_ADMIN'] })).toBe(true);
    });

    it('redirige cuando el usuario no tiene el rol requerido', () => {
        const result = run({ roles: ['DIRECTOR'] });
        expect(result?.toString()).toContain('/dashboard');
    });

    it('permite el acceso a PLATFORM_ADMIN por su alcance global', () => {
        expect(run({ roles: ['PLATFORM_ADMIN'], platformAdmin: true })).toBe(true);
    });

    it('redirige al login cuando no hay sesión', () => {
        const result = run({ authenticated: false });
        expect(result?.toString()).toContain('/login');
    });
});
