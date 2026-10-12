import {test,expect} from 'vitest';
import {canWrite,canManageUsers,canReadMessages} from '../src/lib/permissions';
test('colaborador solo edita borradores propios',()=>{expect(canWrite('colaborador',true,'draft')).toBe(true);expect(canWrite('colaborador',true,'review')).toBe(true);expect(canWrite('colaborador',false,'draft')).toBe(false);expect(canWrite('colaborador',true,'published')).toBe(false);});
test('solo administrador gestiona usuarios',()=>{expect(canManageUsers('admin')).toBe(true);expect(canManageUsers('editor')).toBe(false);expect(canManageUsers('visitante')).toBe(false);});
test('moderación restringida',()=>{expect(canReadMessages('moderador')).toBe(true);expect(canReadMessages('colaborador')).toBe(false);});
