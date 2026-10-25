import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { PageResponse } from '../models/auth.models';
import {
    ApplyAllocationsPayload,
    Payment,
    PaymentHistoryEntry,
    PaymentMethod,
    PaymentStatus,
    PaymentSummary,
    Receipt,
    RegisterPaymentPayload
} from '../models/payment.models';

export interface PaymentFilters {
    status?: PaymentStatus | null;
    studentId?: string | null;
    method?: PaymentMethod | null;
    receivedFrom?: string | null;
    receivedTo?: string | null;
    page: number;
    size: number;
}

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/billing`;

    list(filters: PaymentFilters) {
        let params = new HttpParams()
            .set('page', filters.page)
            .set('size', filters.size)
            .set('sort', 'createdAt,desc');
        const values: [string, string | null | undefined][] = [
            ['status', filters.status],
            ['studentId', filters.studentId],
            ['method', filters.method],
            ['receivedFrom', filters.receivedFrom],
            ['receivedTo', filters.receivedTo]
        ];
        for (const [key, value] of values) {
            if (value) {
                params = params.set(key, value);
            }
        }
        return this.http.get<PageResponse<PaymentSummary>>(`${this.baseUrl}/payments`, { params });
    }

    get(id: string) {
        return this.http.get<Payment>(`${this.baseUrl}/payments/${id}`);
    }

    history(id: string) {
        return this.http.get<PaymentHistoryEntry[]>(`${this.baseUrl}/payments/${id}/history`);
    }

    register(payload: RegisterPaymentPayload) {
        return this.http.post<Payment>(`${this.baseUrl}/payments`, payload);
    }

    confirm(id: string) {
        return this.http.post<Payment>(`${this.baseUrl}/payments/${id}/confirm`, {});
    }

    voidPayment(id: string, reason: string) {
        return this.http.post<Payment>(`${this.baseUrl}/payments/${id}/void`, { reason });
    }

    applyAllocations(id: string, payload: ApplyAllocationsPayload) {
        return this.http.post<Payment>(`${this.baseUrl}/payments/${id}/allocations`, payload);
    }

    reverseAllocation(paymentId: string, allocationId: string, reason: string) {
        return this.http.post<Payment>(
            `${this.baseUrl}/payments/${paymentId}/allocations/${allocationId}/reverse`,
            { reason }
        );
    }

    listReceipts(filters: {
        paymentId?: string | null;
        studentId?: string | null;
        page: number;
        size: number;
    }) {
        let params = new HttpParams()
            .set('page', filters.page)
            .set('size', filters.size)
            .set('sort', 'issuedAt,desc');
        if (filters.paymentId) {
            params = params.set('paymentId', filters.paymentId);
        }
        if (filters.studentId) {
            params = params.set('studentId', filters.studentId);
        }
        return this.http.get<PageResponse<Receipt>>(`${this.baseUrl}/receipts`, { params });
    }

    getReceipt(id: string) {
        return this.http.get<Receipt>(`${this.baseUrl}/receipts/${id}`);
    }

    getReceiptByPayment(paymentId: string) {
        return this.http.get<Receipt>(`${this.baseUrl}/receipts/by-payment/${paymentId}`);
    }
}
