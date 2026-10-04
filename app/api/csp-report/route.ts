import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';

// Point de collecte des violations de la Content-Security-Policy (voir
// next.config.js). Les navigateurs y envoient un JSON en
// "application/csp-report" (report-uri) ou "application/reports+json"
// (Reporting API). On se contente de les journaliser (logs Vercel) : la
// route n'écrit rien en base et ne renvoie jamais le contenu reçu.
const MAX_BODY_BYTES = 8 * 1024;

type Violation = Record<string, unknown>;

function pickFields(v: Violation) {
  const get = (k: string, alt?: string) => String(v[k] ?? (alt ? v[alt] : '') ?? '').slice(0, 300);
  return {
    directive: get('effective-directive', 'effectiveDirective') || get('violated-directive', 'violatedDirective'),
    blocked: get('blocked-uri', 'blockedURL'),
    document: get('document-uri', 'documentURL'),
    source: get('source-file', 'sourceFile'),
    line: v['line-number'] ?? v['lineNumber'] ?? null,
    disposition: get('disposition'),
  };
}

export async function POST(request: NextRequest) {
  const rate = await checkRateLimit(request, 'csp-report', 60, 60_000);
  if (!rate.allowed) return new NextResponse(null, { status: 429 });

  const raw = await request.text().catch(() => '');
  if (!raw || raw.length > MAX_BODY_BYTES) return new NextResponse(null, { status: 204 });

  try {
    const parsed = JSON.parse(raw);
    const items: Violation[] = Array.isArray(parsed)
      ? parsed.map((r) => r?.body ?? r)
      : [parsed['csp-report'] ?? parsed.body ?? parsed];
    for (const item of items.slice(0, 10)) {
      if (item && typeof item === 'object') console.warn('[csp-report]', JSON.stringify(pickFields(item)));
    }
  } catch {
    // Rapport illisible : on l'ignore.
  }

  return new NextResponse(null, { status: 204 });
}
