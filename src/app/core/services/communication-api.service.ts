import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { PageResponse } from '../models/auth.models';
import {
    Communication,
    CommunicationPayload,
    CommunicationPreview,
    CommunicationPreviewPayload,
    CommunicationStatus,
    MessageTemplate,
    MessageTemplatePayload
} from '../models/communication.models';

export interface CommunicationFilters {
    status?: CommunicationStatus | null;
    studentId?: string | null;
    page: number;
    size: number;
}

@Injectable({ providedIn: 'root' })
export class CommunicationApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/communications`;

    listTemplates(active?: boolean | null) {
        let params = new HttpParams();
        if (active !== null && active !== undefined) {
            params = params.set('active', active);
        }
        return this.http.get<MessageTemplate[]>(`${this.baseUrl}/templates`, { params });
    }

    createTemplate(payload: MessageTemplatePayload) {
        return this.http.post<MessageTemplate>(`${this.baseUrl}/templates`, payload);
    }

    updateTemplate(id: string, payload: MessageTemplatePayload) {
        return this.http.put<MessageTemplate>(`${this.baseUrl}/templates/${id}`, payload);
    }

    list(filters: CommunicationFilters) {
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
        return this.http.get<PageResponse<Communication>>(this.baseUrl, { params });
    }

    get(id: string) {
        return this.http.get<Communication>(`${this.baseUrl}/${id}`);
    }

    preview(payload: CommunicationPreviewPayload) {
        return this.http.post<CommunicationPreview>(`${this.baseUrl}/preview`, payload);
    }

    create(payload: CommunicationPayload) {
        return this.http.post<Communication>(this.baseUrl, payload);
    }

    markOpened(id: string) {
        return this.http.post<Communication>(`${this.baseUrl}/${id}/opened`, {});
    }

    markFailed(id: string, reason: string) {
        return this.http.post<Communication>(`${this.baseUrl}/${id}/failed`, { reason });
    }
}
