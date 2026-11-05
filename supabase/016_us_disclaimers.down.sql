-- Reverts 016_us_disclaimers.sql when the US wording is still in place.

UPDATE public.assessments
SET disclaimer = 'Educational self-check only. This is not a sleep study or a diagnosis, and it does not replace professional care.',
    updated_at = now()
WHERE slug = 'sleep'
  AND disclaimer = 'Educational self-check only. This is not a sleep study or a diagnosis, and it does not replace care from a professional licensed in your state.';

UPDATE public.assessments
SET disclaimer = 'Educational self-check only. This is not a medical or mental health diagnosis and does not replace professional care.',
    updated_at = now()
WHERE slug = 'pss-10'
  AND disclaimer = 'Educational self-check only. This is not a medical or mental health diagnosis, it does not create a provider relationship, and it does not replace care from a professional licensed in your state.';

UPDATE public.assessments
SET disclaimer = 'Educational self-check only. This measures self-reported resilience for content routing — not a clinical assessment.',
    updated_at = now()
WHERE slug = 'brs'
  AND disclaimer = 'Educational self-check only. This measures self-reported resilience for content routing. It is not a clinical assessment under any state licensing rule.';

UPDATE public.assessments
SET disclaimer = 'This audit routes you to a standard workbook by topic. It does not diagnose burnout or any medical condition.',
    updated_at = now()
WHERE slug = 'lifestyle-energy'
  AND disclaimer = 'This audit routes you to a standard workbook by topic. It does not diagnose burnout or any medical condition, and it does not replace care from a professional licensed in your state.';

UPDATE public.assessments
SET disclaimer = 'Educational self-check only. This is not a diet, a body-mass program, or medical advice, and it does not replace professional care.',
    updated_at = now()
WHERE slug = 'body-composition'
  AND disclaimer = 'Educational self-check only. This is not a diet, a body-mass program, or medical advice, and it does not replace care from a professional licensed in your state.';
