import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdminComponent } from './theme/layout/admin/admin.component';
import { GuestComponent } from './theme/layout/guest/guest.component';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

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
    canActivate: [authGuard],
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
