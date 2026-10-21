import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { PageResponse } from '../models/auth.models';
import {
    Enrollment,
    EnrollmentHistoryEntry,
    EnrollmentPayload,
    EnrollmentStatus
} from '../models/school.models';

@Injectable({ providedIn: 'root' })
export class EnrollmentApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/enrollments`;

    list(filters: {
        status?: EnrollmentStatus | null;
        studentId?: string | null;
        academicPeriodId?: string | null;
        page: number;
        size: number;
    }) {
        let params = new HttpParams()
            .set('page', filters.page)
            .set('size', filters.size)
            .set('sort', 'createdAt,desc');
        if (filters.status) {
            params = params.set('status', filters.status);
        }
        if (filters.studentId) {
            params = params.set('studentId', filters.studentId);
        }
        if (filters.academicPeriodId) {
            params = params.set('academicPeriodId', filters.academicPeriodId);
        }
        return this.http.get<PageResponse<Enrollment>>(this.baseUrl, { params });
    }

    get(id: string) {
        return this.http.get<Enrollment>(`${this.baseUrl}/${id}`);
    }

    create(payload: EnrollmentPayload) {
        return this.http.post<Enrollment>(this.baseUrl, payload);
    }

    update(id: string, payload: EnrollmentPayload) {
        return this.http.put<Enrollment>(`${this.baseUrl}/${id}`, payload);
    }

    confirm(id: string) {
        return this.http.post<Enrollment>(`${this.baseUrl}/${id}/confirm`, {});
    }

    cancel(id: string, reason: string) {
        return this.http.post<Enrollment>(`${this.baseUrl}/${id}/cancel`, { reason });
    }

    complete(id: string) {
        return this.http.post<Enrollment>(`${this.baseUrl}/${id}/complete`, {});
    }

    history(id: string) {
        return this.http.get<EnrollmentHistoryEntry[]>(`${this.baseUrl}/${id}/history`);
    }
}
