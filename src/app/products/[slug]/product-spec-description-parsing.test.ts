import { describe, expect, it } from 'vitest';

import { parseRowsFromLabeledStrong } from './product-spec-description-parsing';

describe('parseRowsFromLabeledStrong', () => {
  it('parses values after spacer strong tags', () => {
    const html =
      '<h1><strong>Բնութագիր</strong></h1>\\n<strong>Ընդհանուր չափսերը</strong><strong>   </strong><strong> </strong>575x470x200\\n<strong>Թասի չափսը</strong><strong>   </strong>398X325';
    expect(parseRowsFromLabeledStrong(html)).toEqual([
      { key: 'Ընդհանուր չափսերը', value: '575x470x200' },
      { key: 'Թասի չափսը', value: '398X325' },
    ]);
  });

  it('parses label text with strong-wrapped values', () => {
    const html =
      '<h1><strong>   Բ</strong><strong>նութագիր</strong></h1>\\nԿիրառման տեսակը <strong>Ջրի եռման համար</strong>\\nԳույնը <strong>Սև</strong>';
    expect(parseRowsFromLabeledStrong(html)).toEqual([
      { key: 'Կիրառման տեսակը', value: 'Ջրի եռման համար' },
      { key: 'Գույնը', value: 'Սև' },
    ]);
  });
});
