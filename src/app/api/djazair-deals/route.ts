import { NextResponse } from 'next/server';
import cachedDeals from '@/data/cachedDeals.json';

export const dynamic = 'force-static'; // Cache statique pour performance maximale
export const revalidate = 86400; // Revalider au max une fois par jour (24h)

/**
 * API GET: Retourne les offres flash depuis le cache (instantané)
 */
export async function GET() {
    try {
        return NextResponse.json({
            success: true,
            data: cachedDeals.deals,
            lastUpdated: cachedDeals.lastUpdated,
            source: 'cache'
        });
    } catch (error: any) {
        console.error("Erreur lecture cache deals:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
