import { PaymentMethod } from './payment.models';

export type ExpenseStatus = 'DRAFT' | 'CONFIRMED' | 'VOID';
export type CashMovementType =
    | 'PAYMENT_IN'
    | 'EXPENSE_OUT'
    | 'PAYMENT_VOID_REVERSAL'
    | 'EXPENSE_VOID_REVERSAL';
export type CashMovementSource = 'PAYMENT' | 'EXPENSE';

export interface ExpenseCategory {
    id: string;
    code: string | null;
    name: string;
    description: string | null;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ExpenseCategoryPayload {
    code?: string | null;
    name: string;
    description?: string | null;
    active?: boolean;
}

export interface ExpenseSummary {
    id: string;
    categoryName: string;
    expenseDate: string;
    description: string;
    method: PaymentMethod;
    beneficiary: string | null;
    amount: number;
    currency: string;
    status: ExpenseStatus;
    createdAt: string;
}

export interface Expense extends ExpenseSummary {
    categoryId: string;
    reference: string | null;
    responsibleEmail: string | null;
    confirmedAt: string | null;
    confirmedByEmail: string | null;
    voidReason: string | null;
    voidedAt: string | null;
    voidedBy: string | null;
    updatedAt: string;
}

export interface ExpensePayload {
    categoryId: string;
    amount: number;
    currency?: string | null;
    expenseDate: string;
    description: string;
    method: PaymentMethod;
    beneficiary?: string | null;
    reference?: string | null;
}

export interface ExpenseHistoryEntry {
    id: string;
    action: string;
    details: string | null;
    reason: string | null;
    actorEmail: string | null;
    occurredAt: string;
}

export interface CashMovement {
    id: string;
    movementType: CashMovementType;
    sourceType: CashMovementSource;
    sourceId: string;
    amount: number;
    signedAmount: number;
    direction: 'IN' | 'OUT';
    currency: string;
    occurredAt: string;
    description: string | null;
    actorEmail: string | null;
    createdAt: string;
}

export interface ReportHeader {
    institutionId: string;
    institutionName: string;
    fromDate: string;
    toDate: string;
    timezone: string;
    currency: string;
    generatedAt: string;
    includesVoids: boolean;
    accrued: number;
    collected: number;
    difference: number;
}

export interface ReportPaymentRow {
    id: string;
    studentName: string;
    receivedDate: string;
    method: PaymentMethod;
    reference: string | null;
    amount: number;
    currency: string;
    status: string;
    confirmedAt: string | null;
    voidedAt: string | null;
    voidReason: string | null;
}

export interface PaymentMethodTotal {
    method: PaymentMethod;
    count: number;
    amount: number;
}

export interface ConfirmedPaymentsReport {
    header: ReportHeader;
    totalAmount: number;
    paymentCount: number;
    byMethod: PaymentMethodTotal[];
    rows: ReportPaymentRow[];
}

export interface PendingPaymentsReport {
    header: ReportHeader;
    totalAmount: number;
    paymentCount: number;
    rows: ReportPaymentRow[];
}

export interface VoidedPaymentsReport {
    header: ReportHeader;
    totalAmount: number;
    paymentCount: number;
    rows: ReportPaymentRow[];
}

export interface OutstandingChargeRow {
    chargeId: string;
    studentName: string;
    issueDate: string;
    dueDate: string;
    currency: string;
    total: number;
    paidAmount: number;
    balance: number;
    overdue: boolean;
    daysOverdue: number;
}

export interface OutstandingReport {
    header: ReportHeader;
    totalOutstanding: number;
    overdueOutstanding: number;
    outstandingCount: number;
    overdueCount: number;
    rows: OutstandingChargeRow[];
}

export interface ReportExpenseRow {
    id: string;
    categoryName: string;
    expenseDate: string;
    description: string;
    method: PaymentMethod;
    beneficiary: string | null;
    amount: number;
    currency: string;
    status: ExpenseStatus;
}

export interface ExpenseCategoryTotal {
    categoryId: string;
    categoryName: string;
    count: number;
    amount: number;
}

export interface ExpenseReport {
    header: ReportHeader;
    totalAmount: number;
    expenseCount: number;
    byCategory: ExpenseCategoryTotal[];
    rows: ReportExpenseRow[];
}

export interface CashFlowReport {
    header: ReportHeader;
    inflows: number;
    outflows: number;
    net: number;
    movementCount: number;
    movements: CashMovement[];
}

export interface CashSummaryReport {
    header: ReportHeader;
    inflows: number;
    outflows: number;
    net: number;
    movementCount: number;
}

export interface CashSeriesPoint {
    period: string;
    inflows: number;
    outflows: number;
    net: number;
}

export interface Dashboard {
    institutionId: string;
    institutionName: string;
    fromDate: string;
    toDate: string;
    timezone: string;
    currency: string;
    generatedAt: string;
    activeStudents: number;
    confirmedEnrollments: number;
    outstandingTotal: number;
    outstandingCharges: number;
    overdueTotal: number;
    overdueCharges: number;
    confirmedPaymentsAmount: number;
    confirmedPaymentsCount: number;
    expensesAmount: number;
    expensesCount: number;
    cashInflows: number;
    cashOutflows: number;
    cashBalance: number;
    paymentsByMethod: PaymentMethodTotal[];
    expensesByCategory: ExpenseCategoryTotal[];
    cashSeries: CashSeriesPoint[];
}

export const EXPENSE_STATUS_LABELS: Record<ExpenseStatus, string> = {
    DRAFT: 'Borrador',
    CONFIRMED: 'Confirmado',
    VOID: 'Anulado'
};

export const CASH_MOVEMENT_TYPE_LABELS: Record<CashMovementType, string> = {
    PAYMENT_IN: 'Entrada por pago',
    EXPENSE_OUT: 'Salida por egreso',
    PAYMENT_VOID_REVERSAL: 'Reversión de pago anulado',
    EXPENSE_VOID_REVERSAL: 'Reversión de egreso anulado'
};
