import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { PageResponse } from '../models/auth.models';
import {
    CreateUserPayload,
    UpdateUserPayload,
    UserSummary
} from '../models/user.models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/users`;

    list(search: string | null, page: number, size: number) {
        let params = new HttpParams().set('page', page).set('size', size).set('sort', 'email,asc');
        if (search) {
            params = params.set('search', search);
        }
        return this.http.get<PageResponse<UserSummary>>(this.baseUrl, { params });
    }

    get(id: string) {
        return this.http.get<UserSummary>(`${this.baseUrl}/${id}`);
    }

    assignableRoles() {
        return this.http.get<string[]>(`${this.baseUrl}/roles`);
    }

    create(payload: CreateUserPayload) {
        return this.http.post<UserSummary>(this.baseUrl, payload);
    }

    update(id: string, payload: UpdateUserPayload) {
        return this.http.put<UserSummary>(`${this.baseUrl}/${id}`, payload);
    }

    updateStatus(id: string, active: boolean) {
        return this.http.patch<UserSummary>(`${this.baseUrl}/${id}/status`, { active });
    }

    updateRoles(id: string, roles: string[]) {
        return this.http.put<UserSummary>(`${this.baseUrl}/${id}/roles`, { roles });
    }

    resetPassword(id: string, newPassword: string) {
        return this.http.post<void>(`${this.baseUrl}/${id}/password-reset`, { newPassword });
    }

    changeOwnPassword(currentPassword: string, newPassword: string) {
        return this.http.put<void>(`${this.baseUrl}/me/password`, { currentPassword, newPassword });
    }
}
