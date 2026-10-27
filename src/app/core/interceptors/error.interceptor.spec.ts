import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { environment } from 'src/environments/environment';
import { errorInterceptor } from './error.interceptor';
import { AuthService } from '../services/auth.service';

describe('errorInterceptor', () => {
    let http: HttpClient;
    let controller: HttpTestingController;
    const auth = { clearSession: vi.fn() };
    const router = { navigate: vi.fn() };

    beforeEach(() => {
        auth.clearSession.mockReset();
        router.navigate.mockReset();
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: auth },
                { provide: Router, useValue: router },
                provideHttpClient(withInterceptors([errorInterceptor])),
                provideHttpClientTesting()
            ]
        });
        http = TestBed.inject(HttpClient);
        controller = TestBed.inject(HttpTestingController);
    });

    afterEach(() => controller.verify());

    it('usa el detalle del ProblemDetail', () => {
        let message = '';
        http.get(`${environment.apiUrl}/students`).subscribe({
            error: (error: Error) => (message = error.message)
        });
        controller
            .expectOne(`${environment.apiUrl}/students`)
            .flush(
                { title: 'Petición inválida', detail: 'El archivo supera el tamaño permitido.' },
                { status: 400, statusText: 'Bad Request' }
            );

        expect(message).toBe('El archivo supera el tamaño permitido.');
    });

    it('prioriza los errores de validación por campo', () => {
        let message = '';
        http.get(`${environment.apiUrl}/students`).subscribe({
            error: (error: Error) => (message = error.message)
        });
        controller
            .expectOne(`${environment.apiUrl}/students`)
            .flush(
                { errors: { email: 'Correo inválido', fullName: 'Nombre obligatorio' } },
                { status: 400, statusText: 'Bad Request' }
            );

        expect(message).toContain('Correo inválido');
        expect(message).toContain('Nombre obligatorio');
    });

    it('cierra la sesión y redirige al login ante un 401', () => {
        let message = '';
        http.get(`${environment.apiUrl}/students`).subscribe({
            error: (error: Error) => (message = error.message)
        });
        controller
            .expectOne(`${environment.apiUrl}/students`)
            .flush({}, { status: 401, statusText: 'Unauthorized' });

        expect(auth.clearSession).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/login']);
        expect(message).toBeTruthy();
    });

    it('informa falta de permisos en un 403', () => {
        let message = '';
        http.get(`${environment.apiUrl}/students`).subscribe({
            error: (error: Error) => (message = error.message)
        });
        controller
            .expectOne(`${environment.apiUrl}/students`)
            .flush({}, { status: 403, statusText: 'Forbidden' });

        expect(message).toContain('permisos');
    });
});
