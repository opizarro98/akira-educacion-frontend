import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { CommunicationApiService } from 'src/app/core/services/communication-api.service';
import { MessageTemplate } from 'src/app/core/models/communication.models';

@Component({
    selector: 'app-communication-templates',
    imports: [CommonModule, ReactiveFormsModule, RouterLink],
    templateUrl: './communication-templates.component.html'
})
export class CommunicationTemplatesComponent implements OnInit {
    private readonly api = inject(CommunicationApiService);
    private readonly auth = inject(AuthService);
    private readonly formBuilder = inject(FormBuilder);

    readonly templates = signal<MessageTemplate[]>([]);
    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly success = signal('');
    readonly editingId = signal<string | null>(null);

    readonly canWrite = computed(() => this.auth.hasPermission('MESSAGE_TEMPLATE_WRITE'));

    readonly placeholders = [
        '{{estudiante}}',
        '{{representante}}',
        '{{institucion}}',
        '{{fecha}}',
        '{{detalle_financiero}}'
    ];

    readonly form = this.formBuilder.nonNullable.group({
        code: [''],
        name: ['', [Validators.required, Validators.maxLength(150)]],
        body: ['', [Validators.required, Validators.maxLength(4000)]],
        active: [true]
    });

    ngOnInit(): void {
        this.load();
    }

    load(): void {
        this.loading.set(true);
        this.error.set('');
        this.api.listTemplates().subscribe({
            next: (templates) => {
                this.templates.set(templates);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
    }

    edit(template: MessageTemplate): void {
        this.editingId.set(template.id);
        this.form.reset({
            code: template.code ?? '',
            name: template.name,
            body: template.body,
            active: template.active
        });
        this.success.set('');
    }

    cancel(): void {
        this.editingId.set(null);
        this.form.reset({ code: '', name: '', body: '', active: true });
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
            body: value.body.trim(),
            active: value.active
        };

        this.saving.set(true);
        const request = this.editingId()
            ? this.api.updateTemplate(this.editingId()!, payload)
            : this.api.createTemplate(payload);

        request.subscribe({
            next: () => {
                this.saving.set(false);
                this.success.set(this.editingId() ? 'Plantilla actualizada.' : 'Plantilla creada.');
                this.cancel();
                this.load();
            },
            error: (err: Error) => {
                this.saving.set(false);
                this.error.set(err.message);
            }
        });
    }

    toggleActive(template: MessageTemplate): void {
        if (!this.canWrite()) {
            return;
        }
        this.api
            .updateTemplate(template.id, {
                code: template.code,
                name: template.name,
                body: template.body,
                active: !template.active
            })
            .subscribe({
                next: () => this.load(),
                error: (err: Error) => this.error.set(err.message)
            });
    }

    insertPlaceholder(placeholder: string): void {
        const current = this.form.controls.body.value;
        this.form.controls.body.setValue(current ? `${current} ${placeholder}` : placeholder);
    }
}
