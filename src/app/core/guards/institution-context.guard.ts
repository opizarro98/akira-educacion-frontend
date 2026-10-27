import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';
import { InstitutionContextService } from '../services/institution-context.service';

/**
 * Evita que un PLATFORM_ADMIN opere sin institución seleccionada. La lista de
 * instituciones es la única pantalla que no requiere contexto.
 */
export const institutionContextGuard: CanActivateFn = async (route, state) => {
    const auth = inject(AuthService);
    const context = inject(InstitutionContextService);
    const router = inject(Router);

    if (!auth.isAuthenticated() || !auth.isPlatformAdmin()) {
        return true;
    }
    await context.ensureInitialized();
    if (context.hasSelection() || state.url.startsWith('/platform/institutions')) {
        return true;
    }
    return router.createUrlTree(['/platform/institutions'], {
        queryParams: { requiresInstitution: 'true' }
    });
};
