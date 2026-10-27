import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { environment } from 'src/environments/environment';
import { AuthService } from '../services/auth.service';
import { InstitutionContextService } from '../services/institution-context.service';

/**
 * Agrega el {@code institutionId} seleccionado a las peticiones de un
 * PLATFORM_ADMIN. Es solo comodidad de navegación: el backend sigue validando
 * permisos e institución.
 */
export const institutionContextInterceptor: HttpInterceptorFn = (request, next) => {
    const auth = inject(AuthService);
    const context = inject(InstitutionContextService);

    const institutionId = context.currentInstitutionId();
    if (!institutionId || !auth.isAuthenticated()) {
        return next(request);
    }

    const isApiRequest = request.url.startsWith(environment.apiUrl);
    const isAuthRequest = request.url.includes('/auth');
    const isInstitutionAdminRequest = request.url.includes('/institutions');
    if (!isApiRequest || isAuthRequest || isInstitutionAdminRequest) {
        return next(request);
    }

    return next(request.clone({ setParams: { institutionId } }));
};
