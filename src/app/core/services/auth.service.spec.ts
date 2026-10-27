import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { errorInterceptor } from '../interceptors/error.interceptor';
import { LoginResponse, UserProfile } from '../models/auth.models';

const profile: UserProfile = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'admin@test.local',
    fullName: 'Administrador',
    institutionId: '22222222-2222-2222-2222-222222222222',
    institutionName: 'Colegio de prueba',
    roles: ['INSTITUTION_ADMIN'],
    permissions: ['USER_READ', 'USER_WRITE'],
    platformAdmin: false
};

const loginResponse: LoginResponse = {
    accessToken: 'token-123',
    tokenType: 'Bearer',
    expiresAt: '2026-12-31T00:00:00Z',
    user: profile
};

describe('AuthService', () => {
    let service: AuthService;
    let http: HttpTestingController;

    beforeEach(() => {
        localStorage.clear();
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                provideHttpClient(withInterceptors([errorInterceptor])),
                provideHttpClientTesting()
            ]
        });
        service = TestBed.inject(AuthService);
        http = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        http.verify();
        localStorage.clear();
    });

    it('inicia sesión y conserva token y perfil', () => {
        let received: UserProfile | undefined;
        service.login('admin@test.local', 'Secreta123!').subscribe((user) => (received = user));

        const request = http.expectOne(`${environment.apiUrl}/auth/login`);
        expect(request.request.method).toBe('POST');
        expect(request.request.body).toEqual({ email: 'admin@test.local', password: 'Secreta123!' });
        request.flush(loginResponse);

        expect(received?.email).toBe('admin@test.local');
        expect(service.token()).toBe('token-123');
        expect(service.isAuthenticated()).toBe(true);
        expect(localStorage.getItem('akira.token')).toBe('token-123');
    });

    it('expone permisos y roles del perfil', () => {
        service.login('admin@test.local', 'Secreta123!').subscribe();
        http.expectOne(`${environment.apiUrl}/auth/login`).flush(loginResponse);

        expect(service.hasPermission('USER_WRITE')).toBe(true);
        expect(service.hasPermission('EXPENSE_VOID')).toBe(false);
        expect(service.hasRole('INSTITUTION_ADMIN')).toBe(true);
        expect(service.isPlatformAdmin()).toBe(false);
    });

    it('restaura la sesión guardada y la limpia al cerrar sesión', () => {
        localStorage.setItem('akira.token', 'token-123');
        localStorage.setItem('akira.user', JSON.stringify(profile));

        TestBed.resetTestingModule();
        TestBed.configureTestingModule({
            providers: [
                provideRouter([]),
                provideHttpClient(withInterceptors([errorInterceptor])),
                provideHttpClientTesting()
            ]
        });
        http = TestBed.inject(HttpTestingController);

        const restored = TestBed.inject(AuthService);
        expect(restored.isAuthenticated()).toBe(true);

        restored.clearSession();
        expect(restored.token()).toBeNull();
        expect(localStorage.getItem('akira.token')).toBeNull();
    });

    it('expone un mensaje de error cuando el backend rechaza las credenciales', () => {
        let message = '';
        service.login('admin@test.local', 'incorrecta').subscribe({
            error: (error: Error) => (message = error.message)
        });
        http.expectOne(`${environment.apiUrl}/auth/login`).flush(
            { detail: 'El correo o la contraseña no son correctos.' },
            { status: 400, statusText: 'Bad Request' }
        );

        expect(message).toContain('El correo o la contraseña');
    });
});
