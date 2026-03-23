<script lang="ts">
  let {
    repoOverride = $bindable(""),
    issueInputManual = $bindable(""),
  }: {
    repoOverride?: string;
    issueInputManual?: string;
  } = $props();
</script>

<details class="advanced">
  <summary>詳細設定（参加リポ・issue を手入力）</summary>
  <div class="advanced-body">
    <div class="field">
      <label for="repo">参加リポジトリ（上書き）</label>
      <input
        id="repo"
        type="text"
        bind:value={repoOverride}
        placeholder="空なら ログイン/web-speed-hackathon-2026"
        autocomplete="off"
      />
    </div>
    <div class="field">
      <label for="issue">採点 issue（URL または番号）</label>
      <input
        id="issue"
        type="text"
        bind:value={issueInputManual}
        placeholder="https://github.com/CyberAgentHack/web-speed-hackathon-2026-scoring/issues/74 または 74"
        autocomplete="off"
      />
    </div>
    <p class="hint">
      ここに入力があるときは個別候補の一覧・チェックより<strong>優先</strong>します。空のときはチェックした
      issue、なければログイン名で自動検索します。
    </p>
  </div>
</details>

<style>
  .field {
    margin-bottom: 0.85rem;
  }

  .field label {
    display: block;
    font-size: 0.8rem;
    color: #333;
    margin-bottom: 0.25rem;
    font-weight: 600;
  }

  .field input {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 0.45rem 0.55rem;
    border: 1px solid #bbb;
    border-radius: 3px;
    background: #fff;
    color: #111;
    font-size: 0.95rem;
  }

  .hint {
    font-size: 0.78rem;
    color: #555;
    margin: 0.5rem 0 0;
    line-height: 1.45;
  }

  .advanced {
    margin-top: 1rem;
    border-top: 1px solid #e0e0e0;
    padding-top: 0.75rem;
  }

  .advanced summary {
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    color: #222;
    user-select: none;
  }

  .advanced-body {
    margin-top: 0.75rem;
    padding-left: 0.25rem;
  }
</style>
