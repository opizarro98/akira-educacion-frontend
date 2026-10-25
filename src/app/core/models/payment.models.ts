export type PaymentStatus = 'PENDING_VERIFICATION' | 'CONFIRMED' | 'VOID';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER';

export interface PaymentAllocation {
    id: string;
    paymentId: string;
    chargeId: string;
    chargeDescription: string | null;
    chargeStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'VOID';
    amount: number;
    reversed: boolean;
    reversedAt: string | null;
    reversedBy: string | null;
    reversalReason: string | null;
    createdAt: string;
}

export interface Receipt {
    id: string;
    receiptNumber: string;
    sequenceNumber: number;
    paymentId: string;
    studentId: string;
    studentName: string;
    amount: number;
    currency: string;
    issuedAt: string;
    issuedByEmail: string | null;
    voided: boolean;
    voidReason: string | null;
    voidedAt: string | null;
    paymentMethod: PaymentMethod;
    paymentReference: string | null;
    paymentStatus: PaymentStatus;
    paymentReceivedDate: string;
}

export interface PaymentSummary {
    id: string;
    studentId: string;
    studentName: string;
    amount: number;
    currency: string;
    method: PaymentMethod;
    reference: string | null;
    receivedDate: string;
    status: PaymentStatus;
    appliedAmount: number;
    availableAmount: number;
    createdAt: string;
}

export interface Payment extends PaymentSummary {
    registeredByEmail: string | null;
    confirmedByEmail: string | null;
    confirmedAt: string | null;
    notes: string | null;
    idempotencyKey: string | null;
    voidReason: string | null;
    voidedAt: string | null;
    voidedBy: string | null;
    updatedAt: string;
    allocations: PaymentAllocation[];
    receipt: Receipt | null;
}

export interface RegisterPaymentPayload {
    studentId: string;
    amount: number;
    method: PaymentMethod;
    reference?: string | null;
    receivedDate?: string | null;
    notes?: string | null;
    idempotencyKey?: string | null;
}

export interface PaymentHistoryEntry {
    id: string;
    action: string;
    details: string | null;
    reason: string | null;
    actorEmail: string | null;
    occurredAt: string;
}

export interface AllocationItemPayload {
    chargeId: string;
    amount: number;
}

export interface ApplyAllocationsPayload {
    allocations: AllocationItemPayload[];
    idempotencyKey?: string | null;
}

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
    PENDING_VERIFICATION: 'Pendiente de verificación',
    CONFIRMED: 'Confirmado',
    VOID: 'Anulado'
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: 'Efectivo',
    BANK_TRANSFER: 'Transferencia bancaria'
};
