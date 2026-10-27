export interface NavigationItem {
  id: string;
  title: string;
  type: 'item' | 'collapse' | 'group';
  translate?: string;
  icon?: string;
  hidden?: boolean;
  url?: string;
  classes?: string;
  external?: boolean;
  target?: boolean;
  breadcrumbs?: boolean;
  children?: NavigationItem[];
  role?: string[];
  isMainParent?: boolean;
}

/**
 * Menú lateral según los roles del usuario autenticado. Las rutas siguen
 * protegidas por guards y, sobre todo, por permisos del backend.
 */
export function navigationFor(roles: string[]): NavigationItem[] {
  const items: NavigationItem[] = [
    {
      id: 'dashboard',
      title: 'Panel',
      type: 'item',
      classes: 'nav-item',
      url: '/dashboard',
      icon: 'ti ti-dashboard',
      breadcrumbs: false
    }
  ];

  const isPlatformAdmin = roles.includes('PLATFORM_ADMIN');

  if (isPlatformAdmin) {
    items.push({
      id: 'platform-institutions',
      title: 'Instituciones',
      type: 'item',
      classes: 'nav-item',
      url: '/platform/institutions',
      icon: 'ti ti-building-bank'
    });
  }

  if (roles.includes('INSTITUTION_ADMIN')) {
    items.push({
      id: 'institution-settings',
      title: 'Mi institución',
      type: 'item',
      classes: 'nav-item',
      url: '/institution/settings',
      icon: 'ti ti-settings'
    });
  }

  if (isPlatformAdmin || roles.includes('INSTITUTION_ADMIN')) {
    items.push({
      id: 'users',
      title: 'Usuarios',
      type: 'item',
      classes: 'nav-item',
      url: '/users',
      icon: 'ti ti-users-group'
    });
  }

  const institutionRoles = ['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'];
  if (isPlatformAdmin || roles.some((role) => institutionRoles.includes(role))) {
    items.push(
      {
        id: 'students',
        title: 'Estudiantes',
        type: 'item',
        classes: 'nav-item',
        url: '/students',
        icon: 'ti ti-users'
      },
      {
        id: 'representatives',
        title: 'Representantes',
        type: 'item',
        classes: 'nav-item',
        url: '/representatives',
        icon: 'ti ti-user-check'
      },
      {
        id: 'enrollments',
        title: 'Matrículas',
        type: 'item',
        classes: 'nav-item',
        url: '/enrollments',
        icon: 'ti ti-file-description'
      },
      {
        id: 'billing-charges',
        title: 'Cobros',
        type: 'item',
        classes: 'nav-item',
        url: '/billing/charges',
        icon: 'ti ti-receipt'
      },
      {
        id: 'billing-payments',
        title: 'Pagos',
        type: 'item',
        classes: 'nav-item',
        url: '/billing/payments',
        icon: 'ti ti-cash'
      },
      {
        id: 'billing-receipts',
        title: 'Recibos',
        type: 'item',
        classes: 'nav-item',
        url: '/billing/receipts',
        icon: 'ti ti-file-invoice'
      },
      {
        id: 'finance-expenses',
        title: 'Egresos',
        type: 'item',
        classes: 'nav-item',
        url: '/finance/expenses',
        icon: 'ti ti-receipt-2'
      },
      {
        id: 'finance-cash',
        title: 'Caja',
        type: 'item',
        classes: 'nav-item',
        url: '/finance/cash-movements',
        icon: 'ti ti-cash-banknote'
      },
      {
        id: 'finance-reports',
        title: 'Reportes',
        type: 'item',
        classes: 'nav-item',
        url: '/finance/reports',
        icon: 'ti ti-chart-bar'
      },
      {
        id: 'communications',
        title: 'Comunicaciones',
        type: 'item',
        classes: 'nav-item',
        url: '/communications',
        icon: 'ti ti-message-circle'
      },
      {
        id: 'catalog',
        title: 'Catálogo',
        type: 'item',
        classes: 'nav-item',
        url: '/catalog',
        icon: 'ti ti-list-details'
      }
    );
  }

  if (isPlatformAdmin || roles.includes('INSTITUTION_ADMIN') || roles.includes('SECRETARY')) {
    items.push({
      id: 'student-import',
      title: 'Importar estudiantes',
      type: 'item',
      classes: 'nav-item',
      url: '/imports/students',
      icon: 'ti ti-file-import'
    });
  }

  return items;
}
