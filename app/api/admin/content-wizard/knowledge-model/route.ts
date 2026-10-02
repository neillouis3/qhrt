import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import {
  buildScaleOptions,
  needsOptions,
  type KnowledgeModelWizardPayload,
  type WizardPromptInput,
} from '@/lib/admin/contentWizardTypes';

function resolvePromptOptions(prompt: WizardPromptInput) {
  if (prompt.options && prompt.options.length > 0) {
    return prompt.options.map((opt, index) => ({
      option_label: opt.option_label.trim(),
      option_value: opt.option_value.trim(),
      display_order: opt.display_order ?? index,
    }));
  }
  if (prompt.response_type === 'scale') {
    const min = prompt.scale_min ?? 0;
    const max = prompt.scale_max ?? 10;
    return buildScaleOptions(min, max);
  }
  return [];
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  let modelId: string | null = null;

  try {
    const body = (await request.json()) as KnowledgeModelWizardPayload;
    const name = body.model?.name?.trim();
    if (!name) {
      return NextResponse.json({ error: 'Model name is required' }, { status: 400 });
    }
    if (!Array.isArray(body.prompts) || body.prompts.length === 0) {
      return NextResponse.json({ error: 'Add at least one question (prompt)' }, { status: 400 });
    }

    const keys = body.prompts.map((p) => p.prompt_key?.trim()).filter(Boolean);
    if (keys.length !== body.prompts.length) {
      return NextResponse.json({ error: 'Every prompt needs a prompt_key' }, { status: 400 });
    }
    if (new Set(keys).size !== keys.length) {
      return NextResponse.json({ error: 'Prompt keys must be unique' }, { status: 400 });
    }

    for (const prompt of body.prompts) {
      if (!prompt.prompt_text?.trim()) {
        return NextResponse.json({ error: 'Every prompt needs question text' }, { status: 400 });
      }
      if (needsOptions(prompt.response_type)) {
        const opts = resolvePromptOptions(prompt);
        if (opts.length < 2) {
          return NextResponse.json(
            {
              error: `Prompt "${prompt.prompt_key}" needs at least two response options (or a valid scale range)`,
            },
            { status: 400 }
          );
        }
      }
    }

    const { data: model, error: modelError } = await supabaseServer
      .from('knowledge_models')
      .insert({
        name,
        description: body.model.description?.trim() || null,
        version: body.model.version?.trim() || '1.0',
        is_active: body.model.is_active ?? false,
      })
      .select()
      .single();

    if (modelError || !model) {
      return apiError(modelError, '[content-wizard/knowledge-model] model');
    }
    modelId = model.id;

    const dimensionIds: string[] = [];
    const dimensions = body.dimensions ?? [];
    for (let i = 0; i < dimensions.length; i += 1) {
      const dim = dimensions[i]!;
      if (!dim.name?.trim()) continue;
      const { data: inserted, error: dimError } = await supabaseServer
        .from('evidence_dimensions')
        .insert({
          knowledge_model_id: model.id,
          name: dim.name.trim(),
          description: dim.description?.trim() || null,
          priority: dim.priority ?? i,
          is_required: dim.is_required ?? true,
        })
        .select('id')
        .single();
      if (dimError) throw dimError;
      dimensionIds.push(inserted.id);
    }

    const createdPrompts: { id: string; prompt_key: string }[] = [];

    for (const prompt of body.prompts) {
      const dimIndex = prompt.dimension_index;
      const evidence_dimension_id =
        typeof dimIndex === 'number' && dimIndex >= 0 && dimIndex < dimensionIds.length
          ? dimensionIds[dimIndex]
          : null;

      const { data: insertedPrompt, error: promptError } = await supabaseServer
        .from('prompts')
        .insert({
          knowledge_model_id: model.id,
          evidence_dimension_id,
          prompt_key: prompt.prompt_key.trim(),
          prompt_text: prompt.prompt_text.trim(),
          response_type: prompt.response_type,
          display_order: prompt.display_order ?? 0,
        })
        .select('id, prompt_key')
        .single();

      if (promptError) throw promptError;

      createdPrompts.push(insertedPrompt);

      if (needsOptions(prompt.response_type)) {
        const options = resolvePromptOptions(prompt);
        const rows = options.map((opt, index) => ({
          prompt_id: insertedPrompt.id,
          option_label: opt.option_label,
          option_value: opt.option_value,
          display_order: opt.display_order ?? index,
        }));
        const { error: optError } = await supabaseServer.from('prompt_response_options').insert(rows);
        if (optError) throw optError;
      }
    }

    return NextResponse.json(
      {
        success: true,
        knowledge_model: model,
        prompts_created: createdPrompts.length,
        dimensions_created: dimensionIds.length,
      },
      { status: 201 }
    );
  } catch (err) {
    if (modelId) {
      await supabaseServer.from('knowledge_models').delete().eq('id', modelId);
    }
    console.error('[content-wizard/knowledge-model] POST error:', err);
    return apiError(err, '[content-wizard/knowledge-model] POST');
  }
}
