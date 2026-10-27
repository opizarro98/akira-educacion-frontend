import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, provideRouter } from '@angular/router';

import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/students' } as RouterStateSnapshot;

    function setup(authenticated: boolean) {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([{ path: 'login', children: [] }]),
                { provide: AuthService, useValue: { isAuthenticated: () => authenticated } }
            ]
        });
        return TestBed.runInInjectionContext(() => authGuard(route, state));
    }

    it('permite el acceso con sesión iniciada', () => {
        expect(setup(true)).toBe(true);
    });

    it('redirige al login conservando la url solicitada', () => {
        const result = setup(false);
        expect(typeof result).not.toBe('boolean');
        expect(result?.toString()).toContain('/login');
        expect(result?.toString()).toContain('returnUrl');
    });
});
