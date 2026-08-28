import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { apiError } from '@/lib/apiError';

/**
 * Public endpoint — returns active categories with condition counts.
 * No auth required (anyone can browse the condition library).
 */
export async function GET(request: NextRequest) {
  try {
    // Fetch active categories ordered by display_order
    const { data: categories, error: catError } = await supabaseServer
      .from('condition_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (catError) {
      return apiError(catError, '[api/conditions/categories] categories');
    }

    // Fetch active conditions to count per category
    const { data: conditions, error: condError } = await supabaseServer
      .from('conditions')
      .select('id, category_id, name, short_description, is_featured')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (condError) {
      return apiError(condError, '[api/conditions/categories] conditions');
    }

    // Build category map with conditions attached
    const categoryMap = new Map<string, any>();

    for (const cat of categories ?? []) {
      categoryMap.set(cat.id, {
        ...cat,
        conditions_count: 0,
        conditions: [],
      });
    }

    for (const cond of conditions ?? []) {
      const cat = categoryMap.get(cond.category_id);
      if (cat) {
        cat.conditions_count += 1;
        cat.conditions.push({
          id: cond.id,
          name: cond.name,
          short_description: cond.short_description,
          is_featured: cond.is_featured,
        });
      }
    }

    const result = Array.from(categoryMap.values());

    return NextResponse.json({ categories: result }, { status: 200 });
  } catch (err) {
    console.error('[api/conditions/categories] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
