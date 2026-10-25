import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { PaymentApiService } from 'src/app/core/services/payment-api.service';
import {
    PAYMENT_METHOD_LABELS,
    PaymentMethod,
    Receipt
} from 'src/app/core/models/payment.models';

@Component({
    selector: 'app-receipt-detail',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './receipt-detail.component.html'
})
export class ReceiptDetailComponent implements OnInit {
    private readonly api = inject(PaymentApiService);
    private readonly route = inject(ActivatedRoute);

    readonly receipt = signal<Receipt | null>(null);
    readonly loading = signal(false);
    readonly error = signal('');

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id') ?? '';
        this.loading.set(true);
        this.api.getReceipt(id).subscribe({
            next: (receipt) => {
                this.receipt.set(receipt);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
    }

    methodLabel(method: PaymentMethod): string {
        return PAYMENT_METHOD_LABELS[method];
    }

    print(): void {
        window.print();
    }
}
