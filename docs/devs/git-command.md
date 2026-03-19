やりたいことが「同じ状態から複数パターンを同時に検証したい」なら、答えはシンプルにこれだけ：

手順（これをそのままやればOK）
# 1. 今の状態から分岐を2つ作る
git branch test-a
git branch test-b
git worktree add ../web-speed-hackathon-2025 bundler-rspack

# 2. それぞれを別フォルダに展開
git worktree add ../test-a test-a
git worktree add ../test-b test-b
git worktree add ../bundler-rspack bundler-rspack 

その後の使い方
cd ../test-a
# パターンAを試す

cd ../test-b
# パターンBを試す

→ 完全に同時に検証できる

ポイント（ここだけ理解すればOK）

中身は最初完全に同じ（同じコミット）

そこから自由に変更して比較できる

お互いの未コミット変更は影響しない

終わったら
git worktree remove ../test-a
git worktree remove ../test-b
git branch -D test-a test-b
一言でまとめ

「同じブランチを使う」のではなく「同じ地点からブランチを複製して使う」


基本

git worktreeで作ったディレクトリでも：

git add .
git commit -m "変更"

→ 普通にコミットできる

重要な理解

worktreeは「別の作業フォルダ」なだけで、

Gitリポジトリは共通（.gitは1つ）

履歴も完全に共有

つまり：

どのworktreeでコミットしても、同じリポジトリに記録される

どう見えるか

例：

repo/       ← main
test-a/     ← worktree (test-aブランチ)

test-a/でコミットすると：

test-aブランチが進む

repo/からもそのコミット見える

注意点（ここ大事）
1. コミットは「そのブランチ」に入る
cd ../test-a
git branch

→ test-aにいる状態

ここでコミットすると：

mainには入らない

test-aだけ進む

2. mainに反映するにはマージ
cd repo
git merge test-a
3. 未コミット変更は共有されない

test-aで編集 → mainには影響なし

コミットすると → 全体に見える

よくある使い方

worktree A → 機能Aの実装してコミット

worktree B → 機能Bの実装してコミット

最後にまとめてマージ