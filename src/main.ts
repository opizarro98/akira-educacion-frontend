import { enableProdMode, importProvidersFrom } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { environment } from './environments/environment';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { jwtInterceptor } from './app/core/interceptors/jwt.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { activityInterceptor } from './app/core/interceptors/activity.interceptor';
import { institutionContextInterceptor } from './app/core/interceptors/institution-context.interceptor';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, AppRoutingModule),
    provideHttpClient(
      withInterceptors([
        jwtInterceptor,
        institutionContextInterceptor,
        activityInterceptor,
        errorInterceptor
      ])
    )
  ]
}).catch((err) => console.error(err));
