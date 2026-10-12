import Link from 'next/link';
import type {Metadata} from 'next';
import {requireStaff} from '@/lib/auth';
import {logout} from '@/app/acceso/actions';
import {canReadMessages,editorial} from '@/lib/permissions';
export const metadata:Metadata={title:'Administración',robots:{index:false,follow:false}};
export default async function AdminLayout({children}:{children:React.ReactNode}){const {profile}=await requireStaff();return <div className="admin-shell"><aside className="admin-sidebar"><h2>PANEL EDITORIAL</h2><p>{profile.name||profile.email||'Equipo'} · {profile.role.toUpperCase()}</p><Link href="/admin">Resumen</Link>{profile.role!=='moderador'&&<Link href="/admin/noticias">Noticias</Link>}{canReadMessages(profile.role)&&<Link href="/admin/mensajes">Mensajes</Link>}{editorial(profile.role)&&<Link href="/admin/medios">Biblioteca multimedia</Link>}{profile.role==='admin'&&<><Link href="/admin/configuracion">Configuración</Link><Link href="/admin/usuarios">Usuarios y permisos</Link></>}<form action={logout} style={{marginTop:25}}><button className="button" type="submit">CERRAR SESIÓN</button></form></aside><section className="admin-main">{children}</section></div>}
