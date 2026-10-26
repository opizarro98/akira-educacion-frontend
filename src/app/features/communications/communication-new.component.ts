import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { CommunicationApiService } from 'src/app/core/services/communication-api.service';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import {
    CommunicationPreview,
    CommunicationPreviewPayload,
    CommunicationStatus,
    MessageTemplate
} from 'src/app/core/models/communication.models';
import {
    Student,
    StudentRepresentative
} from 'src/app/core/models/school.models';

@Component({
    selector: 'app-communication-new',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './communication-new.component.html'
})
export class CommunicationNewComponent implements OnInit {
    private readonly api = inject(CommunicationApiService);
    private readonly studentApi = inject(StudentApiService);
    private readonly auth = inject(AuthService);
    private readonly router = inject(Router);

    readonly students = signal<Student[]>([]);
    readonly representatives = signal<StudentRepresentative[]>([]);
    readonly templates = signal<MessageTemplate[]>([]);
    readonly preview = signal<CommunicationPreview | null>(null);

    readonly studentId = signal('');
    readonly representativeId = signal('');
    readonly templateId = signal('');
    readonly includeFinancialInfo = signal(false);
    readonly financialNote = signal('');

    readonly loading = signal(false);
    readonly previewing = signal(false);
    readonly creating = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    readonly canWrite = computed(() => this.auth.hasPermission('COMMUNICATION_WRITE'));

    ngOnInit(): void {
        this.loading.set(true);
        this.studentApi.list(null, null, 0, 200).subscribe({
            next: (response) => {
                this.students.set(response.content);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
        this.api.listTemplates(true).subscribe({
            next: (templates) => this.templates.set(templates),
            error: (err: Error) => this.error.set(err.message)
        });
    }

    onStudentChange(): void {
        this.representativeId.set('');
        this.representatives.set([]);
        this.clearPreview();
        const studentId = this.studentId();
        if (!studentId) {
            return;
        }
        this.studentApi.representatives(studentId).subscribe({
            next: (representatives) => this.representatives.set(representatives),
            error: (err: Error) => this.error.set(err.message)
        });
    }

    generatePreview(): void {
        this.error.set('');
        this.success.set('');
        const payload = this.buildPayload();
        if (!payload) {
            return;
        }
        this.previewing.set(true);
        this.api.preview(payload).subscribe({
            next: (preview) => {
                this.preview.set(preview);
                this.previewing.set(false);
            },
            error: (err: Error) => {
                this.previewing.set(false);
                this.error.set(err.message);
            }
        });
    }

    saveDraft(): void {
        this.error.set('');
        this.success.set('');
        const payload = this.buildPayload();
        if (!payload) {
            return;
        }
        this.creating.set(true);
        this.api.create({ ...payload, saveAsDraft: true }).subscribe({
            next: () => {
                this.creating.set(false);
                void this.router.navigate(['/communications']);
            },
            error: (err: Error) => {
                this.creating.set(false);
                this.error.set(err.message);
            }
        });
    }

    openWhatsApp(): void {
        this.error.set('');
        this.success.set('');
        const payload = this.buildPayload();
        if (!payload) {
            return;
        }
        if (!this.preview()) {
            this.generatePreview();
            this.error.set('Revise la vista previa antes de abrir WhatsApp.');
            return;
        }

        // Se abre la pestaña de forma síncrona para que el navegador no la
        // bloquee; la URL definitiva se asigna al responder el backend.
        const popup = window.open('', '_blank');
        this.creating.set(true);
        this.api.create({ ...payload, saveAsDraft: false }).subscribe({
            next: (communication) => {
                this.api.markOpened(communication.id).subscribe({
                    next: () => undefined,
                    error: () => undefined
                });
                this.creating.set(false);
                this.success.set(
                    'Comunicación registrada como abierta en WhatsApp. El envío no está confirmado.'
                );
                if (popup) {
                    popup.location.href = communication.waLink;
                } else {
                    window.open(communication.waLink, '_blank', 'noopener');
                }
            },
            error: (err: Error) => {
                this.creating.set(false);
                popup?.close();
                this.error.set(err.message);
            }
        });
    }

    clearPreview(): void {
        this.preview.set(null);
        this.success.set('');
    }

    statusHint(status: CommunicationStatus): string {
        return status === 'OPENED' ? 'Abierta en WhatsApp' : status;
    }

    private buildPayload(): CommunicationPreviewPayload | null {
        if (!this.studentId() || !this.representativeId() || !this.templateId()) {
            this.error.set('Seleccione estudiante, representante y plantilla.');
            return null;
        }
        if (this.includeFinancialInfo() && !this.financialNote().trim()) {
            this.error.set('Indique y confirme el detalle financiero que desea incluir.');
            return null;
        }
        return {
            studentId: this.studentId(),
            representativeId: this.representativeId(),
            templateId: this.templateId(),
            includeFinancialInfo: this.includeFinancialInfo(),
            financialNote: this.includeFinancialInfo() ? this.financialNote().trim() : null
        };
    }
}
