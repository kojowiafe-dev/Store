import { NextRequest, NextResponse } from 'next/server';
import { getMarketplaceListings } from '@/repositories/listing.repository';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get('q') ?? undefined;
    const category = searchParams.get('category') ?? undefined;
    const hall = searchParams.get('hall') ?? undefined;
    const sort = (searchParams.get('sort') as any) ?? 'recent';
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
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to execute search.' },
      { status: 500 }
    );
  }
}

