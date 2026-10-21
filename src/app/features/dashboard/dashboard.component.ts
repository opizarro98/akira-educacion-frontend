import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { AuthService } from 'src/app/core/services/auth.service';
import { InstitutionApiService } from 'src/app/core/services/institution-api.service';
import { Institution } from 'src/app/core/models/auth.models';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, RouterModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
    private readonly authService = inject(AuthService);
    private readonly institutionApi = inject(InstitutionApiService);

    readonly auth = this.authService;
    readonly loading = signal(false);
    readonly error = signal('');
    readonly institution = signal<Institution | null>(null);

    constructor() {
        if (!this.authService.isPlatformAdmin()) {
            this.loading.set(true);
            this.institutionApi.getMine().subscribe({
                next: (institution) => {
                    this.institution.set(institution);
                    this.loading.set(false);
                },
                error: (err: Error) => {
                    this.error.set(err.message);
                    this.loading.set(false);
                }
            });
        }
    }
}
