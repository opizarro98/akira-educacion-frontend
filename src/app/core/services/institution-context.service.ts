import { computed, effect, inject, Injectable, signal } from '@angular/core';

import { Institution } from '../models/auth.models';
import { AuthService } from './auth.service';
import { InstitutionApiService } from './institution-api.service';

const STORAGE_KEY = 'akira.institution.context';

/**
 * Contexto de institución para PLATFORM_ADMIN.
 *
 * <p>
 * Es una ayuda de navegación, no un mecanismo de autorización: el backend
 * resuelve la institución desde el token o desde un {@code institutionId}
 * explícito y auditado. Un valor manipulado aquí solo producirá 403/404.
 *
 * <p>
 * La selección se guarda en {@code sessionStorage}: vive lo que dura la pestaña
 * y no se comparte entre sesiones.
 */
@Injectable({ providedIn: 'root' })
export class InstitutionContextService {
    private readonly auth = inject(AuthService);
    private readonly api = inject(InstitutionApiService);

    private readonly institutionsSignal = signal<Institution[]>([]);
    private readonly selectedSignal = signal<Institution | null>(null);
    private readonly loadingSignal = signal(false);
    private readonly errorSignal = signal('');
    private loadPromise: Promise<void> | null = null;

    readonly institutions = this.institutionsSignal.asReadonly();
    readonly selected = this.selectedSignal.asReadonly();
    readonly loading = this.loadingSignal.asReadonly();
    readonly error = this.errorSignal.asReadonly();

    readonly selectedId = computed(() => this.selectedSignal()?.id ?? null);
    readonly requiresSelection = computed(() => this.auth.isPlatformAdmin());
    readonly hasSelection = computed(() => !this.requiresSelection() || this.selectedSignal() !== null);

    constructor() {
        // Al cerrar sesión o cambiar a un usuario institucional se descarta el
        // contexto para no reutilizar una institución de otra sesión.
        effect(() => {
            const user = this.auth.user();
            if (!user || !user.platformAdmin) {
                this.reset();
            }
        });
    }

    init(): void {
        void this.ensureInitialized();
    }

    /**
     * Carga las instituciones una sola vez y restaura la selección de la
     * sesión. El guard lo espera antes de decidir si hay contexto.
     */
    ensureInitialized(): Promise<void> {
        if (!this.auth.isPlatformAdmin()) {
            return Promise.resolve();
        }
        if (this.loadPromise) {
            return this.loadPromise;
        }
        this.loadingSignal.set(true);
        this.loadPromise = new Promise<void>((resolve) => {
            this.api.list(null, 0, 100).subscribe({
                next: (response) => {
                    const active = response.content.filter((institution) => institution.active);
                    this.institutionsSignal.set(active);
                    const storedId = this.readStoredId();
                    this.selectedSignal.set(
                        active.find((institution) => institution.id === storedId) ?? null
                    );
                    this.loadingSignal.set(false);
                    resolve();
                },
                error: (error: Error) => {
                    this.errorSignal.set(error.message);
                    this.loadingSignal.set(false);
                    resolve();
                }
            });
        });
        return this.loadPromise;
    }

    select(institution: Institution | null): void {
        if (!this.auth.isPlatformAdmin()) {
            return;
        }
        this.selectedSignal.set(institution);
        if (institution) {
            sessionStorage.setItem(STORAGE_KEY, institution.id);
        } else {
            sessionStorage.removeItem(STORAGE_KEY);
        }
    }

    selectById(institutionId: string | null): void {
        if (!institutionId) {
            this.select(null);
            return;
        }
        const found = this.institutionsSignal().find((institution) => institution.id === institutionId) ?? null;
        this.select(found);
    }

    clear(): void {
        this.selectedSignal.set(null);
        sessionStorage.removeItem(STORAGE_KEY);
    }

    /**
     * Identificador que el interceptor agrega a las peticiones de la API.
     */
    currentInstitutionId(): string | null {
        return this.auth.isPlatformAdmin() ? this.selectedId() : null;
    }

    private reset(): void {
        this.clear();
        this.institutionsSignal.set([]);
        this.errorSignal.set('');
        this.loadPromise = null;
    }

    private readStoredId(): string | null {
        try {
            return sessionStorage.getItem(STORAGE_KEY);
        } catch {
            return null;
        }
    }
}
