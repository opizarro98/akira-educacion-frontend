import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { InstitutionApiService } from 'src/app/core/services/institution-api.service';
import { CreateInstitutionPayload, Institution } from 'src/app/core/models/auth.models';

@Component({
    selector: 'app-institution-list',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './institution-list.component.html',
    styleUrl: './institution-list.component.scss'
})
export class InstitutionListComponent implements OnInit {
    private readonly api = inject(InstitutionApiService);
    private readonly formBuilder = inject(FormBuilder);

    readonly institutions = signal<Institution[]>([]);
    readonly totalElements = signal(0);
    readonly totalPages = signal(0);
    readonly page = signal(0);
    readonly pageSize = 10;

    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly success = signal('');
    readonly showForm = signal(false);
    readonly search = signal('');
    readonly appliedSearch = signal('');

    readonly form = this.formBuilder.nonNullable.group({
        legalName: ['', [Validators.required, Validators.maxLength(200)]],
        tradeName: ['', [Validators.maxLength(200)]],
        taxId: ['', [Validators.maxLength(30)]],
        email: ['', [Validators.email, Validators.maxLength(150)]],
        city: ['', [Validators.maxLength(100)]],
        country: ['Ecuador', [Validators.required, Validators.maxLength(100)]],
        timezone: ['America/Guayaquil', [Validators.required, Validators.maxLength(60)]],
        language: ['es', [Validators.required, Validators.maxLength(10)]],
        currency: ['USD', [Validators.required, Validators.pattern(/^[A-Z]{3}$/)]],
        adminEmail: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
        adminFullName: ['', [Validators.required, Validators.maxLength(150)]],
        adminPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(100)]]
    });

    ngOnInit(): void {
        this.load(0);
    }

    load(page: number): void {
        this.loading.set(true);
        this.error.set('');

        this.api.list(this.appliedSearch() || null, page, this.pageSize).subscribe({
            next: (response) => {
                this.institutions.set(response.content);
                this.totalElements.set(response.totalElements);
                this.totalPages.set(response.totalPages);
                this.page.set(response.page);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
    }

    applySearch(): void {
        this.appliedSearch.set(this.search().trim());
        this.load(0);
    }

    clearSearch(): void {
        this.search.set('');
        this.appliedSearch.set('');
        this.load(0);
    }

    toggleForm(): void {
        this.showForm.update((value) => !value);
        this.error.set('');
        this.success.set('');
    }

    create(): void {
        this.error.set('');
        this.success.set('');
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.getRawValue();
        const payload: CreateInstitutionPayload = {
            legalName: value.legalName,
            tradeName: value.tradeName || null,
            taxId: value.taxId || null,
            email: value.email || null,
            city: value.city || null,
            country: value.country,
            timezone: value.timezone,
            language: value.language,
            currency: value.currency,
            vatEnabled: false,
            admin: {
                email: value.adminEmail,
                fullName: value.adminFullName,
                password: value.adminPassword
            }
        };

        this.saving.set(true);
        this.api.create(payload).subscribe({
            next: (institution) => {
                this.saving.set(false);
                this.success.set(`Institución "${institution.legalName}" creada correctamente.`);
                this.form.reset();
                this.showForm.set(false);
                this.load(0);
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }

    previousPage(): void {
        if (this.page() > 0) {
            this.load(this.page() - 1);
        }
    }

    nextPage(): void {
        if (this.page() + 1 < this.totalPages()) {
            this.load(this.page() + 1);
        }
    }
}
