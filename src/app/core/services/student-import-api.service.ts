import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { PageResponse } from '../models/auth.models';
import { StudentImport, StudentImportSummary } from '../models/student-import.models';

@Injectable({ providedIn: 'root' })
export class StudentImportApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/imports/students`;

    preview(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return this.http.post<StudentImport>(`${this.baseUrl}/preview`, formData);
    }

    confirm(id: string, allowUpdateExisting: boolean) {
        return this.http.post<StudentImport>(`${this.baseUrl}/${id}/confirm`, {
            allowUpdateExisting
        });
    }

    list(page: number, size: number) {
        const params = new HttpParams()
            .set('page', page)
            .set('size', size)
            .set('sort', 'createdAt,desc');
        return this.http.get<PageResponse<StudentImportSummary>>(this.baseUrl, { params });
    }

    get(id: string) {
        return this.http.get<StudentImport>(`${this.baseUrl}/${id}`);
    }
}
