import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { PaymentApiService } from 'src/app/core/services/payment-api.service';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import { PaymentMethod, RegisterPaymentPayload } from 'src/app/core/models/payment.models';
import { Student } from 'src/app/core/models/school.models';

@Component({
    selector: 'app-payment-form',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './payment-form.component.html'
})
export class PaymentFormComponent implements OnInit {
    private readonly api = inject(PaymentApiService);
    private readonly studentApi = inject(StudentApiService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly router = inject(Router);

    readonly students = signal<Student[]>([]);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly idempotencyKey = signal(this.newKey());

    readonly form = this.formBuilder.nonNullable.group({
        studentId: ['', [Validators.required]],
        amount: [0, [Validators.required, Validators.min(0.01)]],
        method: ['CASH' as PaymentMethod, [Validators.required]],
        reference: [''],
        receivedDate: [today(), [Validators.required]],
        notes: ['']
    });

    ngOnInit(): void {
        this.studentApi.list(null, null, 0, 200).subscribe({
            next: (response) => this.students.set(response.content),
            error: (err: Error) => this.error.set(err.message)
        });
    }

    save(): void {
        this.error.set('');
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const value = this.form.getRawValue();
        if (value.method === 'BANK_TRANSFER' && !value.reference.trim()) {
            this.error.set('Las transferencias requieren una referencia bancaria.');
            return;
        }

        const payload: RegisterPaymentPayload = {
            studentId: value.studentId,
            amount: Number(value.amount),
            method: value.method,
            reference: value.reference || null,
            receivedDate: value.receivedDate,
            notes: value.notes || null,
            idempotencyKey: this.idempotencyKey()
        };

        this.saving.set(true);
        this.api.register(payload).subscribe({
            next: (payment) => {
                this.saving.set(false);
                void this.router.navigate(['/billing/payments', payment.id]);
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }

    private newKey(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return `payment-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}
