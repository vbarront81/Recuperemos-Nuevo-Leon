import {AdminEditor} from '@/components/admin-editor';
import {requireRole} from '@/lib/auth';
export default async function Page(){const {profile}=await requireRole('admin','editor','colaborador');return <AdminEditor role={profile.role}/>}
