import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { AuthService } from 'src/app/core/services/auth.service';
import { CatalogApiService } from 'src/app/core/services/catalog-api.service';
import {
    AcademicPeriod,
    CatalogService,
    EducationalLevel,
    Plan,
    ServiceRate
} from 'src/app/core/models/school.models';

type CatalogTab = 'levels' | 'periods' | 'services' | 'plans' | 'rates';

@Component({
    selector: 'app-catalog',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './catalog.component.html'
})
export class CatalogComponent implements OnInit {
    private readonly api = inject(CatalogApiService);
    private readonly auth = inject(AuthService);
    private readonly formBuilder = inject(FormBuilder);

    readonly tab = signal<CatalogTab>('levels');
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    readonly levels = signal<EducationalLevel[]>([]);
    readonly periods = signal<AcademicPeriod[]>([]);
    readonly services = signal<CatalogService[]>([]);
    readonly plans = signal<Plan[]>([]);
    readonly rates = signal<ServiceRate[]>([]);

    readonly editingLevel = signal<string | null>(null);
    readonly editingPeriod = signal<string | null>(null);
    readonly editingService = signal<string | null>(null);
    readonly editingPlan = signal<string | null>(null);
    readonly editingRate = signal<string | null>(null);

    readonly showLevelForm = signal(false);
    readonly showPeriodForm = signal(false);
    readonly showServiceForm = signal(false);
    readonly showPlanForm = signal(false);
    readonly showRateForm = signal(false);

    readonly canWrite = computed(() => this.auth.hasPermission('CATALOG_WRITE'));

