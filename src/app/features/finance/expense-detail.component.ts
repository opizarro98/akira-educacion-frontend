import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { FinanceApiService } from 'src/app/core/services/finance-api.service';
import {
    EXPENSE_STATUS_LABELS,
    Expense,
    ExpenseHistoryEntry,
    ExpenseStatus
} from 'src/app/core/models/finance.models';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from 'src/app/core/models/payment.models';

@Component({
    selector: 'app-expense-detail',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './expense-detail.component.html'
})
export class ExpenseDetailComponent implements OnInit {
    private readonly api = inject(FinanceApiService);
    private readonly auth = inject(AuthService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);

    readonly expenseId = signal('');
    readonly expense = signal<Expense | null>(null);
    readonly history = signal<ExpenseHistoryEntry[]>([]);

    readonly loading = signal(false);
    readonly working = signal(false);
    readonly error = signal('');
    readonly success = signal('');
    readonly showVoid = signal(false);

    readonly canWrite = computed(() => this.auth.hasPermission('EXPENSE_WRITE'));

    readonly voidForm = this.formBuilder.nonNullable.group({
        reason: ['', [Validators.required, Validators.maxLength(500)]]
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        this.expenseId.set(id);
        this.load();
    }

    load(): void {
        const id = this.expenseId();
        if (!id) {
            return;
        }
        this.loading.set(true);
        this.error.set('');
        this.api.getExpense(id).subscribe({
            next: (expense) => {
                this.expense.set(expense);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
        this.api.getExpenseHistory(id).subscribe({
            next: (entries) => this.history.set(entries),
            error: () => this.history.set([])
        });
    }

    confirmExpense(): void {
        if (!window.confirm('¿Confirmar este egreso? Se generará la salida de caja y ya no podrá editarse.')) {
            return;
        }
        this.working.set(true);
        this.api.confirmExpense(this.expenseId()).subscribe({
            next: () => {
                this.working.set(false);
                this.success.set('Egreso confirmado y salida de caja generada.');
                this.load();
            },
            error: (err: Error) => {
                this.working.set(false);
                this.error.set(err.message);
            }
        });
    }

    voidExpense(): void {
        if (!window.confirm('¿Anular este egreso? La acción queda auditada.')) {
            return;
        }
        if (this.voidForm.invalid) {
            this.voidForm.markAllAsTouched();
            return;
        }
        const reason = this.voidForm.getRawValue().reason.trim();
        this.working.set(true);
        this.api.voidExpense(this.expenseId(), reason).subscribe({
            next: () => {
                this.working.set(false);
                this.showVoid.set(false);
                this.voidForm.reset({ reason: '' });
                this.success.set('Egreso anulado.');
                this.load();
            },
            error: (err: Error) => {
                this.working.set(false);
                this.error.set(err.message);
            }
        });
    }

    statusLabel(status: ExpenseStatus): string {
        return EXPENSE_STATUS_LABELS[status];
    }

    methodLabel(method: PaymentMethod): string {
        return PAYMENT_METHOD_LABELS[method];
    }

    statusClass(status: ExpenseStatus): string {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-light-success';
            case 'VOID':
                return 'bg-light-danger';
            default:
                return 'bg-light-warning';
        }
    }
}
