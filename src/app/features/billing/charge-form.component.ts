import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { BillingApiService } from 'src/app/core/services/billing-api.service';
import { InstitutionApiService } from 'src/app/core/services/institution-api.service';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import { BillingConcept, ChargePayload } from 'src/app/core/models/billing.models';
import { Institution } from 'src/app/core/models/auth.models';
import { Student } from 'src/app/core/models/school.models';

@Component({
    selector: 'app-charge-form',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './charge-form.component.html'
})
export class ChargeFormComponent implements OnInit {
    private readonly api = inject(BillingApiService);
    private readonly institutionApi = inject(InstitutionApiService);
    private readonly studentApi = inject(StudentApiService);
    private readonly formBuilder = inject(FormBuilder);
    private readonly router = inject(Router);

    readonly students = signal<Student[]>([]);
    readonly concepts = signal<BillingConcept[]>([]);
    readonly institution = signal<Institution | null>(null);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly idempotencyKey = signal(this.newKey());

    readonly itemsArray: FormArray = this.formBuilder.array([]);

    readonly form = this.formBuilder.nonNullable.group({
        studentId: ['', [Validators.required]],
        issueDate: [today(), [Validators.required]],
        dueDate: [today(), [Validators.required]],
        description: [''],
        items: this.itemsArray
    });

    ngOnInit(): void {
        this.studentApi.list(null, 'ACTIVE', 0, 200).subscribe({
            next: (response) => this.students.set(response.content),
            error: (err: Error) => this.error.set(err.message)
        });
        this.api.listConcepts().subscribe({
            next: (concepts) => this.concepts.set(concepts.filter((concept) => concept.active)),
            error: (err: Error) => this.error.set(err.message)
        });
        this.institutionApi.getMine().subscribe({
            next: (institution) => this.institution.set(institution),
            error: () => this.institution.set(null)
        });
        this.addItem();
    }

    addItem(): void {
        this.itemsArray.push(
            this.formBuilder.nonNullable.group({
                conceptId: ['', [Validators.required]],
                description: [''],
                quantity: [1, [Validators.required, Validators.min(1)]],
                unitPrice: [0, [Validators.required, Validators.min(0)]],
                discount: [0, [Validators.min(0)]]
            })
        );
    }

    removeItem(index: number): void {
        if (this.itemsArray.length > 1) {
            this.itemsArray.removeAt(index);
        }
    }

    onConceptSelected(index: number): void {
        const group = this.itemsArray.at(index) as FormGroup;
        const conceptId = String(group.get('conceptId')?.value ?? '');
        const concept = this.concepts().find((item) => item.id === conceptId);
        if (concept) {
            group.get('unitPrice')?.setValue(concept.defaultAmount);
            if (!group.get('description')?.value) {
                group.get('description')?.setValue(concept.name);
            }
        }
    }

    vatRate(): number {
        const institution = this.institution();
        if (!institution || !institution.vatEnabled || institution.vatRate === null) {
            return 0;
        }
        if (institution.vatEffectiveFrom && institution.vatEffectiveFrom > today()) {
            return 0;
        }
        return Number(institution.vatRate);
    }

    subtotalPreview(): number {
        return round2(
            this.itemsArray.getRawValue().reduce((sum: number, item: {
                quantity: number;
                unitPrice: number;
                discount: number;
            }) => {
                const gross = Number(item.quantity || 0) * Number(item.unitPrice || 0);
                const discount = Number(item.discount || 0);
                return sum + Math.max(0, gross - discount);
            }, 0)
        );
    }

    taxPreview(): number {
        return round2((this.subtotalPreview() * this.vatRate()) / 100);
    }

    totalPreview(): number {
        return round2(this.subtotalPreview() + this.taxPreview());
    }

    save(): void {
        this.error.set('');
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        const value = this.form.getRawValue();
        if (value.dueDate < value.issueDate) {
            this.error.set('La fecha de vencimiento no puede ser anterior a la de emisión.');
            return;
        }

        const items = (this.itemsArray.getRawValue() as {
            conceptId: string;
            description: string;
            quantity: number;
            unitPrice: number;
            discount: number;
        }[])
            .filter((item) => item.conceptId)
            .map((item) => ({
                conceptId: item.conceptId,
                description: item.description || null,
                quantity: Number(item.quantity) || 1,
                unitPrice: Number(item.unitPrice) || 0,
                discount: Number(item.discount) || 0
            }));

        if (items.length === 0) {
            this.error.set('Agregue al menos un detalle con concepto.');
            return;
        }

        const payload: ChargePayload = {
            studentId: value.studentId,
            issueDate: value.issueDate,
            dueDate: value.dueDate,
            description: value.description || null,
            idempotencyKey: this.idempotencyKey(),
            items
        };

        this.saving.set(true);
        this.api.createCharge(payload).subscribe({
            next: (charge) => {
                this.saving.set(false);
                void this.router.navigate(['/billing/charges', charge.id]);
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }

    private newKey(): string {
        if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            return crypto.randomUUID();
        }
        return `manual-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    }
}

function today(): string {
    return new Date().toISOString().slice(0, 10);
}

function round2(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
