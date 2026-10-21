export type StudentStatus = 'PRE_REGISTERED' | 'ACTIVE' | 'WITHDRAWN' | 'GRADUATED';

export type EnrollmentStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

export interface Student {
    id: string;
    firstName: string;
    lastName: string;
    documentType: string | null;
    documentNumber: string | null;
    birthDate: string | null;
    admissionDate: string;
    status: StudentStatus;
    email: string | null;
    phone: string | null;
    address: string | null;
    notes: string | null;
    notesRestricted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface StudentPayload {
    firstName: string;
    lastName: string;
    documentType?: string | null;
    documentNumber?: string | null;
    birthDate?: string | null;
    admissionDate: string;
    status?: StudentStatus;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    notes?: string | null;
}

export interface Representative {
    id: string;
    fullName: string;
    documentNumber: string | null;
    phone: string | null;
    email: string | null;
    relationship: string | null;
    notes: string | null;
    studentCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface RepresentativePayload {
    fullName: string;
    documentNumber?: string | null;
    phone?: string | null;
    email?: string | null;
    relationship?: string | null;
    notes?: string | null;
}

export interface StudentRepresentative {
    linkId: string;
    representativeId: string;
    fullName: string;
    documentNumber: string | null;
    phone: string | null;
    email: string | null;
    relationship: string | null;
    primaryContact: boolean;
    authorizedForCommunications: boolean;
    authorizedForBilling: boolean;
}

export interface LinkRepresentativePayload {
    representativeId?: string | null;
    newRepresentative?: RepresentativePayload | null;
    primaryContact?: boolean;
    authorizedForCommunications?: boolean;
    authorizedForBilling?: boolean;
}

export interface RepresentativeStudent {
    studentId: string;
    fullName: string;
    documentNumber: string | null;
    status: StudentStatus;
    primaryContact: boolean;
    authorizedForCommunications: boolean;
    authorizedForBilling: boolean;
}

export interface EducationalLevel {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    sortOrder: number;
    active: boolean;
}

export interface AcademicPeriod {
    id: string;
    name: string;
    startDate: string;
    endDate: string;
    active: boolean;
}

export interface CatalogService {
    id: string;
    name: string;
    code: string | null;
    description: string | null;
    active: boolean;
}

export interface PlanServiceRef {
    id: string;
    name: string;
    code: string | null;
}

export interface Plan {
    id: string;
    name: string;
    description: string | null;
    active: boolean;
    services: PlanServiceRef[];
}

export interface ServiceRate {
    id: string;
    serviceId: string;
    serviceName: string;
    amount: number;
    validFrom: string;
    validTo: string | null;
    active: boolean;
}

export interface EnrollmentServiceLine {
    id: string;
    serviceId: string;
    serviceName: string;
    quantity: number;
    agreedPrice: number;
    lineTotal: number;
}

export interface Enrollment {
    id: string;
    studentId: string;
    studentName: string;
    educationalLevelId: string;
    educationalLevelName: string;
    planId: string | null;
    planName: string | null;
    academicPeriodId: string | null;
    academicPeriodName: string | null;
    startDate: string;
    endDate: string | null;
    agreedPrice: number;
    servicesTotal: number;
    subtotal: number;
    vatRate: number | null;
    vatAmount: number | null;
    totalAmount: number | null;
    status: EnrollmentStatus;
    cancellationReason: string | null;
    notes: string | null;
    confirmedAt: string | null;
    cancelledAt: string | null;
    completedAt: string | null;
    services: EnrollmentServiceLine[];
    createdAt: string;
    updatedAt: string;
}

export interface EnrollmentPayload {
    studentId: string;
    educationalLevelId: string;
    planId?: string | null;
    academicPeriodId?: string | null;
    startDate: string;
    endDate?: string | null;
    agreedPrice: number;
    notes?: string | null;
    services?: { serviceId: string; agreedPrice: number; quantity: number }[];
}

export interface EnrollmentHistoryEntry {
    id: string;
    action: string;
    fromStatus: EnrollmentStatus | null;
    toStatus: EnrollmentStatus | null;
    reason: string | null;
    actorEmail: string | null;
    occurredAt: string;
}

export const STUDENT_STATUS_LABELS: Record<StudentStatus, string> = {
    PRE_REGISTERED: 'Preinscrito',
    ACTIVE: 'Activo',
    WITHDRAWN: 'Retirado',
    GRADUATED: 'Graduado'
};

export const ENROLLMENT_STATUS_LABELS: Record<EnrollmentStatus, string> = {
    DRAFT: 'Borrador',
    CONFIRMED: 'Confirmada',
    CANCELLED: 'Cancelada',
    COMPLETED: 'Completada'
};
