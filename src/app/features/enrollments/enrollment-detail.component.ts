import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from 'src/app/core/services/auth.service';
import { BillingApiService } from 'src/app/core/services/billing-api.service';
import { EnrollmentApiService } from 'src/app/core/services/enrollment-api.service';
import {
    ENROLLMENT_STATUS_LABELS,
    Enrollment,
    EnrollmentHistoryEntry
} from 'src/app/core/models/school.models';

@Component({
    selector: 'app-enrollment-detail',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './enrollment-detail.component.html'
})
export class EnrollmentDetailComponent implements OnInit {
    private readonly api = inject(EnrollmentApiService);
    private readonly billingApi = inject(BillingApiService);
    private readonly auth = inject(AuthService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly enrollmentId = signal('');
    readonly enrollment = signal<Enrollment | null>(null);
    readonly history = signal<EnrollmentHistoryEntry[]>([]);

    readonly loading = signal(false);
    readonly working = signal(false);
    readonly error = signal('');
    readonly success = signal('');
    readonly showCancel = signal(false);

    readonly canWrite = computed(() => this.auth.hasPermission('ENROLLMENT_WRITE'));
    readonly canGenerateCharge = computed(() => this.auth.hasPermission('CHARGE_WRITE'));

    readonly cancelForm = this.formBuilder.nonNullable.group({
        reason: ['', [Validators.required, Validators.maxLength(500)]]
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        this.enrollmentId.set(id);
        this.load();
    }

    load(): void {
        const id = this.enrollmentId();
        if (!id) {
            return;
        }
        this.loading.set(true);
        this.error.set('');
        this.api.get(id).subscribe({
            next: (enrollment) => {
                this.enrollment.set(enrollment);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
        this.api.history(id).subscribe({
            next: (entries) => this.history.set(entries),
            error: (err: Error) => this.error.set(err.message)
        });
    }

    confirmEnrollment(): void {
        if (!window.confirm('¿Confirmar la matrícula? El IVA vigente quedará registrado y la matrícula dejará de ser editable.')) {
            return;
        }
        this.runAction(this.api.confirm(this.enrollmentId()), 'Matrícula confirmada.');
    }

    completeEnrollment(): void {
        if (!window.confirm('¿Marcar la matrícula como completada?')) {
            return;
        }
        this.runAction(this.api.complete(this.enrollmentId()), 'Matrícula completada.');
    }

    generateInitialCharge(): void {
        if (!window.confirm(
            '¿Generar el cobro inicial de esta matrícula? Se usará el precio acordado y el IVA congelado al confirmar.'
        )) {
            return;
        }
        this.error.set('');
        this.success.set('');
        this.working.set(true);
        this.billingApi.generateFromEnrollment(this.enrollmentId()).subscribe({
            next: (charge) => {
                this.working.set(false);
                void this.router.navigate(['/billing/charges', charge.id]);
            },
            error: (err: Error) => {
                this.working.set(false);
                this.error.set(err.message);
            }
        });
    }

    cancelEnrollment(): void {
        this.error.set('');
        if (this.cancelForm.invalid) {
            this.cancelForm.markAllAsTouched();
            return;
        }
        const reason = this.cancelForm.getRawValue().reason.trim();
        this.working.set(true);
        this.api.cancel(this.enrollmentId(), reason).subscribe({
            next: () => {
                this.working.set(false);
                this.showCancel.set(false);
                this.cancelForm.reset({ reason: '' });
                this.success.set('Matrícula cancelada.');
                this.load();
            },
            error: (err: Error) => {
                this.working.set(false);
                this.error.set(err.message);
            }
        });
    }

    statusLabel(status: string): string {
        return ENROLLMENT_STATUS_LABELS[status as keyof typeof ENROLLMENT_STATUS_LABELS] ?? status;
    }

    statusClass(status: string): string {
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

    private runAction(request: Observable<unknown>, message: string): void {
        this.error.set('');
        this.success.set('');
        this.working.set(true);
        request.subscribe({
            next: () => {
                this.working.set(false);
                this.success.set(message);
                this.load();
            },
            error: (err: Error) => {
                this.working.set(false);
                this.error.set(err.message);
            }
        });
    }
}
