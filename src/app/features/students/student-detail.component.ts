import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import { RepresentativeApiService } from 'src/app/core/services/representative-api.service';
import { EnrollmentApiService } from 'src/app/core/services/enrollment-api.service';
import {
    ENROLLMENT_STATUS_LABELS,
    STUDENT_STATUS_LABELS,
    Enrollment,
    Representative,
    Student,
    StudentRepresentative
} from 'src/app/core/models/school.models';

@Component({
    selector: 'app-student-detail',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './student-detail.component.html'
})
export class StudentDetailComponent implements OnInit {
    private readonly studentApi = inject(StudentApiService);
    private readonly representativeApi = inject(RepresentativeApiService);
    private readonly enrollmentApi = inject(EnrollmentApiService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly auth = inject(AuthService);

    readonly studentId = signal('');
    readonly student = signal<Student | null>(null);
    readonly representatives = signal<StudentRepresentative[]>([]);
    readonly catalog = signal<Representative[]>([]);
    readonly enrollments = signal<Enrollment[]>([]);

    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly success = signal('');
    readonly showNewRepresentative = signal(false);

    readonly canWriteStudents = computed(() => this.auth.hasPermission('STUDENT_WRITE'));
    readonly canWriteRepresentatives = computed(() =>
        this.auth.hasPermission('REPRESENTATIVE_WRITE')
    );

    readonly linkForm = this.formBuilder.nonNullable.group({
        representativeId: ['', [Validators.required]],
        primaryContact: [false],
        authorizedForCommunications: [true],
        authorizedForBilling: [false]
    });

    readonly newRepresentativeForm = this.formBuilder.nonNullable.group({
        fullName: ['', [Validators.required, Validators.maxLength(200)]],
        documentNumber: [''],
        phone: [''],
        email: ['', [Validators.email]],
        relationship: [''],
        primaryContact: [false],
        authorizedForCommunications: [true],
        authorizedForBilling: [false]
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        this.studentId.set(id);
        this.load();
    }

    load(): void {
        const id = this.studentId();
        if (!id) {
            return;
        }
        this.loading.set(true);
        this.error.set('');

        this.studentApi.get(id).subscribe({
            next: (student) => {
                this.student.set(student);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });

        this.studentApi.representatives(id).subscribe({
            next: (items) => this.representatives.set(items),
            error: (err: Error) => this.error.set(err.message)
        });

        this.enrollmentApi
            .list({ studentId: id, page: 0, size: 20 })
            .subscribe({
                next: (response) => this.enrollments.set(response.content),
                error: (err: Error) => this.error.set(err.message)
            });

        if (this.canWriteRepresentatives()) {
            this.representativeApi.list(null, 0, 200).subscribe({
                next: (response) => this.catalog.set(response.content),
                error: () => this.catalog.set([])
            });
        }
    }

    linkExisting(): void {
        this.error.set('');
        this.success.set('');
        if (this.linkForm.invalid) {
            this.linkForm.markAllAsTouched();
            return;
        }
        const value = this.linkForm.getRawValue();
        this.saving.set(true);
        this.studentApi
            .linkRepresentative(this.studentId(), {
                representativeId: value.representativeId,
                primaryContact: value.primaryContact,
                authorizedForCommunications: value.authorizedForCommunications,
                authorizedForBilling: value.authorizedForBilling
            })
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.success.set('Representante asociado.');
                    this.linkForm.reset({
                        representativeId: '',
                        primaryContact: false,
                        authorizedForCommunications: true,
                        authorizedForBilling: false
                    });
                    this.load();
                },
                error: (err: Error) => {
                    this.saving.set(false);
                    this.error.set(err.message);
                }
            });
    }

    createAndLink(): void {
        this.error.set('');
        this.success.set('');
        if (this.newRepresentativeForm.invalid) {
            this.newRepresentativeForm.markAllAsTouched();
            return;
        }
        const value = this.newRepresentativeForm.getRawValue();
        this.saving.set(true);
        this.studentApi
            .linkRepresentative(this.studentId(), {
                newRepresentative: {
                    fullName: value.fullName.trim(),
                    documentNumber: value.documentNumber || null,
                    phone: value.phone || null,
                    email: value.email || null,
                    relationship: value.relationship || null
                },
                primaryContact: value.primaryContact,
                authorizedForCommunications: value.authorizedForCommunications,
                authorizedForBilling: value.authorizedForBilling
            })
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.success.set('Representante creado y asociado.');
                    this.showNewRepresentative.set(false);
                    this.newRepresentativeForm.reset({
                        fullName: '',
                        documentNumber: '',
                        phone: '',
                        email: '',
                        relationship: '',
                        primaryContact: false,
                        authorizedForCommunications: true,
                        authorizedForBilling: false
                    });
                    this.load();
                },
                error: (err: Error) => {
                    this.saving.set(false);
                    this.error.set(err.message);
                }
            });
    }

    togglePrimary(link: StudentRepresentative): void {
        this.error.set('');
        this.studentApi
            .updateLink(this.studentId(), link.representativeId, {
                primaryContact: !link.primaryContact,
                authorizedForCommunications: link.authorizedForCommunications,
                authorizedForBilling: link.authorizedForBilling
            })
            .subscribe({
                next: () => this.load(),
                error: (err: Error) => this.error.set(err.message)
            });
    }

    unlink(link: StudentRepresentative): void {
        if (!window.confirm(`¿Quitar a ${link.fullName} como representante del estudiante?`)) {
            return;
        }
        this.studentApi.unlinkRepresentative(this.studentId(), link.representativeId).subscribe({
            next: () => {
                this.success.set('Representante desvinculado.');
                this.load();
            },
            error: (err: Error) => this.error.set(err.message)
        });
    }

    studentStatusLabel(status: string): string {
        return STUDENT_STATUS_LABELS[status as keyof typeof STUDENT_STATUS_LABELS] ?? status;
    }

    enrollmentStatusLabel(status: string): string {
        return ENROLLMENT_STATUS_LABELS[status as keyof typeof ENROLLMENT_STATUS_LABELS] ?? status;
    }

    enrollmentStatusClass(status: string): string {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-light-success';
            case 'CANCELLED':
                return 'bg-light-danger';
            case 'COMPLETED':
                return 'bg-light-primary';
            default:
                return 'bg-light-warning';
        }
    }
}
