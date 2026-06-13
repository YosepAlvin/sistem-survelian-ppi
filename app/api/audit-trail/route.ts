import { NextResponse, NextRequest } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }
        // Only allow ADMIN, IPCN, IPCLN roles
        const userRole = (session.user as any).role
        if (userRole !== 'ADMIN' && userRole !== 'IPCN' && userRole !== 'IPCLN') {
            return NextResponse.json({ error: "Unauthorized. Admin, IPCN, or IPCLN role required." }, { status: 403 })
        }
        
        // Get rawat_inap_id from search params
        const { searchParams } = new URL(request.url)
        const rawat_inap_id = searchParams.get('rawat_inap_id')
        
        if (rawat_inap_id) {
            // Get rawat inap data to confirm ownership/access
            const rawatInap = await db.rawatInap.findUnique({
                where: { id: parseInt(rawat_inap_id) },
                include: {
                    ruangan: true,
                    pasien: true
                }
            })
            
            if (!rawatInap) {
                return NextResponse.json({ error: "RawatInap not found" }, { status: 404 })
            }
            
            // Get all audit trails related to this rawat inap:
            // 1. Direct entities: SurveilansHarian, KejadianInfeksi, AlatTerpasang, Operasi
            const relatedIds = await Promise.all([
                db.surveilansHarian.findMany({
                    where: { rawat_inap_id: parseInt(rawat_inap_id) },
                    select: { id: true }
                }),
                db.kejadianInfeksi.findMany({
                    where: { rawat_inap_id: parseInt(rawat_inap_id) },
                    select: { id: true }
                }),
                db.alatTerpasang.findMany({
                    where: { rawat_inap_id: parseInt(rawat_inap_id) },
                    select: { id: true }
                }),
                db.operasi.findMany({
                    where: { rawat_inap_id: parseInt(rawat_inap_id) },
                    select: { id: true }
                })
            ])
            
            const allEntityIds = [
                ...relatedIds[0].map(r => r.id),
                ...relatedIds[1].map(r => r.id),
                ...relatedIds[2].map(r => r.id),
                ...relatedIds[3].map(r => r.id)
            ]
            
            // Get audit trails for all these entities, include user data
            const auditTrails = await db.auditTrail.findMany({
                where: {
                    OR: [
                        { entityId: { in: allEntityIds.length > 0 ? allEntityIds : [-1] } },
                    ]
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            ruangan: {
                                select: {
                                    id: true,
                                    nama: true,
                                    kode: true
                                }
                            }
                        }
                    }
                },
                orderBy: { timestamp: 'desc' }
            })
            
            return NextResponse.json({
                rawatInap: {
                    id: rawatInap.id,
                    pasien: rawatInap.pasien,
                    ruangan: rawatInap.ruangan
                },
                auditTrails: auditTrails
            })
        } else {
            // If no rawat_inap_id, return all audit trails for security-audit page
            const auditTrails = await db.auditTrail.findMany({
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            ruangan: {
                                select: {
                                    id: true,
                                    nama: true,
                                    kode: true
                                }
                            }
                        }
                    }
                },
                orderBy: { timestamp: 'desc' }
            })
            return NextResponse.json({ data: auditTrails })
        }
        
    } catch (error: any) {
        console.error("Error fetching audit trail:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}