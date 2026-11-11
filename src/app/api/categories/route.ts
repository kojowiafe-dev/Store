import { NextResponse } from 'next/server';
import { getActiveCategories } from '@/repositories/category.repository';

export async function GET() {
  try {
    const categories = await getActiveCategories();
    return NextResponse.json(categories);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message ?? 'Failed to retrieve categories.' },
      { status: 500 }
    );
  }
}

