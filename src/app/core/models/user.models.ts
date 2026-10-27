export interface UserSummary {
    id: string;
    email: string;
    fullName: string;
    institutionId: string | null;
    roles: string[];
    active: boolean;
    createdAt: string;
}

export interface CreateUserPayload {
    email: string;
    fullName: string;
    password: string;
    roles: string[];
}

export interface UpdateUserPayload {
    email: string;
    fullName: string;
}

export const INSTITUTION_ROLE_LABELS: Record<string, string> = {
    INSTITUTION_ADMIN: 'Administrador institucional',
    SECRETARY: 'Secretaría',
    TREASURY: 'Tesorería',
    DIRECTOR: 'Dirección'
};
