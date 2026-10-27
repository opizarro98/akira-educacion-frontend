import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { StudentImportComponent } from './student-import.component';
import { AuthService } from 'src/app/core/services/auth.service';
import { StudentImportApiService } from 'src/app/core/services/student-import-api.service';
import { StudentImport } from 'src/app/core/models/student-import.models';

const previewData: StudentImport = {
    id: 'iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii',
    fileName: 'estudiantes.xlsx',
    fileSize: 2048,
    fileHash: 'hash',
    status: 'PREVIEWED',
    totalRows: 3,
    validRows: 1,
    errorRows: 1,
    duplicateRows: 1,
    importedRows: 0,
    updatedRows: 0,
    allowUpdateExisting: false,
    createdByEmail: 'secretaria@test.local',
    createdAt: '2026-10-27T10:00:00Z',
    confirmedByEmail: null,
    confirmedAt: null,
    rows: [
        {
            rowNumber: 1,
            firstName: 'Ana',
            lastName: 'Pérez',
            documentType: null,
            documentNumber: '1711111111',
            birthDate: null,
            admissionDate: '2026-03-01',
            studentStatus: 'ACTIVE',
            email: null,
            phone: null,
            address: null,
            rowStatus: 'VALID',
            errors: [],
            duplicateType: null,
            existingStudentId: null,
            createdStudentId: null,
            updatedExisting: false
        },
        {
            rowNumber: 2,
            firstName: 'Luis',
            lastName: '',
            documentType: null,
            documentNumber: null,
            birthDate: null,
            admissionDate: '2026-03-01',
            studentStatus: null,
            email: null,
            phone: null,
            address: null,
            rowStatus: 'ERROR',
            errors: ['Apellidos es obligatorio'],
            duplicateType: null,
            existingStudentId: null,
            createdStudentId: null,
            updatedExisting: false
        },
        {
            rowNumber: 3,
            firstName: 'Ana',
            lastName: 'Pérez',
            documentType: null,
            documentNumber: '1711111111',
            birthDate: null,
            admissionDate: '2026-03-01',
            studentStatus: 'ACTIVE',
            email: null,
            phone: null,
            address: null,
            rowStatus: 'DUPLICATE_FILE',
            errors: ['Identificación duplicada en la fila 1'],
            duplicateType: 'DOCUMENT',
            existingStudentId: null,
            createdStudentId: null,
            updatedExisting: false
        }
    ]
};

const importedData: StudentImport = {
    ...previewData,
    status: 'IMPORTED',
    importedRows: 1
};

describe('StudentImportComponent', () => {
    let fixture: ComponentFixture<StudentImportComponent>;
    let component: StudentImportComponent;
    const api = {
        preview: vi.fn(() => of(previewData)),
        confirm: vi.fn(() => of(importedData))
    };

    function xlsx(name = 'estudiantes.xlsx'): File {
        return new File(['contenido'], name, {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    }

    function selectFile(file: File): void {
        component.onFileSelected({ target: { files: [file] } } as unknown as Event);
    }

    beforeEach(() => {
        api.preview.mockClear();
        api.confirm.mockClear();
        api.preview.mockReturnValue(of(previewData));
        api.confirm.mockReturnValue(of(importedData));
        TestBed.configureTestingModule({
            imports: [StudentImportComponent],
            providers: [
                provideRouter([]),
                { provide: StudentImportApiService, useValue: api },
                { provide: AuthService, useValue: { hasPermission: () => true } }
            ]
        });
        fixture = TestBed.createComponent(StudentImportComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('inicia en la etapa de carga y sin archivo', () => {
        expect(component.stage()).toBe('upload');
        expect(component.previewData()).toBeNull();
        expect(component.error()).toBe('');
    });

    it('rechaza extensiones distintas de .xlsx sin llamar al backend', () => {
        selectFile(new File(['a'], 'estudiantes.csv', { type: 'text/csv' }));

        component.upload();

        expect(api.preview).not.toHaveBeenCalled();
        expect(component.error()).toContain('.xlsx');
    });

    it('rechaza archivos mayores a 5 MB', () => {
        const big = xlsx();
        Object.defineProperty(big, 'size', { value: 6 * 1024 * 1024 });
        selectFile(big);

        component.upload();

        expect(api.preview).not.toHaveBeenCalled();
        expect(component.error()).toContain('5 MB');
    });

    it('muestra la vista previa sin confirmar la importación', () => {
        selectFile(xlsx());

        component.upload();

        expect(api.preview).toHaveBeenCalled();
        expect(api.confirm).not.toHaveBeenCalled();
        expect(component.stage()).toBe('preview');
        expect(component.validRows().length).toBe(1);
        expect(component.errorRows().length).toBe(1);
        expect(component.duplicateRows().length).toBe(1);
        expect(component.duplicateRows()[0].rowStatus).toBe('DUPLICATE_FILE');
    });

    it('confirma la importación con la opción explícita de actualización', () => {
        selectFile(xlsx());
        component.upload();
        component.allowUpdateExisting.set(true);

        component.confirm();

        expect(api.confirm).toHaveBeenCalledWith(previewData.id, true);
        expect(component.stage()).toBe('result');
        expect(component.resultData()?.importedRows).toBe(1);
    });

    it('no confirma si no hay vista previa', () => {
        component.confirm();

        expect(api.confirm).not.toHaveBeenCalled();
    });

    it('muestra el error del backend al previsualizar', () => {
        selectFile(xlsx());
        api.preview.mockReturnValueOnce(
            throwError(() => new Error('Las columnas obligatorias no están presentes'))
        );

        component.upload();

        expect(component.error()).toContain('columnas obligatorias');
        expect(component.stage()).toBe('upload');
        expect(component.busy()).toBe(false);
    });

    it('muestra el error del backend al confirmar y permanece en la vista previa', () => {
        selectFile(xlsx());
        component.upload();
        api.confirm.mockReturnValueOnce(throwError(() => new Error('La importación falló')));

        component.confirm();

        expect(component.error()).toContain('La importación falló');
        expect(component.stage()).toBe('preview');
    });
});
