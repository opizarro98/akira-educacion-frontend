import { computed, Injectable, signal } from '@angular/core';

/**
 * Cuenta las peticiones HTTP en curso. El selector de institución lo usa para
 * pedir confirmación antes de cambiar de contexto mientras hay operaciones
 * pendientes.
 */
@Injectable({ providedIn: 'root' })
export class ApiActivityService {
    private readonly countSignal = signal(0);

    readonly activeRequests = this.countSignal.asReadonly();
    readonly hasPendingOperations = computed(() => this.countSignal() > 0);

    begin(): void {
        this.countSignal.update((count) => count + 1);
    }

    end(): void {
        this.countSignal.update((count) => Math.max(0, count - 1));
    }
}
