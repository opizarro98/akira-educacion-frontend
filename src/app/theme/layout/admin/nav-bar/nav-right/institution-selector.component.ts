import { Component, inject } from '@angular/core';

import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';
import { Institution } from 'src/app/core/models/auth.models';
import { ApiActivityService } from 'src/app/core/services/api-activity.service';
import { InstitutionContextService } from 'src/app/core/services/institution-context.service';

/**
 * Selector de institución para PLATFORM_ADMIN. Al cambiar de institución se
 * recarga la vista para que ninguna pantalla conserve datos del contexto
 * anterior. Si hay peticiones en curso se pide confirmación.
 */
@Component({
    selector: 'app-institution-selector',
    imports: [...SHARED_IMPORTS],
    templateUrl: './institution-selector.component.html'
})
export class InstitutionSelectorComponent {
    readonly context = inject(InstitutionContextService);
    private readonly activity = inject(ApiActivityService);

    choose(institution: Institution): void {
        if (this.context.selected()?.id === institution.id) {
            return;
        }
        if (!this.confirmIfBusy()) {
            return;
        }
        this.context.select(institution);
        window.location.reload();
    }

    clearSelection(): void {
        if (!this.context.selected()) {
            return;
        }
        if (!this.confirmIfBusy()) {
            return;
        }
        this.context.select(null);
        window.location.reload();
    }

    private confirmIfBusy(): boolean {
        if (!this.activity.hasPendingOperations()) {
            return true;
        }
        return window.confirm(
            'Hay operaciones en curso. Al cambiar de institución se recargará la pantalla y se perderán los datos no guardados. ¿Desea continuar?'
        );
    }
}
