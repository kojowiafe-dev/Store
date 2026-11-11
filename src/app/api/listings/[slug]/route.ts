import { NextRequest, NextResponse } from 'next/server';
import { getListingBySlug } from '@/repositories/listing.repository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const listing = await getListingBySlug(slug);

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to retrieve listing.' },
      { status: 500 }
    );
  }
}

