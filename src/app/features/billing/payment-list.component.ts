import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { PaymentApiService } from 'src/app/core/services/payment-api.service';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import {
    PAYMENT_METHOD_LABELS,
    PAYMENT_STATUS_LABELS,
    PaymentMethod,
    PaymentStatus,
    PaymentSummary
} from 'src/app/core/models/payment.models';
import { Student } from 'src/app/core/models/school.models';

@Component({
    selector: 'app-payment-list',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './payment-list.component.html'
})
export class PaymentListComponent implements OnInit {
    private readonly api = inject(PaymentApiService);
    private readonly studentApi = inject(StudentApiService);
    private readonly auth = inject(AuthService);

    readonly payments = signal<PaymentSummary[]>([]);
    readonly students = signal<Student[]>([]);
    readonly totalElements = signal(0);
    readonly totalPages = signal(0);
    readonly page = signal(0);
    readonly pageSize = 10;

    readonly loading = signal(false);
    readonly error = signal('');

    readonly status = signal<PaymentStatus | ''>('');
    readonly studentId = signal('');
    readonly method = signal<PaymentMethod | ''>('');
    readonly receivedFrom = signal('');
    readonly receivedTo = signal('');

    readonly appliedStatus = signal<PaymentStatus | ''>('');
    readonly appliedStudentId = signal('');
    readonly appliedMethod = signal<PaymentMethod | ''>('');
    readonly appliedReceivedFrom = signal('');
    readonly appliedReceivedTo = signal('');

    readonly canWrite = computed(() => this.auth.hasPermission('PAYMENT_WRITE'));
    readonly statuses = Object.entries(PAYMENT_STATUS_LABELS).map(([value, label]) => ({
        value: value as PaymentStatus,
        label
    }));
    readonly methods = Object.entries(PAYMENT_METHOD_LABELS).map(([value, label]) => ({
        value: value as PaymentMethod,
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
            .list({
                status: this.appliedStatus() || null,
                studentId: this.appliedStudentId() || null,
                method: this.appliedMethod() || null,
                receivedFrom: this.appliedReceivedFrom() || null,
                receivedTo: this.appliedReceivedTo() || null,
                page,
                size: this.pageSize
            })
            .subscribe({
                next: (response) => {
                    this.payments.set(response.content);
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
        this.appliedMethod.set(this.method());
        this.appliedReceivedFrom.set(this.receivedFrom());
        this.appliedReceivedTo.set(this.receivedTo());
        this.load(0);
    }

    clearFilters(): void {
        this.status.set('');
        this.studentId.set('');
        this.method.set('');
        this.receivedFrom.set('');
        this.receivedTo.set('');
        this.appliedStatus.set('');
        this.appliedStudentId.set('');
        this.appliedMethod.set('');
        this.appliedReceivedFrom.set('');
        this.appliedReceivedTo.set('');
        this.load(0);
    }

    statusLabel(status: PaymentStatus): string {
        return PAYMENT_STATUS_LABELS[status];
    }

    methodLabel(method: PaymentMethod): string {
        return PAYMENT_METHOD_LABELS[method];
    }

    statusClass(status: PaymentStatus): string {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-light-success';
            case 'VOID':
                return 'bg-light-danger';
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
