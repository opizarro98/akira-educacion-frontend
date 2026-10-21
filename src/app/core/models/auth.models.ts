export interface UserProfile {
    id: string;
    email: string;
    fullName: string;
    institutionId: string | null;
    institutionName: string | null;
    roles: string[];
    permissions: string[];
    platformAdmin: boolean;
}

export interface LoginResponse {
    accessToken: string;
    tokenType: string;
    expiresAt: string;
    user: UserProfile;
}

export interface PageResponse<T> {
    content: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
}

export interface Institution {
    id: string;
    legalName: string;
    tradeName: string | null;
    taxId: string | null;
    email: string | null;
    phone: string | null;
    website: string | null;
    address: string | null;
    city: string | null;
    country: string;
    timezone: string;
    language: string;
    currency: string;
    logoUrl: string | null;
    primaryColor: string | null;
    secondaryColor: string | null;
    vatEnabled: boolean;
    vatRate: number | null;
    vatEffectiveFrom: string | null;
    active: boolean;
    modules: string[];
    createdAt: string;
    updatedAt: string;
}

export interface InstitutionAdminPayload {
    email: string;
    fullName: string;
    password: string;
}

export interface CreateInstitutionPayload {
    legalName: string;
    tradeName?: string | null;
    taxId?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    city?: string | null;
    country: string;
    timezone: string;
    language: string;
    currency: string;
    vatEnabled?: boolean;
    vatRate?: number | null;
    vatEffectiveFrom?: string | null;
    modules?: string[];
    admin?: InstitutionAdminPayload;
}

export interface UpdateInstitutionPayload {
    legalName?: string;
    tradeName?: string | null;
    taxId?: string | null;
    email?: string | null;
    phone?: string | null;
    website?: string | null;
    address?: string | null;
    city?: string | null;
    country?: string;
    timezone?: string;
    language?: string;
    currency?: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
    secondaryColor?: string | null;
    vatEnabled?: boolean;
    vatRate?: number | null;
    vatEffectiveFrom?: string | null;
    modules?: string[];
    active?: boolean;
}
