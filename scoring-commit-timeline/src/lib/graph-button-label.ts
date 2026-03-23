/** 詳細設定の issue 入力から issue 番号を同期抽出（表示用） */
export function parseIssueNumberFromManualInput(manual: string): number | null {
  const raw = manual.trim();
  if (!raw) return null;
  const urlFull = raw.match(/github\.com\/[^/]+\/[^/]+\/issues\/(\d+)/i);
  if (urlFull) return Number(urlFull[1]);
  const numOnly = raw.match(/^#?(\d+)$/);
  if (numOnly) return Number(numOnly[1]);
  return null;
}

export function graphActionButtonLabel(opts: {
  loading: boolean;
  manualIssue: string;
  hasCandidates: boolean;
  issueNumberFromSelection: number | undefined;
}): string {
  if (opts.loading) return "読み込み中…";
  const fromManual = parseIssueNumberFromManualInput(opts.manualIssue);
  if (fromManual != null) return `→#${fromManual}を表示`;
  if (opts.hasCandidates && opts.issueNumberFromSelection != null) {
    return `→#${opts.issueNumberFromSelection}を表示`;
  }
  return "グラフを表示（最新の採点issueを選択）";
}
