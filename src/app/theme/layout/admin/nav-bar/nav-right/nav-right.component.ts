// Angular import
import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

// third party import
import { SHARED_IMPORTS } from 'src/app/theme/shared/shared.module';

// project import
import { AuthService } from 'src/app/core/services/auth.service';

@Component({
  selector: 'app-nav-right',
  imports: [...SHARED_IMPORTS, RouterModule],
  templateUrl: './nav-right.component.html',
  styleUrl: './nav-right.component.scss'
})
export class NavRightComponent {
  readonly auth = inject(AuthService);

  logout(): void {
    this.auth.logout();
  }
}

