export type Role = 'admin'|'editor'|'colaborador'|'moderador'|'visitante';
export type Status = 'draft'|'review'|'published'|'archived';
export const editorial = (role:Role) => role === 'admin' || role === 'editor';
export const canWrite = (role:Role, owner:boolean, status:Status) => editorial(role) || (role === 'colaborador' && owner && ['draft','review'].includes(status));
export const canManageUsers = (role:Role) => role === 'admin';
export const canReadMessages = (role:Role) => role === 'admin' || role === 'moderador';
