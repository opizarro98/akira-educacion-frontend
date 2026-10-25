import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';

import { AuthService } from 'src/app/core/services/auth.service';
import { BillingApiService } from 'src/app/core/services/billing-api.service';
import { PaymentApiService } from 'src/app/core/services/payment-api.service';
import {
    PAYMENT_METHOD_LABELS,
    PAYMENT_STATUS_LABELS,
    Payment,
    PaymentHistoryEntry,
    PaymentMethod
} from 'src/app/core/models/payment.models';
import { ChargeSummary } from 'src/app/core/models/billing.models';

interface AllocationRow {
    chargeId: string;
    description: string;
    issueDate: string;
    balance: number;
    selected: boolean;
    amount: number;
}

@Component({
    selector: 'app-payment-detail',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink],
    templateUrl: './payment-detail.component.html'
})
export class PaymentDetailComponent implements OnInit {
    private readonly api = inject(PaymentApiService);
    private readonly billingApi = inject(BillingApiService);
    private readonly auth = inject(AuthService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);

    readonly paymentId = signal('');
    readonly payment = signal<Payment | null>(null);
    readonly history = signal<PaymentHistoryEntry[]>([]);
    readonly allocationRows = signal<AllocationRow[]>([]);
    readonly allocationKey = signal(this.newKey());

    readonly loading = signal(false);
    readonly working = signal(false);
    readonly error = signal('');
    readonly success = signal('');
    readonly showVoid = signal(false);
    readonly reversingId = signal<string | null>(null);

    readonly canVerify = computed(() => this.auth.hasPermission('PAYMENT_VERIFY'));
    readonly canApply = computed(() => this.auth.hasPermission('PAYMENT_APPLY'));
    readonly canVoid = computed(() => this.auth.hasPermission('PAYMENT_VOID'));

    readonly voidForm = this.formBuilder.nonNullable.group({
        reason: ['', [Validators.required, Validators.maxLength(500)]]
    });

