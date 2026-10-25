export type ChargeStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'VOID';
export type ChargeOrigin = 'MANUAL' | 'ENROLLMENT' | 'MONTHLY';
export type BillingFrequency = 'MONTHLY' | 'BIMONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME';

export interface BillingConcept {
    id: string;
    code: string | null;
    name: string;
    description: string | null;
    defaultAmount: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface BillingConceptPayload {
    code?: string | null;
    name: string;
    description?: string | null;
    defaultAmount?: number | null;
    active?: boolean;
}

export interface BillingSettings {
    id: string | null;
    frequency: BillingFrequency;
    issueDay: number;
    dueDays: number;
    active: boolean;
    updatedAt: string | null;
}

export interface BillingSettingsPayload {
    frequency: BillingFrequency;
    issueDay: number;
    dueDays: number;
    active?: boolean;
}

export interface ChargeItem {
    id: string;
    conceptId: string | null;
    conceptCode: string | null;
    conceptName: string;
    description: string | null;
    quantity: number;
    unitPrice: number;
    discount: number;
    taxableBase: number;
    vatRate: number;
    vatAmount: number;
    total: number;
}

export interface ChargeSummary {
    id: string;
    studentId: string;
    studentName: string;
    enrollmentId: string | null;
    origin: ChargeOrigin;
    status: ChargeStatus;
    currency: string;
    description: string | null;
    issueDate: string;
    dueDate: string;
    subtotal: number;
    taxAmount: number;
    total: number;
    paidAmount: number;
    balance: number;
    createdAt: string;
}

export interface Charge extends ChargeSummary {
    idempotencyKey: string | null;
    responsibleUserId: string | null;
    responsibleEmail: string | null;
    voidReason: string | null;
    voidedAt: string | null;
    voidedBy: string | null;
    updatedAt: string;
    items: ChargeItem[];
}

export interface ChargeItemPayload {
    conceptId: string;
    description?: string | null;
    quantity: number;
    unitPrice: number;
    discount?: number | null;
}

export interface ChargePayload {
    studentId: string;
    enrollmentId?: string | null;
    issueDate: string;
    dueDate: string;
    description?: string | null;
    idempotencyKey?: string | null;
    items: ChargeItemPayload[];
}

export interface ChargeBalance {
    chargeId: string;
    status: ChargeStatus;
    currency: string;
    total: number;
    paidAmount: number;
    balance: number;
}

export interface ChargeHistoryEntry {
    id: string;
    action: string;
    fromStatus: string | null;
    toStatus: string | null;
    reason: string | null;
    details: string | null;
    actorEmail: string | null;
    occurredAt: string;
}

export interface GenerateMonthlyChargePayload {
    studentId: string;
    conceptId: string;
    period: string;
    amount?: number | null;
    description?: string | null;
}

export const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
    PENDING: 'Pendiente',
    PARTIAL: 'Parcial',
    PAID: 'Pagada',
    VOID: 'Anulada'
};

export const CHARGE_ORIGIN_LABELS: Record<ChargeOrigin, string> = {
    MANUAL: 'Manual',
    ENROLLMENT: 'Cobro inicial',
    MONTHLY: 'Mensual'
};

export const BILLING_FREQUENCY_LABELS: Record<BillingFrequency, string> = {
    MONTHLY: 'Mensual',
    BIMONTHLY: 'Bimestral',
    QUARTERLY: 'Trimestral',
    ANNUAL: 'Anual',
    ONE_TIME: 'Único'
};
