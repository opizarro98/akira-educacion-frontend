import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/auth.service';

/**
 * Restringe una ruta a los roles indicados. El backend sigue validando los
 * permisos; este guard solo evita mostrar pantallas no autorizadas.
 */
export const roleGuard = (roles: string[]): CanActivateFn => {
    return () => {
        const auth = inject(AuthService);
        const router = inject(Router);

        if (!auth.isAuthenticated()) {
            return router.createUrlTree(['/login']);
        }
        if (auth.hasAnyRole(roles)) {
            return true;
        }
        return router.createUrlTree([auth.homeRoute()]);
    };
};
