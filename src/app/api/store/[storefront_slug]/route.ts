import { NextRequest, NextResponse } from 'next/server';
import { getStorefrontBySlug } from '@/repositories/seller.repository';
import { getListingsByStorefrontSlug } from '@/repositories/listing.repository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storefront_slug: string }> }
) {
  try {
    const { storefront_slug } = await params;
    const storefront = await getStorefrontBySlug(storefront_slug);

    if (!storefront) {
      return NextResponse.json({ error: 'Storefront not found.' }, { status: 404 });
    }

    const listings = await getListingsByStorefrontSlug(storefront_slug);

    return NextResponse.json({
      ...storefront,
      listings,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to retrieve storefront.' },
      { status: 500 }
    );
  }
}

