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

  if (roles.includes('PLATFORM_ADMIN')) {
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

  const institutionRoles = ['INSTITUTION_ADMIN', 'SECRETARY', 'TREASURY', 'DIRECTOR'];
  if (roles.some((role) => institutionRoles.includes(role))) {
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
        id: 'catalog',
        title: 'Catálogo',
        type: 'item',
        classes: 'nav-item',
        url: '/catalog',
        icon: 'ti ti-list-details'
      }
    );
  }

  return items;
}
