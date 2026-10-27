import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { institutionContextGuard } from './core/guards/institution-context.guard';

const appRoutes: Routes = [
  {
    path: 'login',
    component: GuestComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./demo/pages/authentication/login/login.component').then((c) => c.LoginComponent)
      }
    ]
  },
  {
    path: '',
    component: AdminComponent,
    canActivate: [authGuard, institutionContextGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((c) => c.DashboardComponent)
      },
      {
        path: 'platform/institutions',
        canActivate: [roleGuard(['PLATFORM_ADMIN'])],
        loadComponent: () =>
          import('./features/platform/institutions/institution-list.component').then(
            (c) => c.InstitutionListComponent
          )
      },
      {
        path: 'institution/settings',
        canActivate: [roleGuard(['INSTITUTION_ADMIN'])],
        loadComponent: () =>
          import('./features/institution/settings/institution-settings.component').then(
            (c) => c.InstitutionSettingsComponent
          )
      },
      {
        path: 'users',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'PLATFORM_ADMIN'])],
        loadComponent: () =>
          import('./features/users/user-list.component').then((c) => c.UserListComponent)
      },
      {
        path: 'students',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/students/student-list.component').then((c) => c.StudentListComponent)
      },
      {
        path: 'students/new',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY'])],
        loadComponent: () =>
          import('./features/students/student-form.component').then((c) => c.StudentFormComponent)
      },
      {
        path: 'students/:id/edit',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY'])],
        loadComponent: () =>
          import('./features/students/student-form.component').then((c) => c.StudentFormComponent)
      },
      {
        path: 'students/:id',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/students/student-detail.component').then(
            (c) => c.StudentDetailComponent
          )
      },
      {
        path: 'representatives',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/representatives/representative-list.component').then(
            (c) => c.RepresentativeListComponent
          )
      },
      {
        path: 'catalog',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/catalog/catalog.component').then((c) => c.CatalogComponent)
      },
      {
        path: 'enrollments',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/enrollments/enrollment-list.component').then(
            (c) => c.EnrollmentListComponent
          )
      },
      {
        path: 'enrollments/new',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY'])],
        loadComponent: () =>
          import('./features/enrollments/enrollment-form.component').then(
            (c) => c.EnrollmentFormComponent
          )
      },
      {
        path: 'enrollments/:id/edit',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY'])],
        loadComponent: () =>
          import('./features/enrollments/enrollment-form.component').then(
            (c) => c.EnrollmentFormComponent
          )
      },
      {
        path: 'enrollments/:id',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/enrollments/enrollment-detail.component').then(
            (c) => c.EnrollmentDetailComponent
          )
      },
      {
        path: 'billing/charges',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/billing/charge-list.component').then((c) => c.ChargeListComponent)
      },
      {
        path: 'billing/charges/new',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY'])],
        loadComponent: () =>
          import('./features/billing/charge-form.component').then((c) => c.ChargeFormComponent)
      },
      {
        path: 'billing/charges/:id',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/billing/charge-detail.component').then((c) => c.ChargeDetailComponent)
      },
      {
        path: 'billing/concepts',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/billing/billing-concepts.component').then(
            (c) => c.BillingConceptsComponent
          )
      },
      {
        path: 'billing/payments',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/billing/payment-list.component').then((c) => c.PaymentListComponent)
      },
      {
        path: 'billing/payments/new',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'TREASURY'])],
        loadComponent: () =>
          import('./features/billing/payment-form.component').then((c) => c.PaymentFormComponent)
      },
      {
        path: 'billing/payments/:id',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/billing/payment-detail.component').then((c) => c.PaymentDetailComponent)
      },
      {
        path: 'billing/receipts',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/billing/receipt-list.component').then((c) => c.ReceiptListComponent)
      },
      {
        path: 'billing/receipts/:id',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/billing/receipt-detail.component').then((c) => c.ReceiptDetailComponent)
      },
      {
        path: 'finance/expenses',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/finance/expense-list.component').then((c) => c.ExpenseListComponent)
      },
      {
        path: 'finance/expenses/new',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'TREASURY'])],
        loadComponent: () =>
          import('./features/finance/expense-form.component').then((c) => c.ExpenseFormComponent)
      },
      {
        path: 'finance/expenses/:id/edit',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'TREASURY'])],
        loadComponent: () =>
          import('./features/finance/expense-form.component').then((c) => c.ExpenseFormComponent)
      },
      {
        path: 'finance/expenses/:id',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/finance/expense-detail.component').then((c) => c.ExpenseDetailComponent)
      },
      {
        path: 'finance/expense-categories',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/finance/expense-categories.component').then(
            (c) => c.ExpenseCategoriesComponent
          )
      },
      {
        path: 'finance/cash-movements',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/finance/cash-movements.component').then(
            (c) => c.CashMovementsComponent
          )
      },
      {
        path: 'finance/reports',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/finance/finance-reports.component').then(
            (c) => c.FinanceReportsComponent
          )
      },
      {
        path: 'communications',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/communications/communication-list.component').then(
            (c) => c.CommunicationListComponent
          )
      },
      {
        path: 'communications/new',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY'])],
        loadComponent: () =>
          import('./features/communications/communication-new.component').then(
            (c) => c.CommunicationNewComponent
          )
      },
      {
        path: 'communications/templates',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'])],
        loadComponent: () =>
          import('./features/communications/communication-templates.component').then(
            (c) => c.CommunicationTemplatesComponent
          )
      },
      {
        path: 'imports/students',
        canActivate: [roleGuard(['INSTITUTION_ADMIN', 'SECRETARY'])],
        loadComponent: () =>
          import('./features/imports/student-import.component').then(
            (c) => c.StudentImportComponent
          )
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
