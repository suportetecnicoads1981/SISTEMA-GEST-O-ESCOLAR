import React from 'react';
import { letterheadHtml, LetterheadTarget } from '../../services/documentBranding';

/**
 * Timbre padrão (logos da Gestão, SEMED e escola) para telas que imprimem direto
 * com window.print(). O HTML vem de letterheadHtml(), que já escapa os textos.
 */
export const DocumentLetterhead: React.FC<LetterheadTarget & { className?: string }> = ({ className, ...target }) => (
  <div className={className} dangerouslySetInnerHTML={{ __html: letterheadHtml(target) }} />
);

export default DocumentLetterhead;
