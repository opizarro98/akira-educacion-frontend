import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import {
    CreateInstitutionPayload,
    Institution,
    PageResponse,
    UpdateInstitutionPayload
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class InstitutionApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/institutions`;

    getMine() {
        return this.http.get<Institution>(`${this.baseUrl}/me`);
    }

    updateMine(payload: UpdateInstitutionPayload) {
        return this.http.put<Institution>(`${this.baseUrl}/me`, payload);
    }

    getById(id: string) {
        return this.http.get<Institution>(`${this.baseUrl}/${id}`);
    }

    list(search: string | null, page: number, size: number) {
        let params = new HttpParams().set('page', page).set('size', size).set('sort', 'legalName,asc');
        if (search) {
            params = params.set('search', search);
        }
        return this.http.get<PageResponse<Institution>>(this.baseUrl, { params });
    }

    create(payload: CreateInstitutionPayload) {
        return this.http.post<Institution>(this.baseUrl, payload);
    }
}
