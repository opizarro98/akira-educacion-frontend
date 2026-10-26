import { StudentStatus } from './school.models';

export type StudentImportStatus = 'PREVIEWED' | 'IMPORTED' | 'FAILED';
export type ImportRowStatus = 'VALID' | 'ERROR' | 'DUPLICATE_FILE' | 'DUPLICATE_EXISTING';
export type ImportDuplicateType = 'DOCUMENT' | 'NAME_BIRTHDATE';

export interface StudentImportRow {
    rowNumber: number;
    firstName: string | null;
    lastName: string | null;
    documentType: string | null;
    documentNumber: string | null;
    birthDate: string | null;
    admissionDate: string | null;
    studentStatus: StudentStatus | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    rowStatus: ImportRowStatus;
    errors: string[];
    duplicateType: ImportDuplicateType | null;
    existingStudentId: string | null;
    createdStudentId: string | null;
    updatedExisting: boolean;
}

export interface StudentImportSummary {
    id: string;
    fileName: string;
    fileSize: number;
    fileHash: string;
    status: StudentImportStatus;
    totalRows: number;
    validRows: number;
    errorRows: number;
    duplicateRows: number;
    importedRows: number;
    updatedRows: number;
    allowUpdateExisting: boolean;
    createdByEmail: string | null;
    createdAt: string;
    confirmedByEmail: string | null;
    confirmedAt: string | null;
}

export interface StudentImport extends StudentImportSummary {
    rows: StudentImportRow[];
}

export const IMPORT_ROW_STATUS_LABELS: Record<ImportRowStatus, string> = {
    VALID: 'Válida',
    ERROR: 'Con errores',
    DUPLICATE_FILE: 'Duplicada en el archivo',
    DUPLICATE_EXISTING: 'Coincide con estudiante existente'
};

export const IMPORT_DUPLICATE_TYPE_LABELS: Record<ImportDuplicateType, string> = {
    DOCUMENT: 'Identificación',
    NAME_BIRTHDATE: 'Nombre y fecha de nacimiento'
};
