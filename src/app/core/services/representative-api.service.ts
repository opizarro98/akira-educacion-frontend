import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { PageResponse } from '../models/auth.models';
import { Representative, RepresentativePayload, RepresentativeStudent } from '../models/school.models';

@Injectable({ providedIn: 'root' })
export class RepresentativeApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/representatives`;

    list(search: string | null, page: number, size: number) {
        let params = new HttpParams()
            .set('page', page)
            .set('size', size)
            .set('sort', 'fullName,asc');
        if (search) {
            params = params.set('search', search);
        }
        return this.http.get<PageResponse<Representative>>(this.baseUrl, { params });
    }

    get(id: string) {
        return this.http.get<Representative>(`${this.baseUrl}/${id}`);
    }

    create(payload: RepresentativePayload) {
        return this.http.post<Representative>(this.baseUrl, payload);
    }

    update(id: string, payload: RepresentativePayload) {
        return this.http.put<Representative>(`${this.baseUrl}/${id}`, payload);
    }

    students(id: string) {
        return this.http.get<RepresentativeStudent[]>(`${this.baseUrl}/${id}/students`);
    }
}
