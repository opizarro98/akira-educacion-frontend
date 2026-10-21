import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { StudentApiService } from 'src/app/core/services/student-api.service';
import {
    STUDENT_STATUS_LABELS,
    StudentPayload,
    StudentStatus
} from 'src/app/core/models/school.models';

@Component({
    selector: 'app-student-form',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './student-form.component.html'
})
export class StudentFormComponent implements OnInit {
    private readonly api = inject(StudentApiService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly studentId = signal<string | null>(null);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly notesRestricted = signal(false);

    readonly statuses = Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => ({
        value: value as StudentStatus,
        label
    }));

    readonly form = this.formBuilder.nonNullable.group({
        firstName: ['', [Validators.required, Validators.maxLength(100)]],
        lastName: ['', [Validators.required, Validators.maxLength(100)]],
        documentType: [''],
        documentNumber: ['', [Validators.maxLength(40)]],
        birthDate: [''],
        admissionDate: [new Date().toISOString().slice(0, 10), [Validators.required]],
        status: ['PRE_REGISTERED' as StudentStatus, [Validators.required]],
        email: ['', [Validators.email, Validators.maxLength(150)]],
        phone: ['', [Validators.maxLength(40)]],
        address: ['', [Validators.maxLength(250)]],
        notes: ['']
    });

    get isEdit(): boolean {
        return this.studentId() !== null;
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (!id) {
            return;
        }
        this.studentId.set(id);
        this.loading.set(true);
        this.api.get(id).subscribe({
            next: (student) => {
                this.form.patchValue({
                    firstName: student.firstName,
                    lastName: student.lastName,
                    documentType: student.documentType ?? '',
                    documentNumber: student.documentNumber ?? '',
                    birthDate: student.birthDate ?? '',
                    admissionDate: student.admissionDate,
                    status: student.status,
                    email: student.email ?? '',
                    phone: student.phone ?? '',
                    address: student.address ?? '',
                    notes: student.notes ?? ''
                });
                this.notesRestricted.set(student.notesRestricted);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
    }

    save(): void {
        this.error.set('');
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.getRawValue();
        const payload: StudentPayload = {
            firstName: value.firstName.trim(),
            lastName: value.lastName.trim(),
            documentType: value.documentType || null,
            documentNumber: value.documentNumber || null,
            birthDate: value.birthDate || null,
            admissionDate: value.admissionDate,
            status: value.status,
            email: value.email || null,
            phone: value.phone || null,
            address: value.address || null,
            notes: this.notesRestricted() ? undefined : value.notes || null
        };

        this.saving.set(true);
        const id = this.studentId();
        const request = id ? this.api.update(id, payload) : this.api.create(payload);
        request.subscribe({
            next: (student) => {
                this.saving.set(false);
                void this.router.navigate(['/students', student.id]);
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }
}
