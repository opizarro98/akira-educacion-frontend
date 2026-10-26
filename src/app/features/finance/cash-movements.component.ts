import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { FinanceApiService } from 'src/app/core/services/finance-api.service';
import {
    CASH_MOVEMENT_TYPE_LABELS,
    CashMovement,
    CashMovementType,
    CashSummaryReport
} from 'src/app/core/models/finance.models';

@Component({
    selector: 'app-cash-movements',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './cash-movements.component.html'
})
export class CashMovementsComponent implements OnInit {
    private readonly api = inject(FinanceApiService);

    readonly movements = signal<CashMovement[]>([]);
    readonly summary = signal<CashSummaryReport | null>(null);
    readonly totalElements = signal(0);
    readonly totalPages = signal(0);
    readonly page = signal(0);
    readonly pageSize = 15;

    readonly loading = signal(false);
    readonly error = signal('');

    readonly type = signal<CashMovementType | ''>('');
    readonly from = signal(monthStart());
    readonly to = signal(today());

    readonly appliedType = signal<CashMovementType | ''>('');
    readonly appliedFrom = signal(monthStart());
    readonly appliedTo = signal(today());

    readonly types = Object.entries(CASH_MOVEMENT_TYPE_LABELS).map(([value, label]) => ({
        value: value as CashMovementType,
        label
    }));

    ngOnInit(): void {
        this.load(0);
    }

    load(page: number): void {
        this.loading.set(true);
        this.error.set('');
        const from = this.appliedFrom() || null;
        const to = this.appliedTo() || null;

        this.api
            .listCashMovements({
                type: this.appliedType() || null,
                from,
                to,
                page,
                size: this.pageSize
            })
            .subscribe({
                next: (response) => {
                    this.movements.set(response.content);
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

        this.api.cashSummary(from, to).subscribe({
            next: (summary) => this.summary.set(summary),
            error: () => this.summary.set(null)
        });
    }

    applyFilters(): void {
        this.appliedType.set(this.type());
        this.appliedFrom.set(this.from());
        this.appliedTo.set(this.to());
        this.load(0);
    }

    typeLabel(value: CashMovementType): string {
        return CASH_MOVEMENT_TYPE_LABELS[value];
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

function today(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function monthStart(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}
