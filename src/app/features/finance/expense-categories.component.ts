import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { FinanceApiService } from 'src/app/core/services/finance-api.service';
import { ExpenseCategory } from 'src/app/core/models/finance.models';

@Component({
    selector: 'app-expense-categories',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './expense-categories.component.html'
})
export class ExpenseCategoriesComponent implements OnInit {
    private readonly api = inject(FinanceApiService);
    private readonly auth = inject(AuthService);
    private readonly formBuilder = inject(FormBuilder);

    readonly categories = signal<ExpenseCategory[]>([]);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly success = signal('');
    readonly editingId = signal<string | null>(null);

    readonly canWrite = computed(() => this.auth.hasPermission('EXPENSE_CATEGORY_WRITE'));

    readonly form = this.formBuilder.nonNullable.group({
        code: [''],
        name: ['', [Validators.required, Validators.maxLength(150)]],
        description: [''],
        active: [true]
    });

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.error.set('');
        this.api.listCategories().subscribe({
            next: (categories) => {
                this.categories.set(categories);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
    }

    edit(category: ExpenseCategory): void {
        this.editingId.set(category.id);
        this.form.reset({
            code: category.code ?? '',
            name: category.name,
            description: category.description ?? '',
            active: category.active
        });
        this.success.set('');
    }

    cancel(): void {
        this.editingId.set(null);
        this.form.reset({ code: '', name: '', description: '', active: true });
    }

    save(): void {
        this.error.set('');
        this.success.set('');
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        const value = this.form.getRawValue();
        const payload = {
            code: value.code.trim() || null,
            name: value.name.trim(),
            description: value.description.trim() || null,
            active: value.active
        };

        this.saving.set(true);
        const request = this.editingId()
            ? this.api.updateCategory(this.editingId()!, payload)
            : this.api.createCategory(payload);

        request.subscribe({
            next: () => {
                this.saving.set(false);
                this.success.set(this.editingId() ? 'Categoría actualizada.' : 'Categoría creada.');
                this.cancel();
                this.load();
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }

    toggleActive(category: ExpenseCategory): void {
        if (!this.canWrite()) {
            return;
        }
        this.api
            .updateCategory(category.id, {
                code: category.code,
                name: category.name,
                description: category.description,
                active: !category.active
            })
            .subscribe({
                next: () => this.load(),
                error: (err: Error) => this.error.set(err.message)
            });
    }
}
