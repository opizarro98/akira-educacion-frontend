import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { FinanceApiService } from 'src/app/core/services/finance-api.service';
import { ExpenseCategory, ExpensePayload } from 'src/app/core/models/finance.models';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from 'src/app/core/models/payment.models';

@Component({
    selector: 'app-expense-form',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './expense-form.component.html'
})
export class ExpenseFormComponent implements OnInit {
    private readonly api = inject(FinanceApiService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);
    private readonly router = inject(Router);

    readonly categories = signal<ExpenseCategory[]>([]);
    readonly expenseId = signal('');
    readonly editing = signal(false);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly error = signal('');

    readonly methods = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
        value: value as PaymentMethod,
        label
    }));

    readonly form = this.formBuilder.nonNullable.group({
        categoryId: ['', [Validators.required]],
        amount: [0, [Validators.required, Validators.min(0.01)]],
        expenseDate: [today(), [Validators.required]],
        method: ['CASH' as PaymentMethod, [Validators.required]],
        description: ['', [Validators.required, Validators.maxLength(500)]],
        beneficiary: [''],
        reference: ['']
    });

    ngOnInit(): void {
        this.api.listCategories(true).subscribe({
            next: (categories) => this.categories.set(categories),
            error: (err: Error) => this.error.set(err.message)
        });

        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.expenseId.set(id);
            this.editing.set(true);
            this.loadExpense(id);
        }
    }

    save(): void {
        this.error.set('');
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const value = this.form.getRawValue();
        const payload: ExpensePayload = {
            categoryId: value.categoryId,
            amount: Number(value.amount),
            expenseDate: value.expenseDate,
            method: value.method,
            description: value.description.trim(),
            beneficiary: value.beneficiary.trim() || null,
            reference: value.reference.trim() || null
        };

        this.saving.set(true);
        const request = this.editing()
            ? this.api.updateExpense(this.expenseId(), payload)
            : this.api.createExpense(payload);

        request.subscribe({
            next: (expense) => {
                this.saving.set(false);
                void this.router.navigate(['/finance/expenses', expense.id]);
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }

    private loadExpense(id: string): void {
        this.loading.set(true);
        this.api.getExpense(id).subscribe({
            next: (expense) => {
                this.form.reset({
                    categoryId: expense.categoryId,
                    amount: Number(expense.amount),
                    expenseDate: expense.expenseDate,
                    method: expense.method,
                    description: expense.description,
                    beneficiary: expense.beneficiary ?? '',
                    reference: expense.reference ?? ''
                });
                if (expense.status !== 'DRAFT') {
                    this.error.set('Solo los egresos en borrador pueden editarse.');
                    this.form.disable();
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

function today(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}
