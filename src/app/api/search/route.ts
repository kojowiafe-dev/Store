import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/constants';
import { getMarketplaceListings } from '@/repositories/listing.repository';
import type { MarketplaceSearchParams } from '@/types/api.types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') ?? undefined;
    const category = searchParams.get('category') ?? undefined;
    const hall = searchParams.get('hall') ?? undefined;
    const rawSort = searchParams.get('sort');
    const sort: NonNullable<MarketplaceSearchParams['sort']> =
      rawSort === 'price_asc' || rawSort === 'price_desc' ? rawSort : 'recent';
    const page = parseInt(searchParams.get('page') ?? '1', 10);
    const limit = parseInt(searchParams.get('limit') ?? '20', 10);

    const result = await getMarketplaceListings({
      q,
      category,
      hall,
      sort,
      page,
      limit,
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to execute search.') },
      { status: 500 }
    );
  }
}
