import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { StudentImportApiService } from 'src/app/core/services/student-import-api.service';
import {
    IMPORT_DUPLICATE_TYPE_LABELS,
    IMPORT_ROW_STATUS_LABELS,
    ImportRowStatus,
    StudentImport,
    StudentImportRow
} from 'src/app/core/models/student-import.models';

type Stage = 'upload' | 'preview' | 'result';

@Component({
    selector: 'app-student-import',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './student-import.component.html'
})
export class StudentImportComponent {
    private readonly api = inject(StudentImportApiService);
    private readonly auth = inject(AuthService);

    readonly stage = signal<Stage>('upload');
    readonly selectedFile = signal<File | null>(null);
    readonly previewData = signal<StudentImport | null>(null);
    readonly resultData = signal<StudentImport | null>(null);
    readonly allowUpdateExisting = signal(false);

    readonly busy = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    readonly canWrite = computed(() => this.auth.hasPermission('STUDENT_IMPORT_WRITE'));
    readonly validRows = computed(() => this.rowsWith('VALID'));
    readonly errorRows = computed(() => this.rowsWith('ERROR'));
    readonly duplicateRows = computed(
        () => this.previewData()?.rows.filter((row) => row.rowStatus.startsWith('DUPLICATE')) ?? []
    );

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        const file = input.files && input.files.length > 0 ? input.files[0] : null;
        this.selectedFile.set(file);
        this.error.set('');
        this.success.set('');
    }

    upload(): void {
        const file = this.selectedFile();
        if (!file) {
            this.error.set('Seleccione un archivo Excel.');
            return;
        }
        if (!file.name.toLowerCase().endsWith('.xlsx')) {
            this.error.set('Solo se permiten archivos Excel con extensión .xlsx.');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            this.error.set('El archivo supera el tamaño máximo permitido (5 MB).');
            return;
        }

        this.busy.set(true);
        this.error.set('');
        this.api.preview(file).subscribe({
            next: (preview) => {
                this.previewData.set(preview);
                this.stage.set('preview');
                this.busy.set(false);
            },
            error: (err: Error) => {
                this.busy.set(false);
                this.error.set(err.message);
            }
        });
    }

    confirm(): void {
        const preview = this.previewData();
        if (!preview) {
            return;
        }
        this.busy.set(true);
        this.error.set('');
        this.api.confirm(preview.id, this.allowUpdateExisting()).subscribe({
            next: (result) => {
                this.resultData.set(result);
                this.stage.set('result');
                this.busy.set(false);
                this.success.set('Importación confirmada.');
            },
            error: (err: Error) => {
                this.busy.set(false);
                this.error.set(err.message);
            }
        });
    }

    cancelPreview(): void {
        this.previewData.set(null);
        this.stage.set('upload');
        this.error.set('');
    }

    reset(): void {
        this.selectedFile.set(null);
        this.previewData.set(null);
        this.resultData.set(null);
        this.allowUpdateExisting.set(false);
        this.stage.set('upload');
        this.error.set('');
        this.success.set('');
    }

    rowStatusLabel(status: ImportRowStatus): string {
        return IMPORT_ROW_STATUS_LABELS[status];
    }

    duplicateTypeLabel(type: string | null): string {
        if (!type) {
            return '—';
        }
        return IMPORT_DUPLICATE_TYPE_LABELS[type as keyof typeof IMPORT_DUPLICATE_TYPE_LABELS] ?? type;
    }

    rowStatusClass(status: ImportRowStatus): string {
        switch (status) {
            case 'VALID':
                return 'bg-light-success';
            case 'ERROR':
                return 'bg-light-danger';
            default:
                return 'bg-light-warning';
        }
    }

    fullName(row: StudentImportRow): string {
        return [row.lastName, row.firstName].filter(Boolean).join(', ') || '—';
    }

    fileSizeLabel(bytes: number): string {
        if (bytes < 1024) {
            return `${bytes} B`;
        }
        if (bytes < 1024 * 1024) {
            return `${(bytes / 1024).toFixed(1)} KB`;
        }
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    private rowsWith(status: ImportRowStatus): StudentImportRow[] {
        return this.previewData()?.rows.filter((row) => row.rowStatus === status) ?? [];
    }
}
