import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';

import { Institution, PageResponse, UserProfile } from '../models/auth.models';
import { AuthService } from './auth.service';
import { InstitutionApiService } from './institution-api.service';
import { InstitutionContextService } from './institution-context.service';

const STORAGE_KEY = 'akira.institution.context';

function institution(id: string, legalName: string, active = true): Institution {
    return {
        id,
        legalName,
        tradeName: legalName,
        taxId: null,
        email: null,
        phone: null,
        website: null,
        address: null,
        city: null,
        country: 'Ecuador',
        timezone: 'America/Guayaquil',
        language: 'es',
        currency: 'USD',
        logoUrl: null,
        primaryColor: null,
        secondaryColor: null,
        vatEnabled: false,
        vatRate: null,
        vatEffectiveFrom: null,
        active,
        modules: [],
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
    };
}

const institutionA = institution('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Colegio A');
const institutionB = institution('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Colegio B');
const inactive = institution('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Colegio Inactivo', false);

function page(content: Institution[]): PageResponse<Institution> {
    return {
        content,
        page: 0,
        size: 100,
        totalElements: content.length,
        totalPages: 1
    };
}

const platformProfile: UserProfile = {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'platform@test.local',
    fullName: 'Administrador de plataforma',
    institutionId: null,
    institutionName: null,
    roles: ['PLATFORM_ADMIN'],
    permissions: ['PLATFORM_INSTITUTION_MANAGE'],
    platformAdmin: true
};

describe('InstitutionContextService', () => {
    function setup(platformAdmin: boolean, content: Institution[] = []) {
        const userSignal = signal<UserProfile | null>(platformAdmin ? platformProfile : null);
        const list = vi.fn(() => of(page(content)));

        TestBed.configureTestingModule({
            providers: [
                {
                    provide: AuthService,
                    useValue: {
                        user: userSignal.asReadonly(),
                        isPlatformAdmin: () => platformAdmin
                    }
                },
                { provide: InstitutionApiService, useValue: { list } }
            ]
        });

        return { service: TestBed.inject(InstitutionContextService), list };
    }

    beforeEach(() => sessionStorage.clear());
    afterEach(() => sessionStorage.clear());

    it('carga instituciones activas y restaura la selección de la sesión', async () => {
        sessionStorage.setItem(STORAGE_KEY, institutionB.id);
        const { service, list } = setup(true, [institutionA, institutionB, inactive]);

        await service.ensureInitialized();

        expect(list).toHaveBeenCalledTimes(1);
        expect(service.institutions().map((item) => item.id)).toEqual([institutionA.id, institutionB.id]);
        expect(service.selected()?.id).toBe(institutionB.id);
        expect(service.hasSelection()).toBe(true);
        expect(service.currentInstitutionId()).toBe(institutionB.id);
    });

    it('ignora una selección guardada que ya no existe', async () => {
        sessionStorage.setItem(STORAGE_KEY, 'no-existe');
        const { service } = setup(true, [institutionA]);

        await service.ensureInitialized();

        expect(service.selected()).toBeNull();
        expect(service.hasSelection()).toBe(false);
    });

    it('persiste y limpia la selección durante la sesión', async () => {
        const { service } = setup(true, [institutionA, institutionB]);
        await service.ensureInitialized();

        service.select(institutionA);
        expect(sessionStorage.getItem(STORAGE_KEY)).toBe(institutionA.id);

        service.clear();
        expect(service.selected()).toBeNull();
        expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull();

        service.selectById(institutionB.id);
        expect(service.selected()?.legalName).toBe('Colegio B');
    });

    it('no aplica contexto para usuarios institucionales', async () => {
        const { service, list } = setup(false, [institutionA]);

        await service.ensureInitialized();

        expect(list).not.toHaveBeenCalled();
        expect(service.requiresSelection()).toBe(false);
        expect(service.hasSelection()).toBe(true);
        service.select(institutionA);
        expect(service.selected()).toBeNull();
        expect(service.currentInstitutionId()).toBeNull();
    });
});
