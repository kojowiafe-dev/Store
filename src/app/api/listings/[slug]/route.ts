import { NextRequest, NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/constants';
import { getListingBySlug } from '@/repositories/listing.repository';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const listing = await getListingBySlug(slug);

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to retrieve listing.') },
      { status: 500 }
    );
  }
}
