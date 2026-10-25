import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { BillingApiService } from 'src/app/core/services/billing-api.service';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import {
    CHARGE_ORIGIN_LABELS,
    CHARGE_STATUS_LABELS,
    ChargeStatus,
    ChargeSummary
} from 'src/app/core/models/billing.models';
import { Student } from 'src/app/core/models/school.models';

@Component({
    selector: 'app-charge-list',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './charge-list.component.html'
})
export class ChargeListComponent implements OnInit {
    private readonly api = inject(BillingApiService);
    private readonly studentApi = inject(StudentApiService);
    private readonly auth = inject(AuthService);

    readonly charges = signal<ChargeSummary[]>([]);
    readonly students = signal<Student[]>([]);
    readonly totalElements = signal(0);
    readonly totalPages = signal(0);
    readonly page = signal(0);
    readonly pageSize = 10;

    readonly loading = signal(false);
    readonly error = signal('');

    readonly status = signal<ChargeStatus | ''>('');
    readonly studentId = signal('');
    readonly issueFrom = signal('');
    readonly issueTo = signal('');
    readonly dueFrom = signal('');
    readonly dueTo = signal('');

    readonly appliedStatus = signal<ChargeStatus | ''>('');
    readonly appliedStudentId = signal('');
    readonly appliedIssueFrom = signal('');
    readonly appliedIssueTo = signal('');
    readonly appliedDueFrom = signal('');
    readonly appliedDueTo = signal('');

    readonly canWrite = computed(() => this.auth.hasPermission('CHARGE_WRITE'));
    readonly statuses = Object.entries(CHARGE_STATUS_LABELS).map(([value, label]) => ({
        value: value as ChargeStatus,
        label
    }));

    ngOnInit(): void {
        this.studentApi.list(null, null, 0, 200).subscribe({
            next: (response) => this.students.set(response.content),
            error: () => this.students.set([])
        });
        this.load(0);
    }

    load(page: number): void {
        this.loading.set(true);
        this.error.set('');
        this.api
            .listCharges({
                status: this.appliedStatus() || null,
                studentId: this.appliedStudentId() || null,
                issueFrom: this.appliedIssueFrom() || null,
                issueTo: this.appliedIssueTo() || null,
                dueFrom: this.appliedDueFrom() || null,
                dueTo: this.appliedDueTo() || null,
                page,
                size: this.pageSize
            })
            .subscribe({
                next: (response) => {
                    this.charges.set(response.content);
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
        this.appliedStudentId.set(this.studentId());
        this.appliedIssueFrom.set(this.issueFrom());
        this.appliedIssueTo.set(this.issueTo());
        this.appliedDueFrom.set(this.dueFrom());
        this.appliedDueTo.set(this.dueTo());
        this.load(0);
    }

    clearFilters(): void {
        this.status.set('');
        this.studentId.set('');
        this.issueFrom.set('');
        this.issueTo.set('');
        this.dueFrom.set('');
        this.dueTo.set('');
        this.appliedStatus.set('');
        this.appliedStudentId.set('');
        this.appliedIssueFrom.set('');
        this.appliedIssueTo.set('');
        this.appliedDueFrom.set('');
        this.appliedDueTo.set('');
        this.load(0);
    }

    statusLabel(status: ChargeStatus): string {
        return CHARGE_STATUS_LABELS[status];
    }

    statusClass(status: ChargeStatus): string {
        switch (status) {
            case 'PAID':
                return 'bg-light-success';
            case 'PARTIAL':
                return 'bg-light-primary';
            case 'VOID':
                return 'bg-light-danger';
            default:
                return 'bg-light-warning';
        }
    }

    originLabel(origin: ChargeSummary['origin']): string {
        return CHARGE_ORIGIN_LABELS[origin];
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
