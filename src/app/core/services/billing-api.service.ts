import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { PageResponse } from '../models/auth.models';
import {
    BillingConcept,
    BillingConceptPayload,
    BillingSettings,
    BillingSettingsPayload,
    Charge,
    ChargeBalance,
    ChargeHistoryEntry,
    ChargePayload,
    ChargeStatus,
    ChargeSummary,
    GenerateMonthlyChargePayload
} from '../models/billing.models';

export interface ChargeFilters {
    status?: ChargeStatus | null;
    studentId?: string | null;
    issueFrom?: string | null;
    issueTo?: string | null;
    dueFrom?: string | null;
    dueTo?: string | null;
    page: number;
    size: number;
}

@Injectable({ providedIn: 'root' })
export class BillingApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/billing`;

    listCharges(filters: ChargeFilters) {
        let params = new HttpParams()
            .set('page', filters.page)
            .set('size', filters.size)
            .set('sort', 'createdAt,desc');
        const values: [string, string | null | undefined][] = [
            ['status', filters.status],
            ['studentId', filters.studentId],
            ['issueFrom', filters.issueFrom],
            ['issueTo', filters.issueTo],
            ['dueFrom', filters.dueFrom],
            ['dueTo', filters.dueTo]
        ];
        for (const [key, value] of values) {
            if (value) {
                params = params.set(key, value);
            }
        }
        return this.http.get<PageResponse<ChargeSummary>>(`${this.baseUrl}/charges`, { params });
    }

    getCharge(id: string) {
        return this.http.get<Charge>(`${this.baseUrl}/charges/${id}`);
    }

    getBalance(id: string) {
        return this.http.get<ChargeBalance>(`${this.baseUrl}/charges/${id}/balance`);
    }

    getHistory(id: string) {
        return this.http.get<ChargeHistoryEntry[]>(`${this.baseUrl}/charges/${id}/history`);
    }

    createCharge(payload: ChargePayload) {
        return this.http.post<Charge>(`${this.baseUrl}/charges`, payload);
    }

    generateFromEnrollment(enrollmentId: string) {
        return this.http.post<Charge>(`${this.baseUrl}/charges/from-enrollment/${enrollmentId}`, {});
    }

    generateMonthly(payload: GenerateMonthlyChargePayload) {
        return this.http.post<Charge>(`${this.baseUrl}/charges/generate-monthly`, payload);
    }

    voidCharge(id: string, reason: string) {
        return this.http.post<Charge>(`${this.baseUrl}/charges/${id}/void`, { reason });
    }

    listConcepts() {
        return this.http.get<BillingConcept[]>(`${this.baseUrl}/concepts`);
    }

    createConcept(payload: BillingConceptPayload) {
        return this.http.post<BillingConcept>(`${this.baseUrl}/concepts`, payload);
    }

    updateConcept(id: string, payload: BillingConceptPayload) {
        return this.http.put<BillingConcept>(`${this.baseUrl}/concepts/${id}`, payload);
    }

    getSettings() {
        return this.http.get<BillingSettings>(`${this.baseUrl}/settings`);
    }

    updateSettings(payload: BillingSettingsPayload) {
        return this.http.put<BillingSettings>(`${this.baseUrl}/settings`, payload);
    }
}
