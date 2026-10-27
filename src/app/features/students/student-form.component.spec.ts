import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { StudentFormComponent } from './student-form.component';
import { StudentApiService } from 'src/app/core/services/student-api.service';
import { Student } from 'src/app/core/models/school.models';

const savedStudent: Student = {
    id: 'ssssssss-ssss-ssss-ssss-ssssssssssss',
    firstName: 'Ana',
    lastName: 'Pérez',
    documentType: null,
    documentNumber: null,
    birthDate: null,
    admissionDate: '2026-03-01',
    status: 'PRE_REGISTERED',
    email: null,
    phone: null,
    address: null,
    notes: null,
    notesRestricted: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
};

describe('StudentFormComponent', () => {
    let fixture: ComponentFixture<StudentFormComponent>;
    let component: StudentFormComponent;
    const api = {
        get: vi.fn(() => of(savedStudent)),
        create: vi.fn(() => of(savedStudent)),
        update: vi.fn(() => of(savedStudent))
    };
    const router = { navigate: vi.fn() };

    beforeEach(() => {
        api.create.mockClear();
        api.update.mockClear();
        router.navigate.mockClear();
        TestBed.configureTestingModule({
            imports: [StudentFormComponent],
            providers: [
                provideRouter([]),
                { provide: StudentApiService, useValue: api },
                { provide: Router, useValue: router },
                {
                    provide: ActivatedRoute,
                    useValue: { snapshot: { paramMap: { get: () => null } } }
                }
            ]
        });
        fixture = TestBed.createComponent(StudentFormComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('no envía el formulario si faltan campos obligatorios', () => {
        component.save();

        expect(api.create).not.toHaveBeenCalled();
        expect(component.form.touched).toBe(true);
        expect(component.form.controls.firstName.hasError('required')).toBe(true);
    });

    it('crea el estudiante con los datos normalizados', () => {
        component.form.patchValue({
            firstName: '  Ana ',
            lastName: ' Pérez ',
            admissionDate: '2026-03-01'
        });

        component.save();

        expect(api.create).toHaveBeenCalledWith(
            expect.objectContaining({
                firstName: 'Ana',
                lastName: 'Pérez',
                admissionDate: '2026-03-01',
                status: 'PRE_REGISTERED',
                documentNumber: null
            })
        );
        expect(router.navigate).toHaveBeenCalledWith(['/students', savedStudent.id]);
    });

    it('muestra el mensaje de error del backend al guardar', () => {
        component.form.patchValue({ firstName: 'Ana', lastName: 'Pérez' });
        api.create.mockReturnValueOnce(
            throwError(() => new Error('Ya existe un estudiante con esa identificación'))
        );

        component.save();

        expect(component.error()).toContain('Ya existe un estudiante');
        expect(component.saving()).toBe(false);
    });

    it('marca el correo inválido', () => {
        component.form.patchValue({ firstName: 'Ana', lastName: 'Pérez', email: 'no-es-correo' });

        component.save();

        expect(api.create).not.toHaveBeenCalled();
        expect(component.form.controls.email.hasError('email')).toBe(true);
    });
});
