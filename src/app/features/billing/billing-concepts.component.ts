import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { BillingApiService } from 'src/app/core/services/billing-api.service';
import {
    BILLING_FREQUENCY_LABELS,
    BillingConcept,
    BillingConceptPayload,
    BillingFrequency,
    BillingSettingsPayload
} from 'src/app/core/models/billing.models';

@Component({
    selector: 'app-billing-concepts',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './billing-concepts.component.html'
})
export class BillingConceptsComponent implements OnInit {
    private readonly api = inject(BillingApiService);
    private readonly auth = inject(AuthService);
    private readonly formBuilder = inject(FormBuilder);

    readonly concepts = signal<BillingConcept[]>([]);
    readonly editingId = signal<string | null>(null);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly settingsSaving = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    readonly canWriteConcepts = computed(() => this.auth.hasPermission('BILLING_CONCEPT_WRITE'));
    readonly canWriteSettings = computed(() => this.auth.hasPermission('BILLING_SETTINGS_WRITE'));

    readonly frequencies = Object.entries(BILLING_FREQUENCY_LABELS).map(([value, label]) => ({
        value: value as BillingFrequency,
        label
    }));

    readonly form = this.formBuilder.nonNullable.group({
        code: [''],
        name: ['', [Validators.required, Validators.maxLength(150)]],
        description: [''],
        defaultAmount: [0, [Validators.required, Validators.min(0)]],
        active: [true]
    });

    readonly settingsForm = this.formBuilder.nonNullable.group({
        frequency: ['MONTHLY' as BillingFrequency, [Validators.required]],
        issueDay: [1, [Validators.required, Validators.min(1), Validators.max(28)]],
        dueDays: [10, [Validators.required, Validators.min(0), Validators.max(120)]],
        active: [true]
    });

    ngOnInit(): void {
        this.load();
        this.api.getSettings().subscribe({
            next: (settings) =>
                this.settingsForm.patchValue({
                    frequency: settings.frequency,
                    issueDay: settings.issueDay,
                    dueDays: settings.dueDays,
                    active: settings.active
                }),
            error: () => undefined
        });
    }

    load(): void {
        this.loading.set(true);
        this.api.listConcepts().subscribe({
            next: (concepts) => {
                this.concepts.set(concepts);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
    }

    edit(concept: BillingConcept): void {
        this.editingId.set(concept.id);
        this.form.patchValue({
            code: concept.code ?? '',
            name: concept.name,
            description: concept.description ?? '',
            defaultAmount: concept.defaultAmount,
            active: concept.active
        });
    }

    reset(): void {
        this.editingId.set(null);
        this.form.reset({ code: '', name: '', description: '', defaultAmount: 0, active: true });
    }

    save(): void {
        this.error.set('');
        this.success.set('');
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const value = this.form.getRawValue();
        const payload: BillingConceptPayload = {
            code: value.code || null,
            name: value.name,
            description: value.description || null,
            defaultAmount: Number(value.defaultAmount) || 0,
            active: value.active
        };

        this.saving.set(true);
        const id = this.editingId();
        const request = id ? this.api.updateConcept(id, payload) : this.api.createConcept(payload);
        request.subscribe({
            next: () => {
                this.saving.set(false);
                this.success.set(id ? 'Concepto actualizado.' : 'Concepto creado.');
                this.reset();
                this.load();
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }

    toggleActive(concept: BillingConcept): void {
        if (!this.canWriteConcepts()) {
            return;
        }
        this.api
            .updateConcept(concept.id, {
                code: concept.code,
                name: concept.name,
                description: concept.description,
                defaultAmount: concept.defaultAmount,
                active: !concept.active
            })
            .subscribe({
                next: () => this.load(),
                error: (err: Error) => this.error.set(err.message)
            });
    }

    saveSettings(): void {
        this.error.set('');
        this.success.set('');
        if (this.settingsForm.invalid) {
            this.settingsForm.markAllAsTouched();
            return;
        }
        const value = this.settingsForm.getRawValue();
        const payload: BillingSettingsPayload = {
            frequency: value.frequency,
            issueDay: Number(value.issueDay),
            dueDays: Number(value.dueDays),
            active: value.active
        };
        this.settingsSaving.set(true);
        this.api.updateSettings(payload).subscribe({
            next: () => {
                this.settingsSaving.set(false);
                this.success.set('Configuración de cobro actualizada.');
            },
            error: (err: Error) => {
                this.settingsSaving.set(false);
                this.error.set(err.message);
            }
        });
    }
}
