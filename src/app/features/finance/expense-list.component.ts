import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { FinanceApiService } from 'src/app/core/services/finance-api.service';
import {
    EXPENSE_STATUS_LABELS,
    ExpenseCategory,
    ExpenseStatus,
    ExpenseSummary
} from 'src/app/core/models/finance.models';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from 'src/app/core/models/payment.models';

@Component({
    selector: 'app-expense-list',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './expense-list.component.html'
})
export class ExpenseListComponent implements OnInit {
    private readonly api = inject(FinanceApiService);
    private readonly auth = inject(AuthService);

    readonly expenses = signal<ExpenseSummary[]>([]);
    readonly categories = signal<ExpenseCategory[]>([]);
    readonly totalElements = signal(0);
    readonly totalPages = signal(0);
    readonly page = signal(0);
    readonly pageSize = 10;

    readonly loading = signal(false);
    readonly error = signal('');

    readonly status = signal<ExpenseStatus | ''>('');
    readonly categoryId = signal('');
    readonly from = signal('');
    readonly to = signal('');

    readonly appliedStatus = signal<ExpenseStatus | ''>('');
    readonly appliedCategoryId = signal('');
    readonly appliedFrom = signal('');
    readonly appliedTo = signal('');

    readonly canCreate = computed(() => this.auth.hasPermission('EXPENSE_CREATE'));
    readonly statuses = Object.entries(EXPENSE_STATUS_LABELS).map(([value, label]) => ({
        value: value as ExpenseStatus,
        label
    }));

    ngOnInit(): void {
        this.api.listCategories().subscribe({
            next: (categories) => this.categories.set(categories),
            error: () => this.categories.set([])
        });
        this.load(0);
    }

    load(page: number): void {
        this.loading.set(true);
        this.error.set('');
        this.api
            .listExpenses({
                status: this.appliedStatus() || null,
                categoryId: this.appliedCategoryId() || null,
                from: this.appliedFrom() || null,
                to: this.appliedTo() || null,
                page,
                size: this.pageSize
            })
            .subscribe({
                next: (response) => {
                    this.expenses.set(response.content);
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

    applyFilters(): void {
        this.appliedStatus.set(this.status());
        this.appliedCategoryId.set(this.categoryId());
        this.appliedFrom.set(this.from());
        this.appliedTo.set(this.to());
        this.load(0);
    }

    clearFilters(): void {
        this.status.set('');
        this.categoryId.set('');
        this.from.set('');
        this.to.set('');
        this.applyFilters();
    }

    statusLabel(value: ExpenseStatus): string {
        return EXPENSE_STATUS_LABELS[value];
    }

    methodLabel(value: PaymentMethod): string {
        return PAYMENT_METHOD_LABELS[value];
    }

    statusClass(value: ExpenseStatus): string {
        switch (value) {
            case 'CONFIRMED':
                return 'bg-light-success';
            case 'VOID':
                return 'bg-light-danger';
            default:
                return 'bg-light-warning';
        }
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
