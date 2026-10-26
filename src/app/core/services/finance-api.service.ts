import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { PageResponse } from '../models/auth.models';
import {
    CashFlowReport,
    CashMovement,
    CashMovementType,
    CashSummaryReport,
    ConfirmedPaymentsReport,
    Dashboard,
    Expense,
    ExpenseCategory,
    ExpenseCategoryPayload,
    ExpenseHistoryEntry,
    ExpensePayload,
    ExpenseReport,
    ExpenseStatus,
    ExpenseSummary,
    OutstandingReport,
    PendingPaymentsReport,
    VoidedPaymentsReport
} from '../models/finance.models';

export interface ExpenseFilters {
    status?: ExpenseStatus | null;
    categoryId?: string | null;
    from?: string | null;
    to?: string | null;
    page: number;
    size: number;
}

export interface CashMovementFilters {
    type?: CashMovementType | null;
    from?: string | null;
    to?: string | null;
    page: number;
    size: number;
}

@Injectable({ providedIn: 'root' })
export class FinanceApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/finance`;

    // Categorías
    listCategories(active?: boolean | null) {
        let params = new HttpParams();
        if (active !== null && active !== undefined) {
            params = params.set('active', active);
        }
        return this.http.get<ExpenseCategory[]>(`${this.baseUrl}/expense-categories`, { params });
    }

    createCategory(payload: ExpenseCategoryPayload) {
        return this.http.post<ExpenseCategory>(`${this.baseUrl}/expense-categories`, payload);
    }

    updateCategory(id: string, payload: ExpenseCategoryPayload) {
        return this.http.put<ExpenseCategory>(`${this.baseUrl}/expense-categories/${id}`, payload);
    }

    // Egresos
    listExpenses(filters: ExpenseFilters) {
        let params = new HttpParams()
            .set('page', filters.page)
            .set('size', filters.size)
            .set('sort', 'createdAt,desc');
        const values: [string, string | null | undefined][] = [
            ['status', filters.status],
            ['categoryId', filters.categoryId],
            ['from', filters.from],
            ['to', filters.to]
        ];
        for (const [key, value] of values) {
            if (value) {
                params = params.set(key, value);
            }
        }
        return this.http.get<PageResponse<ExpenseSummary>>(`${this.baseUrl}/expenses`, { params });
    }

    getExpense(id: string) {
        return this.http.get<Expense>(`${this.baseUrl}/expenses/${id}`);
    }

    getExpenseHistory(id: string) {
        return this.http.get<ExpenseHistoryEntry[]>(`${this.baseUrl}/expenses/${id}/history`);
    }

    createExpense(payload: ExpensePayload) {
        return this.http.post<Expense>(`${this.baseUrl}/expenses`, payload);
    }

    updateExpense(id: string, payload: ExpensePayload) {
        return this.http.put<Expense>(`${this.baseUrl}/expenses/${id}`, payload);
    }

    confirmExpense(id: string) {
        return this.http.post<Expense>(`${this.baseUrl}/expenses/${id}/confirm`, {});
    }

    voidExpense(id: string, reason: string) {
        return this.http.post<Expense>(`${this.baseUrl}/expenses/${id}/void`, { reason });
    }

    // Caja
    listCashMovements(filters: CashMovementFilters) {
        let params = new HttpParams()
            .set('page', filters.page)
            .set('size', filters.size)
            .set('sort', 'occurredAt,desc');
        const values: [string, string | null | undefined][] = [
            ['type', filters.type],
            ['from', filters.from],
            ['to', filters.to]
        ];
        for (const [key, value] of values) {
            if (value) {
                params = params.set(key, value);
            }
        }
        return this.http.get<PageResponse<CashMovement>>(`${this.baseUrl}/cash-movements`, { params });
    }

    // Reportes
    confirmedPayments(from: string | null, to: string | null) {
        return this.http.get<ConfirmedPaymentsReport>(`${this.baseUrl}/reports/confirmed-payments`, {
            params: periodParams(from, to)
        });
    }

    pendingPayments(from: string | null, to: string | null) {
        return this.http.get<PendingPaymentsReport>(`${this.baseUrl}/reports/pending-payments`, {
            params: periodParams(from, to)
        });
    }

    voidedPayments(from: string | null, to: string | null) {
        return this.http.get<VoidedPaymentsReport>(`${this.baseUrl}/reports/voided-payments`, {
            params: periodParams(from, to)
        });
    }

    outstanding(from: string | null, to: string | null) {
        return this.http.get<OutstandingReport>(`${this.baseUrl}/reports/outstanding`, {
            params: periodParams(from, to)
        });
    }

    expenseReport(from: string | null, to: string | null) {
        return this.http.get<ExpenseReport>(`${this.baseUrl}/reports/expenses`, {
            params: periodParams(from, to)
        });
    }

    cashFlow(from: string | null, to: string | null) {
        return this.http.get<CashFlowReport>(`${this.baseUrl}/reports/cash-flow`, {
            params: periodParams(from, to)
        });
    }

    cashSummary(from: string | null, to: string | null) {
        return this.http.get<CashSummaryReport>(`${this.baseUrl}/reports/cash-summary`, {
            params: periodParams(from, to)
        });
    }

    dashboard(from: string | null, to: string | null) {
        return this.http.get<Dashboard>(`${this.baseUrl}/dashboard`, {
            params: periodParams(from, to)
        });
    }
}

function periodParams(from: string | null, to: string | null): HttpParams {
    let params = new HttpParams();
    if (from) {
        params = params.set('from', from);
    }
    if (to) {
        params = params.set('to', to);
    }
    return params;
}
