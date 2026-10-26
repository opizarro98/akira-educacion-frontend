import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { CommunicationApiService } from 'src/app/core/services/communication-api.service';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import {
    COMMUNICATION_STATUS_LABELS,
    Communication,
    CommunicationStatus
} from 'src/app/core/models/communication.models';
import { Student } from 'src/app/core/models/school.models';

@Component({
    selector: 'app-communication-list',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './communication-list.component.html'
})
export class CommunicationListComponent implements OnInit {
    private readonly api = inject(CommunicationApiService);
    private readonly studentApi = inject(StudentApiService);
    private readonly auth = inject(AuthService);

    readonly communications = signal<Communication[]>([]);
    readonly students = signal<Student[]>([]);
    readonly totalElements = signal(0);
    readonly totalPages = signal(0);
    readonly page = signal(0);
    readonly pageSize = 10;

    readonly loading = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    readonly status = signal<CommunicationStatus | ''>('');
    readonly studentId = signal('');
    readonly appliedStatus = signal<CommunicationStatus | ''>('');
    readonly appliedStudentId = signal('');

    readonly canWrite = computed(() => this.auth.hasPermission('COMMUNICATION_WRITE'));
    readonly statuses = Object.entries(COMMUNICATION_STATUS_LABELS).map(([value, label]) => ({
        value: value as CommunicationStatus,
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
                page,
                size: this.pageSize
            })
            .subscribe({
                next: (response) => {
                    this.communications.set(response.content);
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
        this.load(0);
    }

    clearFilters(): void {
        this.status.set('');
        this.studentId.set('');
        this.applyFilters();
    }

    openWhatsApp(communication: Communication): void {
        window.open(communication.waLink, '_blank', 'noopener');
        if (communication.status === 'OPENED' || communication.status === 'FAILED') {
            return;
        }
        this.api.markOpened(communication.id).subscribe({
            next: () => {
                this.success.set('Se registró la apertura del enlace. WhatsApp no confirma el envío.');
                this.load(this.page());
            },
            error: () => undefined
        });
    }

    statusLabel(status: CommunicationStatus): string {
        return COMMUNICATION_STATUS_LABELS[status];
    }

    statusClass(status: CommunicationStatus): string {
        switch (status) {
            case 'OPENED':
                return 'bg-light-success';
            case 'FAILED':
                return 'bg-light-danger';
            case 'READY':
                return 'bg-light-primary';
            default:
                return 'bg-light-warning';
        }
    }

    shortMessage(message: string): string {
        return message.length > 90 ? `${message.slice(0, 90)}…` : message;
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
