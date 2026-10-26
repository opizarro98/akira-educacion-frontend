export type CommunicationStatus = 'DRAFT' | 'READY' | 'OPENED' | 'FAILED';

export interface MessageTemplate {
    id: string;
    code: string | null;
    name: string;
    body: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface MessageTemplatePayload {
    code?: string | null;
    name: string;
    body: string;
    active?: boolean;
}

export interface CommunicationPreviewPayload {
    studentId: string;
    representativeId: string;
    templateId: string;
    includeFinancialInfo?: boolean;
    financialNote?: string | null;
}

export interface CommunicationPayload extends CommunicationPreviewPayload {
    saveAsDraft?: boolean;
}

export interface CommunicationPreview {
    studentId: string;
    studentName: string;
    representativeId: string;
    representativeName: string;
    templateId: string;
    templateName: string;
    phone: string;
    waPhone: string;
    messageBody: string;
    waLink: string;
    includeFinancialInfo: boolean;
    financialNote: string | null;
    warnings: string[];
}

export interface Communication {
    id: string;
    studentId: string;
    studentName: string;
    representativeId: string;
    representativeName: string;
    templateId: string | null;
    templateName: string;
    phone: string;
    waPhone: string;
    messageBody: string;
    waLink: string;
    status: CommunicationStatus;
    includeFinancialInfo: boolean;
    financialNote: string | null;
    openedAt: string | null;
    failedReason: string | null;
    createdByEmail: string | null;
    createdAt: string;
    updatedAt: string;
}

export const COMMUNICATION_STATUS_LABELS: Record<CommunicationStatus, string> = {
    DRAFT: 'Borrador',
    READY: 'Preparada',
    OPENED: 'Abierta en WhatsApp',
    FAILED: 'Fallida'
};
