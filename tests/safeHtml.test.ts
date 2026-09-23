// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { escapeHtml, sanitizeHtmlDocument, sanitizeHtmlFragment } from '../src/utils/safeHtml';

const PAYLOADS = [
  '<img src=x onerror="alert(1)">',
  '<script>alert(1)</script>',
  '<a href="javascript:alert(1)">x</a>',
  '<a href=" java\tscript:alert(1)">x</a>',
  '<iframe src="https://example.com"></iframe>',
  '<svg onload="alert(1)"><circle r="1"/></svg>',
  '<object data="data:text/html,<script>alert(1)</script>"></object>',
  '<meta http-equiv="refresh" content="0;url=https://example.com">',
  '<div style="color:red" onclick="alert(1)">texto</div>',
];

function hasExecutable(html: string): boolean {
  return /<script|<iframe|<object|onerror=|onload=|onclick=|javascript:|http-equiv/i.test(html);
}

describe('sanitizeHtmlFragment', () => {
  it.each(PAYLOADS)('neutraliza %s', (payload) => {
    const out = sanitizeHtmlFragment(`<p>Aluno: ${payload}</p>`);
    expect(hasExecutable(out)).toBe(false);
  });

  it('preserva o conteúdo e o layout legítimos', () => {
    const html = '<table class="grade"><tr><td style="font-weight:bold">Maria &amp; João</td></tr></table><img src="data:image/png;base64,AAAA">';
    const out = sanitizeHtmlFragment(html);
    expect(out).toContain('class="grade"');
    expect(out).toContain('font-weight:bold');
    expect(out).toContain('Maria &amp; João');
    expect(out).toContain('data:image/png');
  });
});

describe('sanitizeHtmlDocument', () => {
  it('remove scripts e handlers, mas mantém <style>', () => {
    const doc = `<!DOCTYPE html><html><head><style>.a{color:red}</style></head>
      <body onload="alert(1)"><h1>Diário</h1>${PAYLOADS.join('')}
      <script>window.onload = function(){ window.print(); }</script></body></html>`;
    const out = sanitizeHtmlDocument(doc);
    expect(hasExecutable(out)).toBe(false);
    expect(out).toContain('.a{color:red}');
    expect(out).toContain('<h1>Diário</h1>');
    expect(out.startsWith('<!DOCTYPE html>')).toBe(true);
  });
});

describe('escapeHtml', () => {
  it('escapa os caracteres especiais', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
    expect(escapeHtml(null)).toBe('');
  });
});
