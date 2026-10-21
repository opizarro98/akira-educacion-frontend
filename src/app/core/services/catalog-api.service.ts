import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import {
    AcademicPeriod,
    CatalogService,
    EducationalLevel,
    Plan,
    ServiceRate
} from '../models/school.models';

export interface EducationalLevelPayload {
    name: string;
    code?: string | null;
    description?: string | null;
    sortOrder?: number | null;
    active?: boolean;
}

export interface AcademicPeriodPayload {
    name: string;
    startDate: string;
    endDate: string;
    active?: boolean;
}

export interface CatalogServicePayload {
    name: string;
    code?: string | null;
    description?: string | null;
    active?: boolean;
}

export interface PlanPayload {
    name: string;
    description?: string | null;
    active?: boolean;
    serviceIds: string[];
}

export interface ServiceRatePayload {
    serviceId: string;
    amount: number;
    validFrom: string;
    validTo?: string | null;
    active?: boolean;
}

@Injectable({ providedIn: 'root' })
export class CatalogApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/catalog`;

    levels() {
        return this.http.get<EducationalLevel[]>(`${this.baseUrl}/levels`);
    }

    createLevel(payload: EducationalLevelPayload) {
        return this.http.post<EducationalLevel>(`${this.baseUrl}/levels`, payload);
    }

    updateLevel(id: string, payload: EducationalLevelPayload) {
        return this.http.put<EducationalLevel>(`${this.baseUrl}/levels/${id}`, payload);
    }

    periods() {
        return this.http.get<AcademicPeriod[]>(`${this.baseUrl}/periods`);
    }

    createPeriod(payload: AcademicPeriodPayload) {
        return this.http.post<AcademicPeriod>(`${this.baseUrl}/periods`, payload);
    }

    updatePeriod(id: string, payload: AcademicPeriodPayload) {
        return this.http.put<AcademicPeriod>(`${this.baseUrl}/periods/${id}`, payload);
    }

    services() {
        return this.http.get<CatalogService[]>(`${this.baseUrl}/services`);
    }

    createService(payload: CatalogServicePayload) {
        return this.http.post<CatalogService>(`${this.baseUrl}/services`, payload);
    }

    updateService(id: string, payload: CatalogServicePayload) {
        return this.http.put<CatalogService>(`${this.baseUrl}/services/${id}`, payload);
    }

    plans() {
        return this.http.get<Plan[]>(`${this.baseUrl}/plans`);
    }

    createPlan(payload: PlanPayload) {
        return this.http.post<Plan>(`${this.baseUrl}/plans`, payload);
    }

    updatePlan(id: string, payload: PlanPayload) {
        return this.http.put<Plan>(`${this.baseUrl}/plans/${id}`, payload);
    }

    rates() {
        return this.http.get<ServiceRate[]>(`${this.baseUrl}/rates`);
    }

    createRate(payload: ServiceRatePayload) {
        return this.http.post<ServiceRate>(`${this.baseUrl}/rates`, payload);
    }

    updateRate(id: string, payload: ServiceRatePayload) {
        return this.http.put<ServiceRate>(`${this.baseUrl}/rates/${id}`, payload);
    }
}
