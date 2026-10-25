import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { BillingApiService } from 'src/app/core/services/billing-api.service';
import {
    CHARGE_ORIGIN_LABELS,
    CHARGE_STATUS_LABELS,
    Charge,
    ChargeBalance,
    ChargeHistoryEntry
} from 'src/app/core/models/billing.models';

@Component({
    selector: 'app-charge-detail',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './charge-detail.component.html'
})
export class ChargeDetailComponent implements OnInit {
    private readonly api = inject(BillingApiService);
    private readonly auth = inject(AuthService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly route = inject(ActivatedRoute);

    readonly chargeId = signal('');
    readonly charge = signal<Charge | null>(null);
    readonly balance = signal<ChargeBalance | null>(null);
    readonly history = signal<ChargeHistoryEntry[]>([]);

    readonly loading = signal(false);
    readonly working = signal(false);
    readonly error = signal('');
    readonly success = signal('');
    readonly showVoid = signal(false);

    readonly canWrite = computed(() => this.auth.hasPermission('CHARGE_WRITE'));

    readonly voidForm = this.formBuilder.nonNullable.group({
        reason: ['', [Validators.required, Validators.maxLength(500)]]
    });

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        this.chargeId.set(id);
        this.load();
    }

    load(): void {
        const id = this.chargeId();
        if (!id) {
            return;
        }
        this.loading.set(true);
        this.error.set('');
        this.api.getCharge(id).subscribe({
            next: (charge) => {
                this.charge.set(charge);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
        this.api.getBalance(id).subscribe({
            next: (balance) => this.balance.set(balance),
            error: () => this.balance.set(null)
        });
        this.api.getHistory(id).subscribe({
            next: (entries) => this.history.set(entries),
            error: () => this.history.set([])
        });
    }

    voidCharge(): void {
        if (!window.confirm('¿Anular esta obligación? La acción queda registrada en el historial y no se puede revertir.')) {
            return;
        }
        if (this.voidForm.invalid) {
            this.voidForm.markAllAsTouched();
            return;
        }
        const reason = this.voidForm.getRawValue().reason.trim();
        this.working.set(true);
        this.api.voidCharge(this.chargeId(), reason).subscribe({
            next: () => {
                this.working.set(false);
                this.showVoid.set(false);
                this.voidForm.reset({ reason: '' });
                this.success.set('Obligación anulada.');
                this.load();
            },
            error: (err: Error) => {
                this.working.set(false);
                this.error.set(err.message);
            }
        });
    }

    statusLabel(status: string): string {
        return CHARGE_STATUS_LABELS[status as keyof typeof CHARGE_STATUS_LABELS] ?? status;
    }

    statusClass(status: string): string {
        switch (status) {
            case 'PAID':
                return 'bg-light-success';
            case 'PARTIAL':
                return 'bg-light-primary';
            case 'VOID':
                return 'bg-light-danger';
            default:
                return 'bg-light-warning';
        }
    }

    originLabel(origin: string): string {
        return CHARGE_ORIGIN_LABELS[origin as keyof typeof CHARGE_ORIGIN_LABELS] ?? origin;
    }

    canVoid(): boolean {
        const current = this.charge();
        return !!current && this.canWrite() && current.status !== 'VOID' && Number(current.paidAmount) === 0;
    }
}
