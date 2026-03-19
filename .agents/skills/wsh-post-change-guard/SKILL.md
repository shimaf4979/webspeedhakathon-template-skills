---
name: wsh-post-change-guard
description: Use for competition-style products after code or config changes. Run the required checks, verify VRT or visual checks, manual test obligations, score or performance impact, and regulation-sensitive behavior, then emit explicit warnings if any single check fails, is skipped, or remains uncertain.
---

# Post Change Guard

この skill は、競技形式のプロダクトで変更作業をしたあとに、確認漏れを防ぐために使う。

主目的:

- 変更後の必須確認を漏れなく実行する
- VRT / 手動テスト / スコア計測 / レギュレーション観点をまとめて確認する
- 1つでも失敗、未確認、不明があれば明確に警告する
- 作業報告とチェックリスト更新漏れを防ぐ

## When to use

次のどれかに当てはまるときに使う。

- パフォーマンス改善を行った
- UI / 動画 / API / SSR / 配信まわりを変更した
- 画像、bundle、遅延読み込み、キャッシュ、レンダリング順序を変更した
- 競技提出前の最終確認をしたい
- 「この変更を出してよいか」を判断したい

## Required workflow

変更後は、原則として次の順で確認する。

1. 変更内容の把握
2. 影響範囲の特定
3. 自動テストと VRT
4. 手動テスト観点の確認
5. スコアまたは性能の再計測
6. レギュレーション観点の確認
7. チェックリスト更新
8. 作業報告

## Step 1: Understand the change

最初に次を短く整理する。

- 何を変えたか
- どの画面や機能に影響するか
- スコア改善が狙いか、保守変更か

影響範囲が広い変更ほど、後段の確認も広げる。

## Step 2: Identify affected areas

最低でも次を分類する。

- どのページや画面に触れたか
- 認証や権限制御に触れたか
- 動画、音声、画像、配信に触れたか
- API やデータ取得に触れたか
- SSR / 初期 HTML / hydration に触れたか
- static assets や bundle に触れたか

この分類に応じて、後続の VRT と手動確認対象を増やす。

## Step 3: Run automated checks

まず repo にある既存導線を優先する。

- test
- e2e
- Playwright
- VRT
- screenshot compare

snapshot 更新系コマンドがある場合の注意:

- 失敗隠しのために使わない
- 更新後も、その見た目が正しいかを別で確認する

## Step 4: Manual check obligations

VRT が通っても、手動テスト義務は消えない。

repo の手動テスト項目、レギュレーション文書、提出要件を確認し、変更箇所に関連する項目を手で確認する。

特に注意するもの:

- 自動再生や遅延表示
- 動画や画像の劣化
- カルーセルやスクロール挙動
- モーダルの開閉
- ログイン / ログアウト
- 権限制御
- プレイヤー操作
- hover や focus の見た目
- 遷移時ローディング

## Step 5: Measure score or performance again

変更後は、競技で重視されるスコアや性能指標を再計測する。

候補:

- Lighthouse
- Core Web Vitals
- bundle size
- custom scoring tool
- replay / playback timing

少なくとも次を確認する。

- 改善したかった指標が本当に改善したか
- 悪化した指標がないか
- 変更前後比較があるか

## Step 6: Regulation review

必ず competition の regulation, rules, checklist を確認し、次を満たすか判断する。

- 著しい機能落ちがない
- 著しいデザイン差異がない
- 提供テストや VRT が失敗しない
- 手動テスト項目が失敗しない
- テスト通過だけを狙う悪意ある実装ではない
- 採点逃れのためだけの不自然な遅延や省略がない
- 提出要件や初期化要件が壊れていない

## Step 7: Checklist update

repo にチェックリスト運用があるなら、改善後に更新する。

- 実ファイル側のチェックリストを更新する
- テンプレート更新と実ファイル更新を混同しない
- 対応済み、未着手、保留を区別して残す

## Step 8: Final report

最後に必ず報告へ含める。

- 完了か一部実施か
- どこを変更したか
- 何を確認したか
- どこが未確認か
- 残件

## Warning policy

次のどれか 1 つでも当てはまる場合、最終回答の冒頭で `WARNING:` を使って明示する。

- テスト失敗
- VRT 失敗
- 手動確認未実施
- スコアまたは性能が悪化
- レギュレーション違反の疑い
- 提出要件未確認
- 変更範囲に対して確認不足
- snapshot を更新したが妥当性確認なし
- チェックリスト未更新
- ユーザーが要求した確認を実施できなかった

警告時の書き方:

- `WARNING: VRT が失敗しているため、この変更は提出前に再確認が必要です。`
- `WARNING: 手動テスト未確認のため、提出可否をまだ判断できません。`
- `WARNING: スコアが悪化しています。改善目的の変更としては採用非推奨です。`

曖昧にぼかさない。

## Minimum acceptance bar

次をすべて満たさない限り、「安全に出せる」と断定しない。

- VRT や視覚確認が通る、または未実施理由が明確
- 関連手動テストを確認済み
- スコアや性能の悪化がない、または悪化を受容する理由が明確
- レギュレーション違反の疑いがない

1つでも欠ける場合は、保留または警告扱いにする。

## Preferred commands

その repo にある既存コマンドを優先する。

- `just`
- `pnpm`
- `npm`
- `yarn`
- `playwright`
- `lighthouse`

既存導線がない場合のみ、根拠を示して直接コマンドを組む。

## Final response expectations

回答では次を短く整理する。

1. 何を確認したか
2. 失敗や未確認があるか
3. 提出してよい状態か、保留か
4. 警告があるなら `WARNING:` で明示
