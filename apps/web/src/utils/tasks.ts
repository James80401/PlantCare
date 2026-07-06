import { taskTypeLabel as sharedTaskTypeLabel, taskTypeMetadata } from '../../../../packages/shared/src';

export function taskTypeLabel(taskType: string): string {
  return sharedTaskTypeLabel(taskType);
}

export function taskTypeDescription(taskType: string): string {
  return taskTypeMetadata(taskType).description;
}

export function taskJournalPrompt(taskType: string): string {
  return taskTypeMetadata(taskType).journalPrompt;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function formatGuideBody(body: string): string {
  const lines = body.split('\n');
  const parts: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      parts.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      parts.push('</ol>');
      inOl = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      closeLists();
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      if (!inUl) {
        closeLists();
        inUl = true;
        parts.push('<ul class="list-disc pl-5 space-y-1 my-2">');
      }
      parts.push(`<li>${formatInline(bullet[1])}</li>`);
      continue;
    }

    const numbered = trimmed.match(/^\d+\.\s+(.+)$/);
    if (numbered) {
      if (!inOl) {
        closeLists();
        inOl = true;
        parts.push('<ol class="list-decimal pl-5 space-y-1 my-2">');
      }
      parts.push(`<li>${formatInline(numbered[1])}</li>`);
      continue;
    }

    closeLists();
    if (trimmed.startsWith('⚠️') || trimmed.startsWith('💡')) {
      parts.push(
        `<p class="my-2 text-sm ${trimmed.startsWith('⚠️') ? 'text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2' : 'text-emerald-800 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2'}">${formatInline(trimmed)}</p>`,
      );
    } else {
      parts.push(`<p class="my-2">${formatInline(trimmed)}</p>`);
    }
  }

  closeLists();
  return parts.join('');
}

function formatInline(text: string): string {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}
