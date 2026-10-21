import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from '../services/auth.service';

interface ProblemDetail {
    title?: string;
    detail?: string;
    code?: string;
    errors?: Record<string, string>;
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return next(request).pipe(
        catchError((error: unknown) => {
            if (error instanceof HttpErrorResponse) {
                if (error.status === 401 && !request.url.endsWith('/auth/login')) {
                    auth.clearSession();
                    void router.navigate(['/login']);
                }
                return throwError(() => new Error(problemMessage(error)));
            }
            return throwError(() => error);
        })
    );
};

function problemMessage(error: HttpErrorResponse): string {
    const problem = error.error as ProblemDetail | null;
    if (problem?.errors && Object.keys(problem.errors).length > 0) {
        return Object.values(problem.errors).join(' ');
    }
    if (problem?.detail) {
        return problem.detail;
    }
    if (error.status === 0) {
        return 'No se pudo conectar con el servidor. Verifique que el backend esté en ejecución.';
    }
    if (error.status === 403) {
        return 'No tiene permisos para realizar esta operación.';
    }
    return `Ocurrió un error inesperado (${error.status}).`;
}
