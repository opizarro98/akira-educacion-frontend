import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { InstitutionApiService } from 'src/app/core/services/institution-api.service';
import { Institution, UpdateInstitutionPayload } from 'src/app/core/models/auth.models';

interface ModuleOption {
    code: string;
    label: string;
}

@Component({
    selector: 'app-institution-settings',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './institution-settings.component.html',
    styleUrl: './institution-settings.component.scss'
})
export class InstitutionSettingsComponent implements OnInit {
    private readonly api = inject(InstitutionApiService);
    private readonly formBuilder = inject(FormBuilder);

    readonly loading = signal(true);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly success = signal('');
    readonly selectedModules = signal<string[]>([]);
    readonly institution = signal<Institution | null>(null);

    readonly modules: ModuleOption[] = [
        { code: 'STUDENTS', label: 'Estudiantes' },
        { code: 'ENROLLMENT', label: 'Matrículas' },
        { code: 'BILLING', label: 'Obligaciones' },
        { code: 'PAYMENTS', label: 'Pagos' },
        { code: 'FINANCE', label: 'Finanzas' },
        { code: 'COMMUNICATIONS', label: 'Comunicaciones' },
        { code: 'REPORTING', label: 'Reportes' }
    ];

    readonly form = this.formBuilder.nonNullable.group({
        legalName: ['', [Validators.required, Validators.maxLength(200)]],
        tradeName: ['', [Validators.maxLength(200)]],
        taxId: ['', [Validators.maxLength(30)]],
        email: ['', [Validators.email, Validators.maxLength(150)]],
        phone: ['', [Validators.maxLength(40)]],
        website: ['', [Validators.maxLength(200)]],
        address: ['', [Validators.maxLength(250)]],
        city: ['', [Validators.maxLength(100)]],
        country: ['', [Validators.required, Validators.maxLength(100)]],
        timezone: ['', [Validators.required, Validators.maxLength(60)]],
        language: ['', [Validators.required, Validators.maxLength(10)]],
        currency: ['', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
        logoUrl: ['', [Validators.maxLength(500)]],
        primaryColor: ['', [Validators.maxLength(20)]],
        secondaryColor: ['', [Validators.maxLength(20)]],
        vatEnabled: [false],
        vatRate: this.formBuilder.control<number | null>(null),
        vatEffectiveFrom: ['']
    });

    ngOnInit(): void {
        this.api.getMine().subscribe({
            next: (institution) => {
                this.institution.set(institution);
                this.form.patchValue({
                    legalName: institution.legalName,
                    tradeName: institution.tradeName ?? '',
                    taxId: institution.taxId ?? '',
                    email: institution.email ?? '',
                    phone: institution.phone ?? '',
                    website: institution.website ?? '',
                    address: institution.address ?? '',
                    city: institution.city ?? '',
                    country: institution.country,
                    timezone: institution.timezone,
                    language: institution.language,
                    currency: institution.currency,
                    logoUrl: institution.logoUrl ?? '',
                    primaryColor: institution.primaryColor ?? '',
                    secondaryColor: institution.secondaryColor ?? '',
                    vatEnabled: institution.vatEnabled,
                    vatRate: institution.vatRate,
                    vatEffectiveFrom: institution.vatEffectiveFrom ?? ''
                });
                this.selectedModules.set(institution.modules);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
    }

    toggleModule(code: string, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        this.selectedModules.update((modules) => {
            if (checked) {
                return modules.includes(code) ? modules : [...modules, code];
            }
            return modules.filter((module) => module !== code);
        });
    }

    save(): void {
        this.error.set('');
        this.success.set('');

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.getRawValue();
        if (value.vatEnabled && value.vatRate === null) {
            this.error.set('Debe indicar la tasa de IVA cuando el IVA está habilitado.');
            return;
        }

        const payload: UpdateInstitutionPayload = {
            legalName: value.legalName,
            tradeName: value.tradeName || null,
            taxId: value.taxId || null,
            email: value.email || null,
            phone: value.phone || null,
            website: value.website || null,
            address: value.address || null,
            city: value.city || null,
            country: value.country,
            timezone: value.timezone,
            language: value.language,
            currency: value.currency,
            logoUrl: value.logoUrl || null,
            primaryColor: value.primaryColor || null,
            secondaryColor: value.secondaryColor || null,
            vatEnabled: value.vatEnabled,
            vatRate: value.vatRate,
            vatEffectiveFrom: value.vatEffectiveFrom || null,
            modules: this.selectedModules()
        };

        this.saving.set(true);
        this.api.updateMine(payload).subscribe({
            next: (institution) => {
                this.institution.set(institution);
                this.saving.set(false);
                this.success.set('Configuración institucional actualizada correctamente.');
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }
}
