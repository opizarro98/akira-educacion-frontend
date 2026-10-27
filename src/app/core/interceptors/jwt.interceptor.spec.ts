import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { environment } from 'src/environments/environment';
import { jwtInterceptor } from './jwt.interceptor';
import { AuthService } from '../services/auth.service';

describe('jwtInterceptor', () => {
    let http: HttpClient;
    let controller: HttpTestingController;

    function setup(token: string | null) {
        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: { token: () => token } },
                provideHttpClient(withInterceptors([jwtInterceptor])),
                provideHttpClientTesting()
            ]
        });
        http = TestBed.inject(HttpClient);
        controller = TestBed.inject(HttpTestingController);
    }

    afterEach(() => controller.verify());

    it('agrega el encabezado Authorization a las peticiones autenticadas', () => {
        setup('token-abc');
        http.get(`${environment.apiUrl}/students`).subscribe();
        const request = controller.expectOne(`${environment.apiUrl}/students`);
        expect(request.request.headers.get('Authorization')).toBe('Bearer token-abc');
        request.flush({});
    });

    it('no agrega el encabezado al login', () => {
        setup('token-abc');
        http.post(`${environment.apiUrl}/auth/login`, {}).subscribe();
        const request = controller.expectOne(`${environment.apiUrl}/auth/login`);
        expect(request.request.headers.has('Authorization')).toBe(false);
        request.flush({});
    });

    it('no agrega el encabezado si no hay sesión', () => {
        setup(null);
        http.get(`${environment.apiUrl}/students`).subscribe();
        const request = controller.expectOne(`${environment.apiUrl}/students`);
        expect(request.request.headers.has('Authorization')).toBe(false);
        request.flush({});
    });
});
