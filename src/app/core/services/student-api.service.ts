import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

import { environment } from 'src/environments/environment';
import { PageResponse } from '../models/auth.models';
import {
    LinkRepresentativePayload,
    Student,
    StudentPayload,
    StudentRepresentative,
    StudentStatus
} from '../models/school.models';

@Injectable({ providedIn: 'root' })
export class StudentApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.apiUrl}/students`;

    list(search: string | null, status: StudentStatus | null, page: number, size: number) {
        let params = new HttpParams()
            .set('page', page)
            .set('size', size)
            .set('sort', 'lastName,asc');
        if (search) {
            params = params.set('search', search);
        }
        if (status) {
            params = params.set('status', status);
        }
        return this.http.get<PageResponse<Student>>(this.baseUrl, { params });
    }

    get(id: string) {
        return this.http.get<Student>(`${this.baseUrl}/${id}`);
    }

    create(payload: StudentPayload) {
        return this.http.post<Student>(this.baseUrl, payload);
    }

    update(id: string, payload: StudentPayload) {
        return this.http.put<Student>(`${this.baseUrl}/${id}`, payload);
    }

    remove(id: string) {
        return this.http.delete<void>(`${this.baseUrl}/${id}`);
    }

    representatives(studentId: string) {
        return this.http.get<StudentRepresentative[]>(`${this.baseUrl}/${studentId}/representatives`);
    }

    linkRepresentative(studentId: string, payload: LinkRepresentativePayload) {
        return this.http.post<StudentRepresentative>(
            `${this.baseUrl}/${studentId}/representatives`,
            payload
        );
    }

    updateLink(studentId: string, representativeId: string, payload: LinkRepresentativePayload) {
        return this.http.put<StudentRepresentative>(
            `${this.baseUrl}/${studentId}/representatives/${representativeId}`,
            payload
        );
    }

    unlinkRepresentative(studentId: string, representativeId: string) {
        return this.http.delete<void>(
            `${this.baseUrl}/${studentId}/representatives/${representativeId}`
        );
    }
}
