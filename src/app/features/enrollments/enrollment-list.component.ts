import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { EnrollmentApiService } from 'src/app/core/services/enrollment-api.service';
import { CatalogApiService } from 'src/app/core/services/catalog-api.service';
import {
    ENROLLMENT_STATUS_LABELS,
    AcademicPeriod,
    Enrollment,
    EnrollmentStatus
} from 'src/app/core/models/school.models';

@Component({
    selector: 'app-enrollment-list',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './enrollment-list.component.html'
})
export class EnrollmentListComponent implements OnInit {
    private readonly api = inject(EnrollmentApiService);
    private readonly catalogApi = inject(CatalogApiService);
    private readonly auth = inject(AuthService);

    readonly enrollments = signal<Enrollment[]>([]);
    readonly periods = signal<AcademicPeriod[]>([]);
    readonly totalElements = signal(0);
    readonly totalPages = signal(0);
    readonly page = signal(0);
    readonly pageSize = 10;

    readonly loading = signal(false);
    readonly error = signal('');

    readonly status = signal<EnrollmentStatus | ''>('');
    readonly periodId = signal('');
    readonly appliedStatus = signal<EnrollmentStatus | ''>('');
    readonly appliedPeriodId = signal('');

    readonly canWrite = computed(() => this.auth.hasPermission('ENROLLMENT_WRITE'));
    readonly statuses = Object.entries(ENROLLMENT_STATUS_LABELS).map(([value, label]) => ({
        value: value as EnrollmentStatus,
        label
    }));

    ngOnInit(): void {
        this.catalogApi.periods().subscribe({
            next: (periods) => this.periods.set(periods),
            error: () => this.periods.set([])
        });
        this.load(0);
    }

    load(page: number): void {
        this.loading.set(true);
        this.error.set('');
        this.api
            .list({
                status: this.appliedStatus() || null,
                academicPeriodId: this.appliedPeriodId() || null,
                page,
                size: this.pageSize
            })
            .subscribe({
                next: (response) => {
                    this.enrollments.set(response.content);
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
        this.appliedStatus.set(this.status());
        this.appliedPeriodId.set(this.periodId());
        this.load(0);
    }

    clearFilters(): void {
        this.status.set('');
        this.periodId.set('');
        this.appliedStatus.set('');
        this.appliedPeriodId.set('');
        this.load(0);
    }

    statusLabel(status: EnrollmentStatus): string {
        return ENROLLMENT_STATUS_LABELS[status];
    }

    statusClass(status: EnrollmentStatus): string {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-light-success';
            case 'CANCELLED':
                return 'bg-light-danger';
            case 'COMPLETED':
                return 'bg-light-primary';
            default:
                return 'bg-light-warning';
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