    readonly reversalForm = this.formBuilder.nonNullable.group({
        reason: ['', [Validators.required, Validators.maxLength(500)]]
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        this.paymentId.set(id);
        this.load();
    }

    load(): void {
        const id = this.paymentId();
        if (!id) {
            return;
        }
        this.loading.set(true);
        this.error.set('');
        this.api.get(id).subscribe({
            next: (payment) => {
                this.payment.set(payment);
                this.loading.set(false);
                if (payment.status === 'CONFIRMED' && this.canApply()) {
                    this.loadCharges(payment.studentId);
                }
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
        this.api.history(id).subscribe({
            next: (entries) => this.history.set(entries),
            error: () => this.history.set([])
        });
    }

    confirmPayment(): void {
        if (!window.confirm('¿Confirmar este pago? Se emitirá su recibo interno y el dinero quedará disponible.')) {
            return;
        }
        this.runAction(this.api.confirm(this.paymentId()), 'Pago confirmado y recibo emitido.');
    }

    voidPayment(): void {
        if (!window.confirm('¿Anular este pago? La acción es definitiva y quedará auditada.')) {
            return;
        }
        if (this.voidForm.invalid) {
            this.voidForm.markAllAsTouched();
            return;
        }
        const reason = this.voidForm.getRawValue().reason.trim();
        this.runAction(this.api.voidPayment(this.paymentId(), reason), 'Pago anulado.', () => {
            this.showVoid.set(false);
            this.voidForm.reset({ reason: '' });
        });
    }

    toggleRow(row: AllocationRow, selected: boolean): void {
        row.selected = selected;
        if (selected && row.amount <= 0) {
            row.amount = Math.min(row.balance, this.availableForAllocation());
        }
        this.allocationRows.update((rows) => [...rows]);
    }

    updateAmount(row: AllocationRow, value: number): void {
        row.amount = Number(value) || 0;
        this.allocationRows.update((rows) => [...rows]);
    }

    selectedTotal(): number {
        return round2(
            this.allocationRows()
                .filter((row) => row.selected)
                .reduce((sum, row) => sum + Number(row.amount || 0), 0)
        );
    }

    availableForAllocation(): number {
        return Number(this.payment()?.availableAmount ?? 0);
    }

    canSubmitAllocations(): boolean {
        const total = this.selectedTotal();
        const available = this.availableForAllocation();
        const rows = this.allocationRows().filter((row) => row.selected);
        return (
            total > 0 &&
            total <= available &&
            rows.every((row) => Number(row.amount) > 0 && Number(row.amount) <= row.balance)
        );
    }

    applyAllocations(): void {
        this.error.set('');
        this.success.set('');
        const selected = this.allocationRows().filter((row) => row.selected);
        if (selected.length === 0) {
            this.error.set('Seleccione al menos una obligación.');
            return;
        }
        if (!this.canSubmitAllocations()) {
            this.error.set('Revise los importes: no deben superar el saldo de la obligación ni el disponible del pago.');
            return;
        }
        if (!window.confirm('¿Aplicar el pago a las obligaciones seleccionadas? Esta acción actualizará sus saldos.')) {
            return;
        }

        this.working.set(true);
        this.api
            .applyAllocations(this.paymentId(), {
                idempotencyKey: this.allocationKey(),
                allocations: selected.map((row) => ({
                    chargeId: row.chargeId,
                    amount: round2(Number(row.amount))
                }))
            })
            .subscribe({
                next: () => {
                    this.working.set(false);
                    this.allocationKey.set(this.newKey());
                    this.success.set('Pago aplicado correctamente.');
                    this.load();
                },
                error: (err: Error) => {
                    this.working.set(false);
                    this.error.set(err.message);
                }
            });
    }

    startReverse(allocationId: string): void {
        this.reversingId.set(allocationId);
        this.reversalForm.reset({ reason: '' });
    }

    cancelReverse(): void {
        this.reversingId.set(null);
    }

    reverseAllocation(): void {
        if (!window.confirm('¿Revertir esta aplicación? El saldo de la obligación será restaurado.')) {
            return;
        }
        if (this.reversalForm.invalid) {
            this.reversalForm.markAllAsTouched();
            return;
        }
        const allocationId = this.reversingId();
        if (!allocationId) {
            return;
        }
        const reason = this.reversalForm.getRawValue().reason.trim();
        this.working.set(true);
        this.api.reverseAllocation(this.paymentId(), allocationId, reason).subscribe({
            next: () => {
                this.working.set(false);
                this.reversingId.set(null);
                this.success.set('Aplicación revertida y saldo restaurado.');
                this.load();
            },
            error: (err: Error) => {
                this.working.set(false);
                this.error.set(err.message);
            }
        });
    }

    hasAppliedAmount(): boolean {
        return Number(this.payment()?.appliedAmount ?? 0) > 0;
    }

    statusLabel(status: string): string {
        return PAYMENT_STATUS_LABELS[status as keyof typeof PAYMENT_STATUS_LABELS] ?? status;
    }

    methodLabel(method: string): string {
        return PAYMENT_METHOD_LABELS[method as PaymentMethod] ?? method;
    }

    statusClass(status: string): string {
        switch (status) {
            case 'CONFIRMED':
                return 'bg-light-success';
            case 'VOID':
                return 'bg-light-danger';
            default:
                return 'bg-light-warning';
        }
    }

    private loadCharges(studentId: string): void {
        this.billingApi.listCharges({ studentId, page: 0, size: 100 }).subscribe({
            next: (response) => {
                this.allocationRows.set(
                    response.content
                        .filter((charge) => charge.status === 'PENDING' || charge.status === 'PARTIAL')
                        .filter((charge) => Number(charge.balance) > 0)
                        .map((charge) => this.toRow(charge))
                );
            },
            error: () => this.allocationRows.set([])
        });
    }

    private toRow(charge: ChargeSummary): AllocationRow {
        return {
            chargeId: charge.id,
            description: charge.description || 'Obligación de cobro',
            issueDate: charge.issueDate,
            balance: Number(charge.balance),
            selected: false,
            amount: 0
        };
    }

    private runAction(request: Observable<unknown>, message: string, after?: () => void): void {
        this.error.set('');
        this.success.set('');
        this.working.set(true);
        request.subscribe({
            next: () => {
                this.working.set(false);
                after?.();
                this.success.set(message);
                this.load();
            },
            error: (err: Error) => {
                this.working.set(false);
                this.error.set(err.message);
            }
        });
    }

    private newKey(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return `allocation-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}

function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
