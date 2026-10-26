import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApexOptions, NgApexchartsModule } from 'ng-apexcharts';

import { AuthService } from 'src/app/core/services/auth.service';
import { FinanceApiService } from 'src/app/core/services/finance-api.service';
import { Dashboard } from 'src/app/core/models/finance.models';
import { PAYMENT_METHOD_LABELS } from 'src/app/core/models/payment.models';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, FormsModule, RouterModule, NgApexchartsModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    private readonly authService = inject(AuthService);
    private readonly financeApi = inject(FinanceApiService);

    readonly auth = this.authService;
    readonly loading = signal(false);
    readonly error = signal('');
    readonly dashboard = signal<Dashboard | null>(null);

    readonly from = signal(monthStart());
    readonly to = signal(today());

    readonly paymentsChart = signal<ApexOptions | null>(null);
    readonly expensesChart = signal<ApexOptions | null>(null);
    readonly cashChart = signal<ApexOptions | null>(null);

    readonly isPlatformAdmin = computed(() => this.authService.isPlatformAdmin());

    ngOnInit(): void {
        if (!this.isPlatformAdmin()) {
            this.load();
        }
    }

    load(): void {
        this.loading.set(true);
        this.error.set('');
        this.financeApi.dashboard(this.from() || null, this.to() || null).subscribe({
            next: (data) => {
                this.dashboard.set(data);
                this.buildCharts(data);
                this.loading.set(false);
            },
            error: (err: Error) => {
                this.error.set(err.message);
                this.loading.set(false);
            }
        });
    }

    private buildCharts(data: Dashboard): void {
        const methods = data.paymentsByMethod ?? [];
        this.paymentsChart.set(
            methods.length === 0
                ? null
                : {
                    chart: { type: 'donut', height: 300, background: 'transparent' },
                    labels: methods.map((item) => PAYMENT_METHOD_LABELS[item.method] ?? item.method),
                    series: methods.map((item) => Number(item.amount)),
                    colors: ['#0d6efd', '#20c997', '#6f42c1', '#fd7e14'],
                    dataLabels: { enabled: true },
                    legend: { position: 'bottom' },
                    tooltip: { theme: 'light' }
                }
        );

        const categories = data.expensesByCategory ?? [];
        this.expensesChart.set(
            categories.length === 0
                ? null
                : {
                    chart: { type: 'bar', height: 300, background: 'transparent', toolbar: { show: false } },
                    series: [{ name: 'Egresos', data: categories.map((item) => Number(item.amount)) }],
                    xaxis: { categories: categories.map((item) => item.categoryName) },
                    plotOptions: { bar: { horizontal: true, borderRadius: 4 } },
                    colors: ['#dc3545'],
                    dataLabels: { enabled: false },
                    tooltip: { theme: 'light' }
                }
        );

        const series = data.cashSeries ?? [];
        this.cashChart.set(
            series.length === 0
                ? null
                : {
                    chart: { type: 'bar', height: 320, background: 'transparent', toolbar: { show: false } },
                    series: [
                        { name: 'Entradas', data: series.map((item) => Number(item.inflows)) },
                        { name: 'Salidas', data: series.map((item) => Number(item.outflows)) }
                    ],
                    xaxis: { categories: series.map((item) => item.period) },
                    colors: ['#198754', '#dc3545'],
                    dataLabels: { enabled: false },
                    legend: { position: 'bottom' },
                    tooltip: { theme: 'light' }
                }
        );
    }
}

function today(): string {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
}

function monthStart(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
}
