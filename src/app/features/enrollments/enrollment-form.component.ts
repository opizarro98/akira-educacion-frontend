import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormArray,
    FormBuilder,
    FormGroup,
    ReactiveFormsModule,
    Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { EnrollmentApiService } from 'src/app/core/services/enrollment-api.service';
import { CatalogApiService } from 'src/app/core/services/catalog-api.service';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import {
    AcademicPeriod,
    CatalogService,
    EducationalLevel,
    EnrollmentPayload,
    EnrollmentStatus,
    Plan,
    ServiceRate,
    Student
} from 'src/app/core/models/school.models';

@Component({
    selector: 'app-enrollment-form',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './enrollment-form.component.html'
})
export class EnrollmentFormComponent implements OnInit {
    private readonly api = inject(EnrollmentApiService);
    private readonly catalogApi = inject(CatalogApiService);
    private readonly studentApi = inject(StudentApiService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly enrollmentId = signal<string | null>(null);
    readonly currentStatus = signal<EnrollmentStatus | null>(null);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly error = signal('');

    readonly students = signal<Student[]>([]);
    readonly levels = signal<EducationalLevel[]>([]);
    readonly plans = signal<Plan[]>([]);
    readonly periods = signal<AcademicPeriod[]>([]);
    readonly services = signal<CatalogService[]>([]);
    readonly rates = signal<ServiceRate[]>([]);

    readonly servicesArray: FormArray = this.formBuilder.array([]);

    readonly form = this.formBuilder.nonNullable.group({
        studentId: ['', [Validators.required]],
        educationalLevelId: ['', [Validators.required]],
        planId: [''],
        academicPeriodId: [''],
        startDate: [new Date().toISOString().slice(0, 10), [Validators.required]],
        endDate: [''],
        agreedPrice: [0, [Validators.required, Validators.min(0)]],
        notes: [''],
        services: this.servicesArray
    });

    get isEdit(): boolean {
        return this.enrollmentId() !== null;
    }

    ngOnInit(): void {
        this.loadCatalogs();

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.enrollmentId.set(id);
            this.loadEnrollment(id);
            return;
        }

        const studentId = this.route.snapshot.queryParamMap.get('studentId');
        if (studentId) {
            this.form.patchValue({ studentId });
        }
    }

    addServiceLine(): void {
        this.servicesArray.push(
            this.formBuilder.nonNullable.group({
                serviceId: ['', [Validators.required]],
                agreedPrice: [0, [Validators.required, Validators.min(0)]],
                quantity: [1, [Validators.required, Validators.min(1)]]
            })
        );
    }

    removeServiceLine(index: number): void {
        this.servicesArray.removeAt(index);
    }

    onServiceSelected(index: number): void {
        const group = this.servicesArray.at(index) as FormGroup;
        const serviceId = String(group.get('serviceId')?.value ?? '');
        const rate = this.rates()
            .filter((item) => item.serviceId === serviceId && item.active)
            .sort((a, b) => b.validFrom.localeCompare(a.validFrom))[0];
        if (rate) {
            group.get('agreedPrice')?.setValue(rate.amount);
        }
    }

    save(): void {
        this.error.set('');
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.getRawValue();
        const lines = (this.servicesArray.getRawValue() as {
            serviceId: string;
            agreedPrice: number;
            quantity: number;
        }[])
            .filter((line) => line.serviceId)
            .map((line) => ({
                serviceId: line.serviceId,
                agreedPrice: Number(line.agreedPrice),
                quantity: Number(line.quantity) || 1
            }));

        const payload: EnrollmentPayload = {
            studentId: value.studentId,
            educationalLevelId: value.educationalLevelId,
            planId: value.planId || null,
            academicPeriodId: value.academicPeriodId || null,
            startDate: value.startDate,
            endDate: value.endDate || null,
            agreedPrice: Number(value.agreedPrice),
            notes: value.notes || null,
            services: lines
        };

        this.saving.set(true);
        const id = this.enrollmentId();
        const request = id ? this.api.update(id, payload) : this.api.create(payload);
        request.subscribe({
            next: (enrollment) => {
                this.saving.set(false);
                void this.router.navigate(['/enrollments', enrollment.id]);
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }

    private loadCatalogs(): void {
        this.studentApi.list(null, null, 0, 200).subscribe({
            next: (response) => this.students.set(response.content),
            error: (err: Error) => this.error.set(err.message)
        });
        this.catalogApi.levels().subscribe({
            next: (levels) => this.levels.set(levels.filter((level) => level.active)),
            error: (err: Error) => this.error.set(err.message)
        });
        this.catalogApi.plans().subscribe({
            next: (plans) => this.plans.set(plans.filter((plan) => plan.active)),
            error: (err: Error) => this.error.set(err.message)
        });
        this.catalogApi.periods().subscribe({
            next: (periods) => this.periods.set(periods),
            error: (err: Error) => this.error.set(err.message)
        });
        this.catalogApi.services().subscribe({
            next: (services) => this.services.set(services.filter((service) => service.active)),
            error: (err: Error) => this.error.set(err.message)
        });
        this.catalogApi.rates().subscribe({
            next: (rates) => this.rates.set(rates),
            error: () => this.rates.set([])
        });
    }

    private loadEnrollment(id: string): void {
        this.loading.set(true);
        this.api.get(id).subscribe({
            next: (enrollment) => {
                this.currentStatus.set(enrollment.status);
                this.form.patchValue({
                    studentId: enrollment.studentId,
                    educationalLevelId: enrollment.educationalLevelId,
                    planId: enrollment.planId ?? '',
                    academicPeriodId: enrollment.academicPeriodId ?? '',
                    startDate: enrollment.startDate,
                    endDate: enrollment.endDate ?? '',
                    agreedPrice: enrollment.agreedPrice,
                    notes: enrollment.notes ?? ''
                });
                this.servicesArray.clear();
                for (const line of enrollment.services) {
                    this.servicesArray.push(
                        this.formBuilder.nonNullable.group({
                            serviceId: [line.serviceId, [Validators.required]],
                            agreedPrice: [line.agreedPrice, [Validators.required, Validators.min(0)]],
                            quantity: [line.quantity, [Validators.required, Validators.min(1)]]
                        })
                    );
                }
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
    }
}
