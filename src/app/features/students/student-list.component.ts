import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import {
    STUDENT_STATUS_LABELS,
    Student,
    StudentStatus
} from 'src/app/core/models/school.models';

@Component({
    selector: 'app-student-list',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './student-list.component.html'
})
export class StudentListComponent implements OnInit {
    private readonly api = inject(StudentApiService);
    private readonly auth = inject(AuthService);

    readonly students = signal<Student[]>([]);
    readonly totalElements = signal(0);
    readonly totalPages = signal(0);
    readonly page = signal(0);
    readonly pageSize = 10;

    readonly loading = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    readonly search = signal('');
    readonly status = signal<StudentStatus | ''>('');
    readonly appliedSearch = signal('');
    readonly appliedStatus = signal<StudentStatus | ''>('');

    readonly canWrite = computed(() => this.auth.hasPermission('STUDENT_WRITE'));
    readonly statuses = Object.entries(STUDENT_STATUS_LABELS).map(([value, label]) => ({
        value: value as StudentStatus,
        label
    }));

    ngOnInit(): void {
        this.load(0);
    }

    load(page: number): void {
        this.loading.set(true);
        this.error.set('');
        this.api
            .list(
                this.appliedSearch() || null,
                this.appliedStatus() || null,
                page,
                this.pageSize
            )
            .subscribe({
                next: (response) => {
                    this.students.set(response.content);
                    this.totalElements.set(response.totalElements);
                    this.totalPages.set(response.totalPages);
                    this.page.set(response.page);
                    this.loading.set(false);
                },
                error: (err: Error) => {
                    this.error.set(err.message);
                    this.loading.set(false);
                }
            });
    }

    applyFilters(): void {
        this.appliedSearch.set(this.search().trim());
        this.appliedStatus.set(this.status());
        this.load(0);
    }

    clearFilters(): void {
        this.search.set('');
        this.status.set('');
        this.appliedSearch.set('');
        this.appliedStatus.set('');
        this.load(0);
    }

    remove(student: Student): void {
        const confirmed = window.confirm(
            `¿Eliminar a ${student.lastName}, ${student.firstName}? Solo es posible si no tiene matrículas.`
        );
        if (!confirmed) {
            return;
        }
        this.error.set('');
        this.success.set('');
        this.api.remove(student.id).subscribe({
            next: () => {
                this.success.set('Estudiante eliminado.');
                this.load(this.page());
            },
            error: (err: Error) => this.error.set(err.message)
        });
    }

    statusLabel(status: StudentStatus): string {
        return STUDENT_STATUS_LABELS[status];
    }

    statusClass(status: StudentStatus): string {
        switch (status) {
            case 'ACTIVE':
                return 'bg-light-success';
            case 'PRE_REGISTERED':
                return 'bg-light-warning';
            case 'WITHDRAWN':
                return 'bg-light-danger';
            default:
                return 'bg-light-primary';
        }
    }

    previousPage(): void {
        if (this.page() > 0) {
            this.load(this.page() - 1);
        }
    }

    nextPage(): void {
        if (this.page() + 1 < this.totalPages()) {
            this.load(this.page() + 1);
        }
    }
}