    readonly levelForm = this.formBuilder.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(120)]],
        code: [''],
        description: [''],
        sortOrder: [0],
        active: [true]
    });

    readonly periodForm = this.formBuilder.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(120)]],
        startDate: ['', [Validators.required]],
        endDate: ['', [Validators.required]],
        active: [true]
    });

    readonly serviceForm = this.formBuilder.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(150)]],
        code: [''],
        description: [''],
        active: [true]
    });

    readonly planForm = this.formBuilder.nonNullable.group({
        name: ['', [Validators.required, Validators.maxLength(150)]],
        description: [''],
        active: [true],
        serviceIds: [[] as string[]]
    });

    readonly rateForm = this.formBuilder.nonNullable.group({
        serviceId: ['', [Validators.required]],
        amount: [0, [Validators.required, Validators.min(0)]],
        validFrom: [new Date().toISOString().slice(0, 10), [Validators.required]],
        validTo: [''],
        active: [true]
    });

    ngOnInit(): void {
        this.reload();
    }

    reload(): void {
        this.loading.set(true);
        this.error.set('');
        this.api.levels().subscribe({
            next: (data) => this.levels.set(data),
            error: (err: Error) => this.error.set(err.message)
        });
        this.api.periods().subscribe({
            next: (data) => this.periods.set(data),
            error: (err: Error) => this.error.set(err.message)
        });
        this.api.services().subscribe({
            next: (data) => this.services.set(data),
            error: (err: Error) => this.error.set(err.message)
        });
        this.api.plans().subscribe({
            next: (data) => {
                this.plans.set(data);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
        this.api.rates().subscribe({
            next: (data) => this.rates.set(data),
            error: (err: Error) => this.error.set(err.message)
        });
    }

    selectTab(tab: CatalogTab): void {
        this.tab.set(tab);
        this.error.set('');
        this.success.set('');
    }

    // ---------------------------- Niveles ----------------------------

    editLevel(level?: EducationalLevel): void {
        this.editingLevel.set(level?.id ?? null);
        this.levelForm.reset({
            name: level?.name ?? '',
            code: level?.code ?? '',
            description: level?.description ?? '',
            sortOrder: level?.sortOrder ?? 0,
            active: level?.active ?? true
        });
        this.showLevelForm.set(true);
    }

    saveLevel(): void {
        if (this.levelForm.invalid) {
            this.levelForm.markAllAsTouched();
            return;
        }
        const value = this.levelForm.getRawValue();
        const payload = {
            name: value.name.trim(),
            code: value.code || null,
            description: value.description || null,
            sortOrder: Number(value.sortOrder) || 0,
            active: value.active
        };
        this.persist(
            this.editingLevel()
                ? this.api.updateLevel(this.editingLevel()!, payload)
                : this.api.createLevel(payload),
            'Nivel guardado.',
            () => this.showLevelForm.set(false)
        );
    }

    // --------------------------- Períodos ----------------------------

    editPeriod(period?: AcademicPeriod): void {
        this.editingPeriod.set(period?.id ?? null);
        this.periodForm.reset({
            name: period?.name ?? '',
            startDate: period?.startDate ?? '',
            endDate: period?.endDate ?? '',
            active: period?.active ?? true
        });
        this.showPeriodForm.set(true);
    }

    savePeriod(): void {
        if (this.periodForm.invalid) {
            this.periodForm.markAllAsTouched();
            return;
        }
        const value = this.periodForm.getRawValue();
        const payload = {
            name: value.name.trim(),
            startDate: value.startDate,
            endDate: value.endDate,
            active: value.active
        };
        this.persist(
            this.editingPeriod()
                ? this.api.updatePeriod(this.editingPeriod()!, payload)
                : this.api.createPeriod(payload),
            'Período guardado.',
            () => this.showPeriodForm.set(false)
        );
    }

    // --------------------------- Servicios ---------------------------

    editService(service?: CatalogService): void {
        this.editingService.set(service?.id ?? null);
        this.serviceForm.reset({
            name: service?.name ?? '',
            code: service?.code ?? '',
            description: service?.description ?? '',
            active: service?.active ?? true
        });
        this.showServiceForm.set(true);
    }

    saveService(): void {
        if (this.serviceForm.invalid) {
            this.serviceForm.markAllAsTouched();
            return;
        }
        const value = this.serviceForm.getRawValue();
        const payload = {
            name: value.name.trim(),
            code: value.code || null,
            description: value.description || null,
            active: value.active
        };
        this.persist(
            this.editingService()
                ? this.api.updateService(this.editingService()!, payload)
                : this.api.createService(payload),
            'Servicio guardado.',
            () => this.showServiceForm.set(false)
        );
    }

    // ----------------------------- Planes ----------------------------

    editPlan(plan?: Plan): void {
        this.editingPlan.set(plan?.id ?? null);
        this.planForm.reset({
            name: plan?.name ?? '',
            description: plan?.description ?? '',
            active: plan?.active ?? true,
            serviceIds: plan?.services.map((service) => service.id) ?? []
        });
        this.showPlanForm.set(true);
    }

    savePlan(): void {
        if (this.planForm.invalid) {
            this.planForm.markAllAsTouched();
            return;
        }
        const value = this.planForm.getRawValue();
        const payload = {
            name: value.name.trim(),
            description: value.description || null,
            active: value.active,
            serviceIds: value.serviceIds ?? []
        };
        this.persist(
            this.editingPlan()
                ? this.api.updatePlan(this.editingPlan()!, payload)
                : this.api.createPlan(payload),
            'Plan guardado.',
            () => this.showPlanForm.set(false)
        );
    }

    // ---------------------------- Tarifas ----------------------------

    editRate(rate?: ServiceRate): void {
        this.editingRate.set(rate?.id ?? null);
        this.rateForm.reset({
            serviceId: rate?.serviceId ?? '',
            amount: rate?.amount ?? 0,
            validFrom: rate?.validFrom ?? new Date().toISOString().slice(0, 10),
            validTo: rate?.validTo ?? '',
            active: rate?.active ?? true
        });
        this.showRateForm.set(true);
    }

    saveRate(): void {
        if (this.rateForm.invalid) {
            this.rateForm.markAllAsTouched();
            return;
        }
        const value = this.rateForm.getRawValue();
        const payload = {
            serviceId: value.serviceId,
            amount: Number(value.amount),
            validFrom: value.validFrom,
            validTo: value.validTo || null,
            active: value.active
        };
        this.persist(
            this.editingRate()
                ? this.api.updateRate(this.editingRate()!, payload)
                : this.api.createRate(payload),
            'Tarifa guardada. Las matrículas existentes mantienen su precio acordado.',
            () => this.showRateForm.set(false)
        );
    }

    // ------------------------------------------------------------------

    private persist(
        request: Observable<unknown>,
        message: string,
        onSuccess: () => void
    ): void {
        this.error.set('');
        this.success.set('');
        this.saving.set(true);
        request.subscribe({
            next: () => {
                this.saving.set(false);
                this.success.set(message);
                onSuccess();
                this.reload();
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }
}
