import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CommunicationNewComponent } from './communication-new.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { CommunicationApiService } from 'src/app/core/services/communication-api.service';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import { Communication, CommunicationPreview, MessageTemplate } from 'src/app/core/models/communication.models';
import { Student, StudentRepresentative } from 'src/app/core/models/school.models';

const student: Student = {
    id: 'ssssssss-ssss-ssss-ssss-ssssssssssss',
    firstName: 'Ana',
    lastName: 'Pérez',
    documentType: null,
    documentNumber: null,
    birthDate: null,
    admissionDate: '2026-03-01',
    status: 'ACTIVE',
    email: null,
    phone: null,
    address: null,
    notes: null,
    notesRestricted: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
};

const representative: StudentRepresentative = {
    linkId: 'llllllll-llll-llll-llll-llllllllllll',
    representativeId: 'rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr',
    fullName: 'María Pérez',
    documentNumber: null,
    phone: '0999999999',
    email: null,
    relationship: 'Madre',
    primaryContact: true,
    authorizedForCommunications: true,
    authorizedForBilling: false
};

const template: MessageTemplate = {
    id: 'tttttttt-tttt-tttt-tttt-tttttttttttt',
    code: null,
    name: 'Bienvenida',
    body: 'Hola {estudiante}',
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
};

const waLink = 'https://wa.me/593999999999?text=Hola%20Ana';

const preview: CommunicationPreview = {
    studentId: student.id,
    studentName: 'Ana Pérez',
    representativeId: representative.representativeId,
    representativeName: representative.fullName,
    templateId: template.id,
    templateName: template.name,
    phone: '0999999999',
    waPhone: '593999999999',
    messageBody: 'Hola Ana',
    waLink,
    includeFinancialInfo: false,
    financialNote: null,
    warnings: ['El enlace wa.me abre WhatsApp, pero no confirma el envío.']
};

const communication: Communication = {
    id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
    studentId: student.id,
    studentName: 'Ana Pérez',
    representativeId: representative.representativeId,
    representativeName: representative.fullName,
    templateId: template.id,
    templateName: template.name,
    phone: '0999999999',
    waPhone: '593999999999',
    messageBody: 'Hola Ana',
    waLink,
    status: 'OPENED',
    includeFinancialInfo: false,
    financialNote: null,
    openedAt: '2026-10-27T10:00:00Z',
    failedReason: null,
    createdByEmail: 'secretaria@test.local',
    createdAt: '2026-10-27T10:00:00Z',
    updatedAt: '2026-10-27T10:00:00Z'
};

describe('CommunicationNewComponent', () => {
    let fixture: ComponentFixture<CommunicationNewComponent>;
    let component: CommunicationNewComponent;
    const api = {
        listTemplates: vi.fn(() => of([template])),
        preview: vi.fn(() => of(preview)),
        create: vi.fn(() => of(communication)),
        markOpened: vi.fn(() => of(communication))
    };
    const studentApi = {
        list: vi.fn(() =>
            of({ content: [student], page: 0, size: 200, totalElements: 1, totalPages: 1 })
        ),
        representatives: vi.fn(() => of([representative]))
    };

    beforeEach(() => {
        api.listTemplates.mockClear();
        api.preview.mockClear();
        api.create.mockClear();
        api.markOpened.mockClear();
        TestBed.configureTestingModule({
            imports: [CommunicationNewComponent],
            providers: [
                provideRouter([]),
                { provide: CommunicationApiService, useValue: api },
                { provide: StudentApiService, useValue: studentApi },
                { provide: AuthService, useValue: { hasPermission: () => true } }
            ]
        });
        fixture = TestBed.createComponent(CommunicationNewComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    function selectAll(): void {
        component.studentId.set(student.id);
        component.representativeId.set(representative.representativeId);
        component.templateId.set(template.id);
    }

    it('carga estudiantes y plantillas al iniciar', () => {
        expect(component.students().length).toBe(1);
        expect(component.templates().length).toBe(1);
    });

    it('exige estudiante, representante y plantilla antes de previsualizar', () => {
        component.generatePreview();

        expect(api.preview).not.toHaveBeenCalled();
        expect(component.error()).toContain('estudiante');
    });

    it('genera la vista previa y muestra el enlace wa.me', () => {
        selectAll();
        component.generatePreview();
        fixture.detectChanges();

        expect(api.preview).toHaveBeenCalledWith({
            studentId: student.id,
            representativeId: representative.representativeId,
            templateId: template.id,
            includeFinancialInfo: false,
            financialNote: null
        });
        expect(component.preview()?.waLink).toBe(waLink);

        const anchor = fixture.nativeElement.querySelector('a[href^="https://wa.me"]') as HTMLAnchorElement;
        expect(anchor).not.toBeNull();
        expect(anchor.getAttribute('href')).toBe(waLink);
    });

    it('no permite incluir información financiera sin detalle confirmado', () => {
        selectAll();
        component.includeFinancialInfo.set(true);
        component.financialNote.set('   ');

        component.generatePreview();

        expect(api.preview).not.toHaveBeenCalled();
        expect(component.error()).toContain('detalle financiero');
    });

    it('registra la comunicación como abierta y abre el enlace wa.me', () => {
        selectAll();
        component.generatePreview();
        const popup = { location: { href: '' }, close: vi.fn() };
        const openSpy = vi
            .spyOn(window, 'open')
            .mockReturnValue(popup as unknown as Window);

        component.openWhatsApp();

        expect(api.create).toHaveBeenCalledWith(
            expect.objectContaining({ studentId: student.id, saveAsDraft: false })
        );
        expect(api.markOpened).toHaveBeenCalledWith(communication.id);
        expect(popup.location.href).toBe(waLink);
        expect(component.success()).toContain('envío no está confirmado');

        openSpy.mockRestore();
    });

    it('muestra el error del backend al previsualizar', () => {
        selectAll();
        api.preview.mockReturnValueOnce(
            throwError(() => new Error('No tiene permisos para realizar esta operación.'))
        );

        component.generatePreview();

        expect(component.error()).toContain('No tiene permisos');
        expect(component.previewing()).toBe(false);
    });
});
