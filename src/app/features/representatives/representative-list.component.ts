import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthService } from 'src/app/core/services/auth.service';
import { RepresentativeApiService } from 'src/app/core/services/representative-api.service';
import {
    STUDENT_STATUS_LABELS,
    Representative,
    RepresentativeStudent
} from 'src/app/core/models/school.models';

@Component({
    selector: 'app-representative-list',
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './representative-list.component.html'
})
export class RepresentativeListComponent implements OnInit {
    private readonly api = inject(RepresentativeApiService);
    private readonly auth = inject(AuthService);
    private readonly formBuilder = inject(FormBuilder);

    readonly representatives = signal<Representative[]>([]);
    readonly totalElements = signal(0);
    readonly totalPages = signal(0);
    readonly page = signal(0);
    readonly pageSize = 10;

    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    readonly search = signal('');
    readonly appliedSearch = signal('');
    readonly showForm = signal(false);
    readonly editingId = signal<string | null>(null);

    readonly selected = signal<Representative | null>(null);
    readonly selectedStudents = signal<RepresentativeStudent[]>([]);

    readonly canWrite = computed(() => this.auth.hasPermission('REPRESENTATIVE_WRITE'));

    readonly form = this.formBuilder.nonNullable.group({
        fullName: ['', [Validators.required, Validators.maxLength(200)]],
        documentNumber: [''],
        phone: [''],
        email: ['', [Validators.email]],
        relationship: [''],
        notes: ['']
    });

    ngOnInit(): void {
        this.load(0);
    }

    load(page: number): void {
        this.loading.set(true);
        this.error.set('');
        this.api.list(this.appliedSearch() || null, page, this.pageSize).subscribe({
            next: (response) => {
                this.representatives.set(response.content);
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

    startCreate(): void {
        this.editingId.set(null);
        this.form.reset();
        this.showForm.set(true);
        this.error.set('');
        this.success.set('');
    }

    startEdit(representative: Representative): void {
        this.editingId.set(representative.id);
        this.form.setValue({
            fullName: representative.fullName,
            documentNumber: representative.documentNumber ?? '',
            phone: representative.phone ?? '',
            email: representative.email ?? '',
            relationship: representative.relationship ?? '',
            notes: representative.notes ?? ''
        });
        this.showForm.set(true);
        this.error.set('');
        this.success.set('');
    }

    cancelForm(): void {
        this.showForm.set(false);
        this.editingId.set(null);
        this.form.reset();
    }

    save(): void {
        this.error.set('');
        this.success.set('');
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.getRawValue();
        const payload = {
            fullName: value.fullName.trim(),
            documentNumber: value.documentNumber || null,
            phone: value.phone || null,
            email: value.email || null,
            relationship: value.relationship || null,
            notes: value.notes || null
        };

        this.saving.set(true);
        const id = this.editingId();
        const request = id ? this.api.update(id, payload) : this.api.create(payload);
        request.subscribe({
            next: (representative) => {
                this.saving.set(false);
                this.success.set(`Representante "${representative.fullName}" guardado.`);
                this.cancelForm();
                this.load(this.page());
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }

    viewStudents(representative: Representative): void {
        this.selected.set(representative);
        this.selectedStudents.set([]);
        this.api.students(representative.id).subscribe({
            next: (students) => this.selectedStudents.set(students),
            error: (err: Error) => this.error.set(err.message)
        });
    }

    statusLabel(status: string): string {
        return STUDENT_STATUS_LABELS[status as keyof typeof STUDENT_STATUS_LABELS] ?? status;
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
