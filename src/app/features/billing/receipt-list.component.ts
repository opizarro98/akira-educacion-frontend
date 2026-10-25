import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { PaymentApiService } from 'src/app/core/services/payment-api.service';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import {
    PAYMENT_METHOD_LABELS,
    PaymentMethod,
    Receipt
} from 'src/app/core/models/payment.models';
import { Student } from 'src/app/core/models/school.models';

@Component({
    selector: 'app-receipt-list',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './receipt-list.component.html'
})
export class ReceiptListComponent implements OnInit {
    private readonly api = inject(PaymentApiService);
    private readonly studentApi = inject(StudentApiService);

    readonly receipts = signal<Receipt[]>([]);
    readonly students = signal<Student[]>([]);
    readonly totalElements = signal(0);
    readonly totalPages = signal(0);
    readonly page = signal(0);
    readonly pageSize = 10;

    readonly loading = signal(false);
    readonly error = signal('');

    readonly studentId = signal('');
    readonly appliedStudentId = signal('');

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
            .listReceipts({
                studentId: this.appliedStudentId() || null,
                page,
                size: this.pageSize
            })
            .subscribe({
                next: (response) => {
                    this.receipts.set(response.content);
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
        this.appliedStudentId.set(this.studentId());
        this.load(0);
    }

    clearFilters(): void {
        this.studentId.set('');
        this.appliedStudentId.set('');
        this.load(0);
    }

    methodLabel(method: PaymentMethod): string {
        return PAYMENT_METHOD_LABELS[method];
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
