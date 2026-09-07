import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Known aliases, addresses, and handles mapped to entity IDs
const KNOWN_ALIAS_MAP: Record<string, string> = {
  // ent-001 (DarkPhoenix_77)
  'ph03nix_rx': 'ent-001',
  'darkphoenix_77': 'ent-001',
  'darkphoenix': 'ent-001',
  'dp_supply': 'ent-001',
  'darkp77': 'ent-001',
  'f9b24a321109e77a8c3d5f6b7e2a9d014c8f3b62': 'ent-001',
  'f9b2 4a32 1109 e77a': 'ent-001',
  '4c8f3b62': 'ent-001',
  'bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2': 'ent-001',
  'bc1q9hk7': 'ent-001',
  '42xm7q9lr5kb3pn2vt1wh4yg6fd8ce0za7sj5mk9oi3ur6ty1wq4ep2xl': 'ent-001',
  
  // ent-002 (KhaosAdmin)
  'khaosadmin': 'ent-002',
  'khaos_ops': 'ent-002',
  'admin_khaos': 'ent-002',
  
  // ent-003 (@Ghost_Supply / WhiteRabbit)
  'whiterabbit': 'ent-003',
  'whiterabbit_vip': 'ent-003',
  'wr_distro': 'ent-003',
  'whitebunny_uk': 'ent-003',
  '@ghost_supply': 'ent-003',
  'ghost_supply': 'ent-003',
  'ghost': 'ent-003',
  
  // ent-004 (ChemKing2026)
  'chemking': 'ent-004',
  'chemking2026': 'ent-004',
  'precursorlab_cn': 'ent-004',
  'kingchem_global': 'ent-004',
  's11kr0ad_vendor': 'ent-004',
  
  // ent-005 (ShadowCourier_01)
  'shadowcourier': 'ent-005',
  'shadowcourier_01': 'ent-005',
  'dropmaster_berlin': 'ent-005',
  'packmule_01': 'ent-005',

  // ent-006
  'nightowl': 'ent-006',
  'nightowl_pharm': 'ent-006',

  // ent-007
  'acidwizard': 'ent-007',
  'acidwizard420': 'ent-007',

  // ent-008
  'el_chapo_junior': 'ent-008',

  // ent-009
  'pharmagrad_ru': 'ent-009',

  // ent-010
  'methlabmike': 'ent-010',

  // Operation entities
  'torzon': 'ent-torzon-01',
  'torzon market': 'ent-torzon-01',
  'fabryka': 'ent-op-fabryka-01',
  'operation fabryka superlabs': 'ent-op-fabryka-01',
  'raptor': 'ent-op-raptor-01',
  'operation raptor suspects': 'ent-op-raptor-01',
  'chinese telegram': 'ent-cn-telegram-01',
  'telegram fraud': 'ent-cn-telegram-01'
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const query = String(body.query || '').trim();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const cleanQuery = query.toLowerCase();

    // 1. Check known alias / identifier mapping
    let resolvedEntityId = KNOWN_ALIAS_MAP[cleanQuery];

    // If query contains key keywords
    if (!resolvedEntityId) {
      for (const [key, id] of Object.entries(KNOWN_ALIAS_MAP)) {
        if (cleanQuery.includes(key) || key.includes(cleanQuery)) {
          resolvedEntityId = id;
          break;
        }
      }
    }

    // 2. Query Prisma database to find or enrich the entity
    let entity: any = null;
    try {
      if (resolvedEntityId) {
        entity = await prisma.intelEntity.findUnique({
          where: { id: resolvedEntityId },
          include: { cryptoWallets: true, pgpKeys: true }
        });
      }

      if (!entity) {
        // Search across all entities in DB
        const allEntities = await prisma.intelEntity.findMany({
          include: { cryptoWallets: true, pgpKeys: true }
        });

        entity = allEntities.find((e) => {
          if (e.id.toLowerCase() === cleanQuery) return true;
          if (e.primaryAlias.toLowerCase().includes(cleanQuery)) return true;
          if (cleanQuery.includes(e.primaryAlias.toLowerCase())) return true;
          if (e.cryptoWallets.some((w) => w.address.toLowerCase().includes(cleanQuery))) return true;
          if (e.pgpKeys.some((p) => p.fingerprint.toLowerCase().includes(cleanQuery) || p.shortKeyId.toLowerCase().includes(cleanQuery))) return true;
          return false;
        });

        if (entity) {
          resolvedEntityId = entity.id;
        }
      }
    } catch (dbErr) {
      console.warn('[Reconstruct Route] DB query error, using fallback resolution:', dbErr);
    }

    // 3. Fallback to ent-001 if direct 'ent-' was requested
    if (!entity && cleanQuery.startsWith('ent-')) {
      resolvedEntityId = cleanQuery;
    }

    // If still not found, return 404
    if (!entity && !resolvedEntityId) {
      return NextResponse.json({ error: "Entity not found in databases." }, { status: 404 });
    }

    // 4. Construct enriched profile
    const primaryWallet = entity?.cryptoWallets?.[0];
    const totalVolume = entity?.cryptoWallets?.reduce((sum: number, w: any) => sum + (w.observedVolumeUSD || 0), 0) || 54000;
    const genesisDate = entity?.firstSeen 
      ? new Date(entity.firstSeen).toISOString().split('T')[0] 
      : '2024-03-12';

    const dossier = {
      entityId: entity?.id || resolvedEntityId || 'ent-001',
      primaryAlias: entity?.primaryAlias || (resolvedEntityId === 'ent-001' ? 'DarkPhoenix_77' : query),
      riskScore: entity?.riskScore || 94,
      status: entity?.status || 'Active',
      financialProfile: {
        totalVolumeUSD: totalVolume,
        peakOperationPeriod: "May 2025",
        genesisDate: genesisDate,
        coinJoinRounds: 14,
        primaryWallet: primaryWallet?.address || 'bc1q9hk7m3x2v8p5c6e4f0r1t7w9y2u3i4o5p6a7s8d9f0g1h2j3k4l5x4k2',
        currency: primaryWallet?.currency || 'BTC'
      }
    };

    return NextResponse.json(dossier);
  } catch (error: any) {
    console.error("API Error in /api/reconstruct:", error);
    return NextResponse.json({ error: "Failed to reconstruct timeline" }, { status: 500 });
  }
}
