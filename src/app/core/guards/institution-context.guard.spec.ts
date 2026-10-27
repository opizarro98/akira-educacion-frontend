import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, provideRouter } from '@angular/router';

import { institutionContextGuard } from './institution-context.guard';
import { AuthService } from '../services/auth.service';
import { InstitutionContextService } from '../services/institution-context.service';

describe('institutionContextGuard', () => {
    const route = {} as ActivatedRouteSnapshot;

    function run(options: {
        platformAdmin: boolean;
        hasSelection: boolean;
        url: string;
    }) {
        TestBed.configureTestingModule({
            providers: [
                provideRouter([{ path: 'platform/institutions', children: [] }]),
                { provide: AuthService, useValue: { isAuthenticated: () => true, isPlatformAdmin: () => options.platformAdmin } },
                {
                    provide: InstitutionContextService,
                    useValue: {
                        ensureInitialized: () => Promise.resolve(),
                        hasSelection: () => options.hasSelection
                    }
                }
            ]
        });
        const state = { url: options.url } as RouterStateSnapshot;
        return TestBed.runInInjectionContext(() => institutionContextGuard(route, state));
    }

    it('permite operar a un usuario institucional', async () => {
        await expect(run({ platformAdmin: false, hasSelection: false, url: '/students' })).resolves.toBe(true);
    });

    it('permite al PLATFORM_ADMIN con institución seleccionada', async () => {
        await expect(run({ platformAdmin: true, hasSelection: true, url: '/students' })).resolves.toBe(true);
    });

    it('redirige al listado cuando falta la institución', async () => {
        const result = await run({ platformAdmin: true, hasSelection: false, url: '/students' });
        expect(result?.toString()).toContain('/platform/institutions');
        expect(result?.toString()).toContain('requiresInstitution');
    });

    it('permite acceder al listado de instituciones sin selección', async () => {
        await expect(
            run({ platformAdmin: true, hasSelection: false, url: '/platform/institutions' })
        ).resolves.toBe(true);
    });
});
