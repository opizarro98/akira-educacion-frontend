import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap } from 'rxjs';

import { AuthService } from 'src/app/core/services/auth.service';
import { UserApiService } from 'src/app/core/services/user-api.service';
import { INSTITUTION_ROLE_LABELS, UserSummary } from 'src/app/core/models/user.models';

@Component({
    selector: 'app-user-list',
    imports: [CommonModule, FormsModule],
    templateUrl: './user-list.component.html'
})
export class UserListComponent implements OnInit {
    private readonly api = inject(UserApiService);
    private readonly auth = inject(AuthService);

    readonly users = signal<UserSummary[]>([]);
    readonly totalElements = signal(0);
    readonly totalPages = signal(0);
    readonly page = signal(0);
    readonly pageSize = 10;

    readonly loading = signal(false);
    readonly saving = signal(false);
    readonly error = signal('');
    readonly success = signal('');

    readonly search = signal('');
    readonly appliedSearch = signal('');

    readonly canManage = computed(() => this.auth.hasPermission('USER_WRITE'));
    readonly isSelf = computed(() => {
        const id = this.editingId();
        return id !== null && id === this.auth.user()?.id;
    });

    readonly assignableRoles = signal<string[]>([]);
    readonly roleLabels = INSTITUTION_ROLE_LABELS;

    readonly formOpen = signal(false);
    readonly editingId = signal<string | null>(null);
    readonly email = signal('');
    readonly fullName = signal('');
    readonly password = signal('');
    readonly selectedRoles = signal<string[]>([]);

    readonly resetTarget = signal<UserSummary | null>(null);
    readonly resetPasswordValue = signal('');

    ngOnInit(): void {
        this.loadRoles();
        this.load(0);
    }

    loadRoles(): void {
        this.api.assignableRoles().subscribe({
            next: (roles) => this.assignableRoles.set(roles),
            error: (error: Error) => this.error.set(error.message)
        });
    }

    load(page: number): void {
        this.loading.set(true);
        this.error.set('');
        this.api.list(this.appliedSearch() || null, page, this.pageSize).subscribe({
            next: (response) => {
                this.users.set(response.content);
                this.totalElements.set(response.totalElements);
                this.totalPages.set(response.totalPages);
                this.page.set(response.page);
                this.loading.set(false);
            },
            error: (error: Error) => {
                this.error.set(error.message);
                this.loading.set(false);
            }
        });
    }

    applyFilters(): void {
        this.appliedSearch.set(this.search().trim());
        this.load(0);
    }

    openCreate(): void {
        this.error.set('');
        this.success.set('');
        this.formOpen.set(true);
        this.editingId.set(null);
        this.email.set('');
        this.fullName.set('');
        this.password.set('');
        this.selectedRoles.set(['SECRETARY']);
    }

    openEdit(user: UserSummary): void {
        this.error.set('');
        this.success.set('');
        this.formOpen.set(true);
        this.editingId.set(user.id);
        this.email.set(user.email);
        this.fullName.set(user.fullName);
        this.password.set('');
        this.selectedRoles.set([...user.roles]);
    }

    cancelForm(): void {
        this.formOpen.set(false);
        this.editingId.set(null);
        this.password.set('');
    }

    toggleRole(code: string): void {
        const current = this.selectedRoles();
        this.selectedRoles.set(
            current.includes(code) ? current.filter((role) => role !== code) : [...current, code]
        );
    }

    save(): void {
        this.error.set('');
        this.success.set('');
        const roles = this.selectedRoles();
        if (roles.length === 0) {
            this.error.set('Debe seleccionar al menos un rol.');
            return;
        }

        this.saving.set(true);
        const editingId = this.editingId();
        if (editingId) {
            this.api
                .update(editingId, { email: this.email().trim(), fullName: this.fullName().trim() })
                .pipe(switchMap(() => this.api.updateRoles(editingId, roles)))
                .subscribe({
                    next: () => {
                        this.saving.set(false);
                        this.success.set('Usuario actualizado.');
                        this.cancelForm();
                        this.load(this.page());
                    },
                    error: (error: Error) => {
                        this.saving.set(false);
                        this.error.set(error.message);
                    }
                });
            return;
        }

        this.api
            .create({
                email: this.email().trim(),
                fullName: this.fullName().trim(),
                password: this.password(),
                roles
            })
            .subscribe({
                next: () => {
                    this.saving.set(false);
                    this.success.set('Usuario creado.');
                    this.cancelForm();
                    this.load(0);
                },
                error: (error: Error) => {
                    this.saving.set(false);
                    this.error.set(error.message);
                }
            });
    }

    toggleStatus(user: UserSummary): void {
        const action = user.active ? 'desactivar' : 'activar';
        if (!window.confirm(`¿Desea ${action} a ${user.fullName}?`)) {
            return;
        }
        this.error.set('');
        this.success.set('');
        this.api.updateStatus(user.id, !user.active).subscribe({
            next: () => {
                this.success.set(`Usuario ${user.active ? 'desactivado' : 'activado'}.`);
                this.load(this.page());
            },
            error: (error: Error) => this.error.set(error.message)
        });
    }

    startReset(user: UserSummary): void {
        this.error.set('');
        this.success.set('');
        this.resetTarget.set(user);
        this.resetPasswordValue.set('');
    }

    cancelReset(): void {
        this.resetTarget.set(null);
        this.resetPasswordValue.set('');
    }

    submitReset(): void {
        const target = this.resetTarget();
        if (!target) {
            return;
        }
        const value = this.resetPasswordValue();
        if (value.length < 8) {
            this.error.set('La contraseña temporal debe tener al menos 8 caracteres.');
            return;
        }
        this.api.resetPassword(target.id, value).subscribe({
            next: () => {
                this.success.set('Contraseña restablecida. Comuníquela por un canal seguro.');
                this.cancelReset();
            },
            error: (error: Error) => this.error.set(error.message)
        });
    }

    roleLabel(code: string): string {
        return this.roleLabels[code] ?? code;
    }

    previousPage(): void {
        if (this.page() > 0) {
            this.load(this.page() - 1);
        }
    }

    nextPage(): void {
        if (this.page() + 1 < this.totalPages()) {
            this.load(this.page() + 1);
        }
    }
}
