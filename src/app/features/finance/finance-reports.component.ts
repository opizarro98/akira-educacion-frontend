import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { FinanceApiService } from 'src/app/core/services/finance-api.service';
import {
    CashFlowReport,
    CashSummaryReport,
    ConfirmedPaymentsReport,
    ExpenseReport,
    OutstandingReport,
    PendingPaymentsReport,
    ReportHeader,
    VoidedPaymentsReport
} from 'src/app/core/models/finance.models';
import { PAYMENT_METHOD_LABELS, PaymentMethod } from 'src/app/core/models/payment.models';

type ReportTab = 'confirmed' | 'pending' | 'voided' | 'outstanding' | 'expenses' | 'cash';

@Component({
    selector: 'app-finance-reports',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './finance-reports.component.html'
})
export class FinanceReportsComponent implements OnInit {
    private readonly api = inject(FinanceApiService);

    readonly from = signal(monthStart());
    readonly to = signal(today());
    readonly tab = signal<ReportTab>('confirmed');
    readonly loading = signal(false);
    readonly error = signal('');
    readonly header = signal<ReportHeader | null>(null);

    readonly confirmed = signal<ConfirmedPaymentsReport | null>(null);
    readonly pending = signal<PendingPaymentsReport | null>(null);
    readonly voided = signal<VoidedPaymentsReport | null>(null);
    readonly outstanding = signal<OutstandingReport | null>(null);
    readonly expenses = signal<ExpenseReport | null>(null);
    readonly cashFlow = signal<CashFlowReport | null>(null);
    readonly cashSummary = signal<CashSummaryReport | null>(null);

    readonly tabs: { value: ReportTab; label: string }[] = [
        { value: 'confirmed', label: 'Cobros confirmados' },
        { value: 'pending', label: 'Pendientes' },
        { value: 'voided', label: 'Anulados' },
        { value: 'outstanding', label: 'Cartera' },
        { value: 'expenses', label: 'Egresos' },
        { value: 'cash', label: 'Caja' }
    ];

    ngOnInit(): void {
        this.load();
    }

    selectTab(tab: ReportTab): void {
        this.tab.set(tab);
        this.load();
    }

    applyPeriod(): void {
        this.load();
    }

    load(): void {
        const from = this.from() || null;
        const to = this.to() || null;
        this.loading.set(true);
        this.error.set('');

        switch (this.tab()) {
            case 'confirmed':
                this.api.confirmedPayments(from, to).subscribe({
                    next: (report) => this.finish(report.header, () => this.confirmed.set(report)),
                    error: (err: Error) => this.fail(err)
                });
                break;
            case 'pending':
                this.api.pendingPayments(from, to).subscribe({
                    next: (report) => this.finish(report.header, () => this.pending.set(report)),
                    error: (err: Error) => this.fail(err)
                });
                break;
            case 'voided':
                this.api.voidedPayments(from, to).subscribe({
                    next: (report) => this.finish(report.header, () => this.voided.set(report)),
                    error: (err: Error) => this.fail(err)
                });
                break;
            case 'outstanding':
                this.api.outstanding(from, to).subscribe({
                    next: (report) => this.finish(report.header, () => this.outstanding.set(report)),
                    error: (err: Error) => this.fail(err)
                });
                break;
            case 'expenses':
                this.api.expenseReport(from, to).subscribe({
                    next: (report) => this.finish(report.header, () => this.expenses.set(report)),
                    error: (err: Error) => this.fail(err)
                });
                break;
            case 'cash':
                this.api.cashFlow(from, to).subscribe({
                    next: (report) => this.finish(report.header, () => this.cashFlow.set(report)),
                    error: (err: Error) => this.fail(err)
                });
                this.api.cashSummary(from, to).subscribe({
                    next: (summary) => this.cashSummary.set(summary),
                    error: () => this.cashSummary.set(null)
                });
                break;
        }
    }

    methodLabel(method: PaymentMethod): string {
        return PAYMENT_METHOD_LABELS[method] ?? method;
    }

    private finish(header: ReportHeader, apply: () => void): void {
        apply();
        this.header.set(header);
        this.loading.set(false);
    }

    private fail(err: Error): void {
        this.error.set(err.message);
        this.loading.set(false);
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
