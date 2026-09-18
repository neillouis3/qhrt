import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';

/**
 * Seed the initial 7 categories and 60 conditions.
 * Idempotent — safe to re-run (uses upsert on name for categories,
 * and checks for existing condition names per category).
 */
export async function POST(request: NextRequest) {
  // Disable destructive seed/overwrite in production — safe to re-run in dev only.
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Seed endpoint is disabled in production' }, { status: 403 });
  }

  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    // ---- Categories ----
    const categories = [
      {
        name: 'Emotional Wellbeing',
        description: 'Stress, mood, and emotional balance habits',
        display_order: 1,
      },
      {
        name: 'Sleep & Energy',
        description: 'Rest, vitality, and daily energy levels',
        display_order: 2,
      },
      {
        name: 'Pain & Mobility',
        description: 'Physical pain management and movement freedom',
        display_order: 3,
      },
      {
        name: 'Hormonal & Metabolic Health',
        description: 'Endocrine balance, metabolism, and hormonal wellness',
        display_order: 4,
      },
      {
        name: 'Immune & Inflammatory Health',
        description: 'Immune system strength and inflammation management',
        display_order: 5,
      },
      {
        name: 'Healthy Aging & Longevity',
        description: 'Aging well, strength, and long-term vitality',
        display_order: 6,
      },
      {
        name: 'Specialized Programs',
        description: 'Targeted programs for specific needs',
        display_order: 7,
      },
    ];

    // Upsert categories (on conflict do nothing — preserves existing IDs)
    const categoryMap: Record<string, string> = {};

    for (const cat of categories) {
      // Check if category with this name already exists
      const { data: existing } = await supabaseServer
        .from('condition_categories')
        .select('id')
        .eq('name', cat.name)
        .maybeSingle();

      if (existing) {
        categoryMap[cat.name] = (existing as { id: string }).id;
      } else {
        const { data, error } = await supabaseServer
          .from('condition_categories')
          .insert({
            name: cat.name,
            description: cat.description,
            display_order: cat.display_order,
            is_active: true,
          })
          .select()
          .single();

        if (error) {
          console.error(`[seed] Error creating category ${cat.name}:`, error);
          continue;
        }
        categoryMap[cat.name] = (data as { id: string }).id;
      }
    }

    // ---- Conditions ----
    const conditions: Array<{ name: string; categoryName: string }> = [
      // Emotional Wellbeing
      { name: 'Anxiety', categoryName: 'Emotional Wellbeing' },
      { name: 'Depression', categoryName: 'Emotional Wellbeing' },
      { name: 'Stress & Overwhelm', categoryName: 'Emotional Wellbeing' },
      { name: 'Burnout', categoryName: 'Emotional Wellbeing' },
      { name: 'Emotional Exhaustion', categoryName: 'Emotional Wellbeing' },
      { name: 'Trauma Recovery', categoryName: 'Emotional Wellbeing' },
      { name: 'PTSD', categoryName: 'Emotional Wellbeing' },
      { name: 'Grief & Loss', categoryName: 'Emotional Wellbeing' },
      { name: 'Anger & Irritability', categoryName: 'Emotional Wellbeing' },
      { name: 'Emotional Reactivity', categoryName: 'Emotional Wellbeing' },
      { name: 'Panic Symptoms', categoryName: 'Emotional Wellbeing' },
      { name: 'Fear & Worry', categoryName: 'Emotional Wellbeing' },

      // Sleep & Energy
      { name: 'Poor Sleep', categoryName: 'Sleep & Energy' },
      { name: 'Insomnia', categoryName: 'Sleep & Energy' },
      { name: 'Difficulty Falling Asleep', categoryName: 'Sleep & Energy' },
      { name: 'Night Waking', categoryName: 'Sleep & Energy' },
      { name: 'Chronic Fatigue', categoryName: 'Sleep & Energy' },
      { name: 'Low Energy', categoryName: 'Sleep & Energy' },
      { name: 'Brain Fog', categoryName: 'Sleep & Energy' },
      { name: 'Low Motivation', categoryName: 'Sleep & Energy' },
      { name: 'Lack of Vitality', categoryName: 'Sleep & Energy' },
      { name: 'Recovery & Resilience', categoryName: 'Sleep & Energy' },

      // Pain & Mobility
      { name: 'Neck Pain', categoryName: 'Pain & Mobility' },
      { name: 'Shoulder Pain', categoryName: 'Pain & Mobility' },
      { name: 'Frozen Shoulder', categoryName: 'Pain & Mobility' },
      { name: 'Upper Back Pain', categoryName: 'Pain & Mobility' },
      { name: 'Mid Back Pain', categoryName: 'Pain & Mobility' },
      { name: 'Low Back Pain', categoryName: 'Pain & Mobility' },
      { name: 'Sciatic Pain', categoryName: 'Pain & Mobility' },
      { name: 'Hip Pain', categoryName: 'Pain & Mobility' },
      { name: 'Knee Pain', categoryName: 'Pain & Mobility' },
      { name: 'Foot & Ankle Pain', categoryName: 'Pain & Mobility' },
      { name: 'Chronic Pain', categoryName: 'Pain & Mobility' },
      { name: 'Muscle Tension', categoryName: 'Pain & Mobility' },
      { name: 'Headaches', categoryName: 'Pain & Mobility' },
      { name: 'Migraines', categoryName: 'Pain & Mobility' },
      { name: 'Jaw/TMJ Tension', categoryName: 'Pain & Mobility' },

      // Hormonal & Metabolic Health
      { name: 'Weight Challenges', categoryName: 'Hormonal & Metabolic Health' },
      { name: 'Weight Loss Resistance', categoryName: 'Hormonal & Metabolic Health' },
      { name: 'Digestive Health', categoryName: 'Hormonal & Metabolic Health' },
      { name: 'Bloating', categoryName: 'Hormonal & Metabolic Health' },
      { name: 'Food Cravings', categoryName: 'Hormonal & Metabolic Health' },
      { name: 'Blood Sugar Balance', categoryName: 'Hormonal & Metabolic Health' },
      { name: 'Hormonal Balance', categoryName: 'Hormonal & Metabolic Health' },
      { name: 'Thyroid Health', categoryName: 'Hormonal & Metabolic Health' },
      { name: 'Adrenal Health', categoryName: 'Hormonal & Metabolic Health' },
      { name: 'Menopause Support', categoryName: 'Hormonal & Metabolic Health' },
      { name: "Women's Health", categoryName: 'Hormonal & Metabolic Health' },
      { name: "Men's Health", categoryName: 'Hormonal & Metabolic Health' },
      { name: 'Low Ferritin & Energy', categoryName: 'Hormonal & Metabolic Health' },

      // Immune & Inflammatory Health
      { name: 'Chronic Inflammation', categoryName: 'Immune & Inflammatory Health' },
      { name: 'Autoimmune Resilience', categoryName: 'Immune & Inflammatory Health' },
      { name: 'Frequent Illness', categoryName: 'Immune & Inflammatory Health' },
      { name: 'Seasonal Allergies', categoryName: 'Immune & Inflammatory Health' },
      { name: 'Immune Vitality', categoryName: 'Immune & Inflammatory Health' },

      // Healthy Aging & Longevity
      { name: 'Osteoporosis Support', categoryName: 'Healthy Aging & Longevity' },
      { name: 'Mobility & Flexibility', categoryName: 'Healthy Aging & Longevity' },
      { name: 'Healthy Aging', categoryName: 'Healthy Aging & Longevity' },
      { name: 'Strength & Stability', categoryName: 'Healthy Aging & Longevity' },

      // Specialized Programs
      { name: 'Vision Revitalization', categoryName: 'Specialized Programs' },
    ];

    let created = 0;
    let skipped = 0;

    for (const { name, categoryName } of conditions) {
      const categoryId = categoryMap[categoryName];

      if (!categoryId) {
        console.error(`[seed] Category "${categoryName}" not found, skipping "${name}"`);
        skipped++;
        continue;
      }

      // Check if condition already exists
      const { data: existing } = await supabaseServer
        .from('conditions')
        .select('id')
        .eq('name', name)
        .eq('category_id', categoryId)
        .maybeSingle();

      if (existing) {
        skipped++;
        continue;
      }

      const { error } = await supabaseServer.from('conditions').insert({
        name,
        category_id: categoryId,
        display_order: created + skipped + 1,
        is_active: true,
        is_featured: false,
      });

      if (error) {
        console.error(`[seed] Error creating condition "${name}":`, error);
        skipped++;
      } else {
        created++;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: `Seed complete. ${created} conditions created, ${skipped} already existed.`,
        categoriesSeeded: Object.keys(categoryMap).length,
        conditionsCreated: created,
        conditionsSkipped: skipped,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/admin/seed-data] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET not allowed on seed endpoint
export async function GET() {
  return NextResponse.json({ error: 'POST only' }, { status: 405 });
}
