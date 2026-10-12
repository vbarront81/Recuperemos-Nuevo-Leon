import {NextResponse} from 'next/server';
export const dynamic = 'force-dynamic';
/** Salud del proceso. No revela claves ni estados de infraestructura sensible. */
export function GET() {return NextResponse.json({status:'ok'}, {headers:{'Cache-Control':'no-store'}});}
