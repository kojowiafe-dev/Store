import { NextResponse } from 'next/server';
import { getErrorMessage } from '@/lib/constants';
import { getActiveCategories } from '@/repositories/category.repository';

export async function GET() {
  try {
    const categories = await getActiveCategories();
    return NextResponse.json(categories);
  } catch (error: unknown) {
    return NextResponse.json(
      { error: getErrorMessage(error, 'Failed to retrieve categories.') },
      { status: 500 }
    );
  }
}
