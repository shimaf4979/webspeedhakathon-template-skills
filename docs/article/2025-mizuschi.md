(自分は作問担当でも中の人でもなんでもない。ハッカソン参加者)

自分の最終結果はスコア上は 365/1200 で 12位だったが、レギュレーション失格で落ちた、というかレギュレーションを通せた人が上位16人で1人だけ。
結果から言えばレギュレーション守って300点以上とるゲームだった。

学べること
クライアントサイド
ランタイム負荷の計測
静的解析によるバンドル解析
やばいアセットの発見
CSSの静的抽出による(CLS改善)
サーバーサイド
sqlite のチューニング
SSR実装
動画配信のプロトコル
とにかく大量のライブラリツールチェインを乗り越える力(現場っぽい)
富豪的な実装のライブラリを自分で置き換える力(時間内無理)
環境構築
node.js / pnpm
playwright (Optional)
$ git clone https://github.com/CyberAgentHack/web-speed-hackathon-2025
$ cd web-speed-hackathon-2025
$ pnpm install
$ pnpm start

http://localhost:8000 で立ち上がる。

VRT(レンダリング結果の一致) を実行したい人は、workspaces/test を実行する

$ cd workspaces/test
$ pnpm playwirght install-deps
$ pnpm playwirght test

# headful でデバッグ
$ pnpm playwirght test --debug
# UIダッシュボードを作る
$ pnpm playwirght test --ui

以下、自分がやった手順を思い出しながら書いていく。実質的なスポイラーなので、自分でやりたい人は解いてから見るように！！！！！！！！！！

.
.
.
.
.
.
.
.
.
.
.
.
.
.



返信
返信を追加
mizchi
mizchi
2025/03/24に更新

AIでプロジェクト構成を把握
初手こそAIの使い所

このプロジェクトの技術構成の要約をまとめて

### `/workspaces/client`

フロントエンドの実装を担当するワークスペースです。

- **主要技術**:
  - React 19とReact Router 7によるSPA実装
  - Zustandを使用した状態管理
  - UnoCSS（Tailwind互換）によるスタイリング
  - Webpackによるバンドル
  - 複数の動画プレーヤーライブラリ（Shaka Player, HLS.js, Video.js）
- **アーキテクチャ**:
  - Featureベースのディレクトリ構造（auth, channel, dialog, episode, player, program, series, timetableなど）
  - SSRとクライアントサイドのハイドレーション
  - Zustandによる状態管理とコンテキスト提供
- **ビルド設定**:
  - Babel設定（@babel/preset-env, @babel/preset-react, @babel/preset-typescript）
  - コア機能のポリフィル
  - FFmpegのWebAssembly統合

### `/workspaces/server`

バックエンドサーバーの実装を担当するワークスペースです。

- **主要技術**:
  - Fastifyによる高速なWebサーバー
  - Drizzle ORMによるSQLiteデータベース操作
  - SSRによるReactコンポーネントのレンダリング
  - OpenAPIによるAPI仕様定義
- **主要機能**:
  - RESTful API提供
  - 動画ストリーミング
  - サーバーサイドレンダリング
  - セッション管理とユーザー認証
- **データベース**:
  - SQLiteを使用したローカルデータベース
  - Drizzle ORMによるマイグレーション管理

### `/workspaces/schema`

データモデルとAPIインターフェースを定義するワークスペースです。

- **主要技術**:
  - Drizzle ORMによるデータベーススキーマ定義
  - Zodによるバリデーションスキーマ
  - OpenAPIによるAPI仕様
- **データモデル**:
  - ユーザー（認証情報）
  - チャンネル（放送局）
  - 番組（放送スケジュール）
  - シリーズ（番組シリーズ）
  - エピソード（各回の動画コンテンツ）
  - ストリーム（動画データ）
  - レコメンデーション（おすすめコンテンツ）

### `/workspaces/configs`

プロジェクト全体で共有される設定ファイルを管理するワークスペースです。

- **主要技術**:
  - ESLint 9（コード品質チェック）
  - Prettier 3（コードフォーマット）
  - TypeScript 5.7（型チェック）
- **設定内容**:
  - 厳格なTypeScript設定
  - コードスタイルとフォーマットルール
  - インポート順序やコード整理のルール

### `/workspaces/test`

テスト環境を提供するワークスペースです。

- **主要技術**:
  - Playwright（E2Eテスト）
  - ビジュアルリグレッションテスト（VRT）
- **テスト内容**:
  - ユーザー認証フロー
  - 全ページ表示テスト
  - トップページ機能テスト
- **設定**:
  - Chrome環境でのテスト実行
  - スクリーンショット比較による視覚的テスト

## 使用技術

### フロントエンド
- React 19
- React Router 7
- Zustand (状態管理)
- UnoCSS (スタイリング)
- Webpack (バンドラー)
- 複数の動画プレーヤーライブラリ (Shaka Player, HLS.js, Video.js)

### バックエンド
- Fastify (Webサーバー)
- Drizzle ORM (データベース操作)
- SQLite (データベース)
- Zod (バリデーション)
- OpenAPI (API仕様)

### ビルド・開発ツール
- wireit: npmスクリプトを拡張するビルドオーケストレーションツール
  - スクリプト間の依存関係管理
  - ファイル変更の監視と増分ビルド
  - ビルド出力のキャッシング
  - 環境変数の設定
```

逆にここ以外であんまりAI使ってない。あとでDrizzleのスキーマを修正させたぐらい。

特徴的なのは wireit で、これがタスクランナーになってる。

workspaces/server/package.json
  "scripts": {
    "database:migrate": "wireit",
    "database:reset": "wireit",
    "dev": "wireit",
    "format": "wireit",
    "format:eslint": "wireit",
    "format:prettier": "wireit",
    "heroku-start": "wireit",
    "start": "wireit"
  },
  "wireit": {
    "start": {
      "command": "tsx -r ./loaders/png.cjs ./src/index.ts",
      "service": true,
      "env": {
        "API_BASE_URL": {
          "external": true,
          "default": "http://localhost:8000/api"
        },
        "PORT": {
          "external": true,
          "default": "8000"
        }
      },
      "files": [
        "../../pnpm-lock.yaml",
        "../schema/src/**/*",
        "./src/**/*"
      ],
      "dependencies": [
        "../client:build"
      ]
    },



これを読み解くと pnpm start は次の2つを実行してることがわかる。

workspaces/client: webpack
workspaces/server: API_BASE_URL="/api" PORT=8000 tsx -r ./loaders/png.cjs ./src/index.ts
pnpm start はクライアントをフルビルドしてからサーバーを立ち上げるが、webpack が非常に重いのでタスクを別々に管理してデバッグできるようにしておくのが大事そうだった。



返信
返信を追加
mizchi
mizchi
2025/03/24に更新

初期計測
推測するな、計測せよ、ということで、何も修正してない状態から計測する。

最初に fetch を上書きしてAPIごとの実行時間を計測した。

workspaces/client/src/main.tsx
// const originalFetch = fetch;
// globalThis.fetch = async (...args) => {
//   const url = args[0];
//   console.time(`fetch: ${url}`);
//   const response = await originalFetch(...args);
//   console.timeEnd(`fetch: ${url}`);
//   if (!response.ok) {
//     throw new Error(response.statusText);
//   }
//   return response;
// };

初期画面のクエリで3500ms
main.js が 60MB
ランタイム
unocss(CSS in JS) の動的ランタイム
getBoudingClientRect()発行しすぎ (合計2000msぐらいのCPUブロッキング)
おそらく↑のheight計算後のレンダリングで、再レンダリングが発生しまく り
巨大アセット
ffmpeg-wasm
やたら巨大な .svg
Lighthouseは重すぎて計測不可
自分はWSL環境だったので、この状態でplaywight testで自前のスクリーンショットを撮っておいた。公式は macbook 想定で darwin しかなかった。

webpack build もやたら時間がかかる。

修正手順を考える
とにかく重い事自体で計測サイクルが回らない
コスパ良さそうな範囲で止血していく
sqlite が重いのはインデックスなかったりN+1ありそう。
可能な範囲で、難しいクエリは後回し
初手で webpack => rspack にする
ある程度のAPI互換性があり、雑に入れ替えても4~6倍速くなる。
今回は chrome で動けば良さそうなのでpolyfillとかもある程度消す
chunk 化もデバッグが難しくならない範囲で入れておく
ffmpeg-wasm に対処する
初期状態で言えることは、ある程度修正しないと、数字が混ざって次の問題が見えない



返信
返信を追加
mizchi
mizchi
2025/03/24に更新

サーバーサイドの止血
わざとらしい delay
createRoutes.tsx
import lazy from 'p-min-delay';
...
            const { HomePage, prefetch } = await lazy(
              import('@wsh-2025/client/src/pages/home/components/HomePage'),
              1000,
            );

単に消す。

drizzle-sqlite にインデックスを張る
fetchプロキシの計測結果だと、 recommendedModules が激しく重い。

ここが重い。どう見ても速いわけがない。

    handler: async function getRecommendedModules(req, reply) {
      const database = getDatabase();

      const modules = await database.query.recommendedModule.findMany({
        orderBy(module, { asc }) {
          return asc(module.order);
        },
        where(module, { eq }) {
          return eq(module.referenceId, req.params.referenceId);
        },
        with: {
          items: {
            orderBy(item, { asc }) {
              return asc(item.order);
            },
            with: {
              series: {
                with: {
                  episodes: {
                    orderBy(episode, { asc }) {
                      return asc(episode.order);
                    },
                  },
                },
              },
              episode: {
                with: {
                  series: {
                    with: {
                      episodes: {
                        orderBy(episode, { asc }) {
                          return asc(episode.order);
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });
      reply.code(200).send(modules);
    },
  });

これを修正したい。

スキーマを見ると order と referenceId にインデックスがないので張っておく。

workspaces/schema/src/database/schema.ts
  (table) => [
    t.index('idx_recommendedModule_order').on(table.order),
    t.index('idx_recommendedModule_referenceId').on(table.referenceId),
  ],

(他も色々インデックス張って回った)

クエリを書き直す。episodes も最初の一件しかいらないので limit をつける。

workspaces/server/src/api.ts
      const modules = await database.query.recommendedModule.findMany({
        orderBy(module, { asc }) {
          return asc(module.order);
        },
        where(module, { eq }) {
          return eq(module.referenceId, req.params.referenceId);
        },
        with: {
          items: {
            orderBy(item, { asc }) {
              return asc(item.order);
            },
            with: {
              series: {
                with: {
                  episodes: {
                    orderBy(episode, { asc }) {
                      return asc(episode.order);
                    },
                    limit: 1,
                  },
                },
              },
              episode: {
                with: {
                  series: {
                    with: {
                      episodes: { limit: 1 },
                    },
                  },
                },
              },
            },
          },
        },
      });

まだ、全然修正できそうだが、これで 3500ms=>400~1300ms になったので一旦計測ストレスは耐えられる範囲になった。クライアント側に行く。



返信
返信を追加
mizchi
mizchi
2025/03/24に更新

クライアントの止血
webpack => rspack にした。これは前に仕事で使ったことがあり、ほぼ無設定でビルドが4倍速くなった。

 import webpack from 'webpack';
 import { rspack } from '@rspack/core';

rspack は builtin の swc があるので、babel-loader も最初に置き換えてしまった。

        test: /\.(?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$/,
        // exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            target: 'es2020',
            parser: {
              syntax: 'typescript',
              jsx: true,
            },
            transform: {
              react: { runtime: 'automatic', },
            },
          },
        },
        type: 'javascript/auto',
      },

Chunk 設定

new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }) が chunk 化を邪魔してるので、単に消す。
inline-source-map が常に有効化されてるので、消す。自分はなくても読めるので。
chunkFormat: false をコメントアウトする
rspack 版 bundle analyzer の rsdoctor を入れておく
チャンク設定とか適用した版。このファイルはあとでやる unocss 周りの設定も混ざってるが、ほとんどそのままの設定でいけた。

workspaces/client/rspack.config.mjs
import path from 'node:path';
import { rspack } from '@rspack/core';
import { UnoCSSRspackPlugin } from '@unocss/webpack/rspack';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';

/** @type {import('webpack').Configuration} */
const config = {
  // devtool: 'inline-source-map',
  devtool: false,
  entry: './src/main.tsx',
  mode: 'production',
  experiments: {
    css: true,
  },
  module: {
    rules: [
      {
        exclude: [/node_modules\/video\.js/, /node_modules\/@videojs/],
        resolve: {
          enforceExtension: false,
        },
        test: /\.(?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$/,
        // exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            target: 'es2020',
            parser: {
              syntax: 'typescript',
              jsx: true,
            },
            transform: {
              react: { runtime: 'automatic' },
            },
          },
        },
        type: 'javascript/auto',
      },
      {
        test: /\.png$/,
        type: 'asset/inline',
      },
      {
        resourceQuery: /raw/,
        type: 'asset/source',
      },
      {
        test: /\.css$/i,
        type: 'css/auto',
        use: ['postcss-loader'],
        include: [path.resolve(import.meta.dirname, 'src')],
      },
    ],
  },
  output: {
    chunkFilename: 'chunk-[contenthash].js',
    // chunkFormat: false,
    filename: 'main.js',
    path: path.resolve(import.meta.dirname, './dist'),
    publicPath: 'auto',
  },
  plugins: [
    UnoCSSRspackPlugin(),
    process.env.RSDOCTOR &&
      new RsdoctorRspackPlugin({
        // plugin options
      }),
  ].filter(Boolean),
  resolve: {
    extensions: ['.js', '.cjs', '.mjs', '.ts', '.cts', '.mts', '.tsx', '.jsx'],
  },
};

export default config;

vite化したら1日溶けてたと思う。



返信
返信を追加
mizchi
mizchi
2025/03/24に更新

バンドル解析
rspack+rsdoctor でサイズを確認した。



$ RSDOCTOR=1 NODE_ENV=production pnpm rspac
$ pnpm rsdoctor analyze --profile dist/.rsdoctor/manifest.json

この辺が重いのがわかる。

ffmpeg-wasm
hls.js
video.js
これは色々やったあとの結果



Treeshaking
create_player.ts では playerType で動画プレイヤーを分岐しているが、これらが同じチャンクに同居する必要性がなさそう。

しかし同じファイルかつ import '@videojs/http-streaming'; の sideEffect があることで treeshaking が失敗するのがわかる。

次のように書き換えた。

create_player.ts
import { PlayerType } from '@wsh-2025/client/src/features/player/constants/player_type';
import { PlayerWrapper } from '@wsh-2025/client/src/features/player/interfaces/player_wrapper';

export const createPlayer = async (playerType: PlayerType): Promise<PlayerWrapper> => {
  switch (playerType) {
    case PlayerType.ShakaPlayer: {
      const { ShakaPlayerWrapper } = await import('./ShakaPlayerWrapper');
      return new ShakaPlayerWrapper(playerType);
    }
    case PlayerType.HlsJS: {
      const { HlsJSPlayerWrapper } = await import('./HlsJSPlayerWrapper');
      return new HlsJSPlayerWrapper();
    }
    case PlayerType.VideoJS: {
      const { VideoJSPlayerWrapper } = await import('./VideoJSPlayerWrapper');
      return new VideoJSPlayerWrapper(playerType);
    }
    default: {
      playerType satisfies never;
      throw new Error('Invalid player type.');
    }
  }
};

この時点でだいぶTBTよくなってきた



返信
返信を追加
mizchi
mizchi
2025/03/24に更新

サーバーのSSR化
ssr.tsx がSSRした結果をクライアントで使っていない。
StaticRouteHandler を hydrate:true にしてSSR結果をクライアントに渡すようにしてみた。

  app.get('/*', async (req, reply) => {
    // @ts-expect-error ................
    const request = createStandardRequest(req, reply);

    const store = createStore({});
    const handler = createStaticHandler(createRoutes(store));
    const context = await handler.query(request);

    if (context instanceof Response) {
      return reply.send(context);
    }

    const router = createStaticRouter(handler.dataRoutes, context);
    const html = renderToString(
      <StrictMode>
        <StoreProvider createStore={() => store}>
          <StaticRouterProvider context={context} hydrate={true} router={router} />
        </StoreProvider>
      </StrictMode>,
    );

    const rootDir = path.resolve(__dirname, '../../../');
    const imagePaths = [
      getFilePaths('public/images', rootDir),
      getFilePaths('public/animations', rootDir),
      getFilePaths('public/logos', rootDir),
    ].flat();

    reply.type('text/html').send(/* html */ `
      <!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charSet="UTF-8" />
          <meta content="width=device-width, initial-scale=1.0" name="viewport" />
          <link rel="preload" href="/public/arema.svg" as="image" />
          <style>
            html, body {
              background-color: #000000;
            }
          </style>
          ${imagePaths.map((imagePath) => `<link as="image" href="${imagePath}" rel="preload" />`).join('\n')}
        </head>
        <body>${html}</body>
      </html>
    `);
  });

この時点だとCSSのハイドレーションができていないので、まだ恩恵がない。というかSSRハイドレーションに3.2MBのデータを渡してしまうので、単に重くなる。

SSRするなら unocss の動的スタイル吐き出しを静的に書き直す必要がある。

workspaces/client/src/setups/unocss.ts

こいつを読み込まないように書き直す必要がある。

import { IconifyJSON } from '@iconify/types';
import presetIcons from '@unocss/preset-icons/browser';
import presetWind3 from '@unocss/preset-wind3';
import initUnocssRuntime, { defineConfig } from '@unocss/runtime';

async function init() {
  await initUnocssRuntime({
    defaults: defineConfig({
      layers: {
        default: 1,
        icons: 0,
        preflights: 0,
        reset: -1,
      },
      preflights: [
        {
          getCSS: () => import('@unocss/reset/tailwind-compat.css?raw').then(({ default: css }) => css),
          layer: 'reset',
        },
        {
          getCSS: () => /* css */ `
          @view-transition {
            navigation: auto;
          }
          html,
          :host {
            font-family: 'Noto Sans JP', sans-serif !important;
          }
          video {
            max-height: 100%;
            max-width: 100%;
          }
        `,
        },
        {
          getCSS: () => /* css */ `
          @keyframes fade-in {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `,
        },
      ],
      presets: [
        presetWind3(),
        presetIcons({
          collections: {
            bi: () => import('@iconify/json/json/bi.json').then((m): IconifyJSON => m.default as IconifyJSON),
            bx: () => import('@iconify/json/json/bx.json').then((m): IconifyJSON => m.default as IconifyJSON),
            'fa-regular': () =>
              import('@iconify/json/json/fa-regular.json').then((m): IconifyJSON => m.default as IconifyJSON),
            'fa-solid': () =>
              import('@iconify/json/json/fa-solid.json').then((m): IconifyJSON => m.default as IconifyJSON),
            fluent: () => import('@iconify/json/json/fluent.json').then((m): IconifyJSON => m.default as IconifyJSON),
            'line-md': () =>
              import('@iconify/json/json/line-md.json').then((m): IconifyJSON => m.default as IconifyJSON),
            'material-symbols': () =>
              import('@iconify/json/json/material-symbols.json').then((m): IconifyJSON => m.default as IconifyJSON),
          },
        }),
      ],
    }),
  });
}

init().catch((err: unknown) => {
  throw err;
});

ぱっと見、 @unocss/reset/tailwind-compat.css?raw が無駄そうなので、初期CSSに含めてしまえば良さそう。
unocssについて調べた結果、この設定を uno.config.ts に移動すればいいのだが、色々修正する必要がある。

大事なのは次の設定を足すこと。

  content: {
    filesystem: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  },

これによってSSR分岐時に src/**/*.tsx に書かれたものが抽出される。(tailwindでおなじみのpurge処理) tailwind 互換モードなので、頑張れば tailwind 互換に書き換えられたかもしれない。

VRT の修正
SSR 化した時点でVRTが落ちていた。

このテストシナリオ。

  test('新規会員登録 -> ログアウト -> ログイン', async ({ page }) => {
    // コンフリクトしないようにテスト用のメールアドレスを生成
    const email = `test.${Date.now()}@example.com`;

    await test.step('サイドバーのログインボタンをクリック', async () => {
      const sidebar = page.getByRole('complementary');
      await sidebar.getByRole('button', { name: 'ログイン' }).click();
    });

    await test.step('ログインダイアログが表示される', async () => {
      const signInDialog = page.getByRole('dialog');
      await expect(signInDialog).toBeVisible();
      const signInDialogPanel = signInDialog.locator('>div');

      await waitForImageToLoad(signInDialogPanel.locator('img').first());
      await expect(signInDialogPanel).toHaveScreenshot('vrt-signIn-dialog.png');
    });

pnpm playwright test --debug で目視デバッグすると、モーダルが出現していない。

これは hydration 前にSSRした ボタンをクリックしてしまっていることが原因だと気づいた。解決方法としては、hydration 前には disabled 属性をつけておくと、getByRole の解決が disabled 解除時点になるはず。

なのでこう。

Layout.tsx
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  });

  //..
            <button
              className="block flex h-[56px] w-[188px] items-center justify-center bg-transparent pb-[8px] pl-[20px] pr-[8px] pt-[8px]"
              type="button"
              disabled={!mounted} /* これを追加 *
              onClick={isSignedIn ? authActions.openSignOutDialog : authActions.openSignInDialog}
            >

これでテストはパスしたのだが...

playwright.config.ts
export default defineConfig({
  expect: {
    timeout: 60_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.03,
    },
  },

結果から言うと、VRTは通ってるがレギュレーションは満たしていない。
unocss の動的分岐でミスってアイコンが落ちてる。

unocssの静的ルール抽出は tsx 内の動的分岐の文字列組み立てに対応できなくなる。次のパターン。

              <div
                className={`i-fa-solid:${isSignedIn ? 'sign-out-alt' : 'user'} m-[4px] size-[20px] shrink-0 grow-0`}
              />

このパターン自体は認識していて、`className={`` で目視である程度抽出していたが、これは漏れた。

とはいえ、ある程度はうまくいってるとして(VRT通ってるし...)、これを読み込む postcss.config.ts と rspack を設定する。

postcss.config.ts
import UnoCSS from '@unocss/postcss';
export default {
  plugins: [UnoCSS()],
};

rspack.config.ts

// import
import { UnoCSSRspackPlugin } from '@unocss/webpack/rspack';

// CSS抽出機能を有効化
  experiments: {
    css: true,
  },


// loader
      {
        test: /\.css$/i,
        type: 'css/auto',
        use: ['postcss-loader'],
        include: [path.resolve(import.meta.dirname, 'src')],
      },
// plugins
  plugins: [
    UnoCSSRspackPlugin(),
  ]

で、これを読み込む main.css に除外した reset css を含めて設置する。

@import '@unocss/reset/tailwind-compat.css';
@unocss preflights;
@unocss default;
:root {
  --un-bg-opacity: 1;
}

--un-bg-opacity の部分はこれがないとポップアップのモーダルの背景色がおかしくなる部分があった。
理由は追ってない。なにかの優先度だと思う。

main.tsx から unocss のセットアップを除外。

 import '@wsh-2025/client/src/setups/unocss';

Document.tsx の js 読み込み前に css 読み込みを追加する。これによってCLSを抑制できる。

src/app/Document.tsx
export const Document = () => {
  return (
    <html className="size-full" lang="ja">
      <head>
        <meta charSet="UTF-8" />
        <meta content="width=device-width, initial-scale=1.0" name="viewport" />
        <link href="/public/main.css" rel="stylesheet" />
        <script src="/public/main.js" type="module"></script>
      </head>
      <body className="size-full bg-[#000000] text-[#ffffff]">
        <Suspense>
          <Layout>
            <Outlet />
          </Layout>
        </Suspense>
        <ScrollRestoration />
      </body>
    </html>
  );
};

他に細かいことは色々やったが、この時点でSSRが成功し、チャンク化と合わせてトップ画面の CLS/TBT が満点になった。

手元でここのVRTはパスしていたのだが、アイコンがなくても maxPixelDiffRatio の 0.03 (3%の誤差) を満たしていてるようで、検知されなかった。
テストが通ることだけを優先していたのだが、ちゃんと目視していればよかった。



返信
返信を追加
mizchi
mizchi
2025/03/24

/timetable
次に番組表を改善した。

Devtools で Network を見ていたらわかるが、番組タイトルで、やばい svg が埋まっている。

$ ls -la public/logos/*.svg
.rw-r--r-- 5.4M mizchi 22 Mar 21:42 public/logos/anime.svg
.rw-r--r-- 476k mizchi 22 Mar 21:42 public/logos/documentary.svg
.rw-r--r-- 5.4M mizchi 22 Mar 21:42 public/logos/drama.svg
.rw-r--r-- 3.6M mizchi 22 Mar 21:42 public/logos/fightingsports.svg
.rw-r--r-- 3.6M mizchi 22 Mar 21:42 public/logos/mahjong.svg
.rw-r--r-- 3.6M mizchi 22 Mar 21:42 public/logos/music.svg
.rw-r--r-- 476k mizchi 22 Mar 21:42 public/logos/news.svg
.rw-r--r-- 528k mizchi 22 Mar 21:42 public/logos/reality.svg
.rw-r--r-- 3.6M mizchi 22 Mar 21:42 public/logos/shogi.svg
.rw-r--r-- 5.4M mizchi 22 Mar 21:42 public/logos/soccer.svg
.rw-r--r-- 3.6M mizchi 22 Mar 21:42 public/logos/sumo.svg
.rw-r--r-- 528k mizchi 23 Mar 15:39 public/logos/variety.svg

これはテキストエディタで開くと理由がわかる。全部のファイルに font が base64 で埋まっている。



これは既存の .svg オプティマイズツールに突っ込んでも改善できない。
これの本来の解き方は、

svg の base64 部分を抽出する
fonttool でサブセットフォントを作る or png 化
なのだが、自分は真面目にやろうとして時間とかしてしまったので、諦めて手作業でスクショで置き換えた

$ ls -la public/logos/*.png
.rw-r--r-- 1.8k mizchi 23 Mar 17:29 public/logos/anime.png
.rw-r--r-- 2.5k mizchi 23 Mar 17:29 public/logos/documentary.png
.rw-r--r-- 2.2k mizchi 23 Mar 17:29 public/logos/drama.png
.rw-r--r-- 2.6k mizchi 23 Mar 17:29 public/logos/fightingsports.png
.rw-r--r-- 2.7k mizchi 23 Mar 17:29 public/logos/mahjong.png
.rw-r--r-- 2.2k mizchi 23 Mar 17:29 public/logos/music.png
.rw-r--r-- 1.5k mizchi 23 Mar 17:29 public/logos/news.png
.rw-r--r-- 3.1k mizchi 23 Mar 17:29 public/logos/reality.png
.rw-r--r-- 2.9k mizchi 23 Mar 17:29 public/logos/shogi.png
.rw-r--r-- 2.2k mizchi 23 Mar 17:29 public/logos/soccer.png
.rw-r--r-- 3.4k mizchi 23 Mar 17:29 public/logos/sumo.png
.rw-r--r-- 2.4k mizchi 23 Mar 17:29 public/logos/variety.png



返信
返信を追加
mizchi
mizchi
2025/03/24に更新

ランタイムCPU処理対策
ランタイムで getBoundingClientRect 発行しすぎ。ここの黄色い山。



これはある程度改善後なのだが、動的に高さを監視する要素が大量にいて、React の 再 render が発火しまくっている。



(ちなみにこれはDevToolsPerformanceのTotalTimeを見るとわかる)

改善前は getComputedBoudingRect が 1.5s ぐらいあった。

1. Hoverable
要素のマウスオーバー判定をしている。

export const Hoverable = (props: Props) => {
  const child = Children.only(props.children);
  const elementRef = useRef<HTMLDivElement>(null);

  const mergedRef = useMergeRefs([elementRef, child.props.ref].filter((v) => v != null));

  const pointer = usePointer();
  const elementRect = elementRef.current?.getBoundingClientRect();

  const hovered =
    elementRect != null &&
    elementRect.left <= pointer.x &&
    pointer.x <= elementRect.right &&
    elementRect.top <= pointer.y &&
    pointer.y <= elementRect.bottom;

  return cloneElement(child, {
    className: classNames(
      child.props.className,
      'cursor-pointer',
      hovered ? props.classNames.hovered : props.classNames.default,
    ),
    ref: mergedRef,
  });
};

これは usePointer をみている。

export function usePointer(): { x: number; y: number } {
  const s = useStore((s) => s);
  return s.features.layout.pointer;
}

useSubscribePointer の実装

import { useEffect } from 'react';

import { useStore } from '@wsh-2025/client/src/app/StoreContext';

export function useSubscribePointer(): void {
  const s = useStore((s) => s);

  useEffect(() => {
    const abortController = new AbortController();

    const current = { x: 0, y: 0 };
    const handlePointerMove = (ev: MouseEvent) => {
      current.x = ev.clientX;
      current.y = ev.clientY;
    };
    window.addEventListener('pointermove', handlePointerMove, { signal: abortController.signal });

    let immediate = setImmediate(function tick() {
      s.features.layout.updatePointer({ ...current });
      immediate = setImmediate(tick);
    });
    abortController.signal.addEventListener('abort', () => {
      clearImmediate(immediate);
    });

    return () => {
      abortController.abort();
    };
  }, []);
}

毎フレームマウス位置を取得
<Hoverable> はストアに保存されたマウス座標に反応して自分自身の座標 getBoundingClientRect() から取得し、オーバレイ判定
オーバレイしていたら className を子要素に注入
運営によると 想定解は :hover に書き直すことらしいが、注入されるclassNameのパターンが多すぎて分岐が読めなかったので、単純な mousemove/mouseleaveで書き直した。

export const Hoverable = (props: Props) => {
  const child = Children.only(props.children);
  const elementRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const mergedRef = useMergeRefs([elementRef, child.props.ref].filter((v) => v != null));

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleMouseEnter = () => {
      setIsHovered(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return cloneElement(child, {
    className: classNames(
      child.props.className,
      'cursor-pointer',
      isHovered ? props.classNames.hovered : props.classNames.default,
    ),
    ref: mergedRef,
  });
};

store 参照も消えた。

これ自体はだいぶファジーな実装なのはわかっているのだが、CPU処理時間はだいぶ減る。

2. react-ellipsis-component
最後にやろうとして間に合わなかった部分。

Hoverable を倒してもまだ再 render が抑制できていないし、boudingRect 負荷は25%~50% になったが、まだ発行してるやつがいる。
プロジェクト内検索しても Hoverable 以外で呼び出しており、おそらくライブラリ内の処理だとあたりを付けた。

たぶんこれ。



こんな感じで親ボックスをはみ出した処理を ... にしたりする。

                <div className="mb-[4px] text-[14px] font-bold text-[#ffffff]">
                  <Ellipsis ellipsis reflowOnResize maxLine={2} text={episode.title} visibleLine={2} />
                </div>

CSS の text-overflow で似たようなことができるのは知っている



ただ、このライブラリの maxLine や visibleLine が曲者で、VRTをパスする精度で書き直すことがこの時間内(残り1.5時間)では無理だと思った。ライブラリのオプションをみたり、中の実装も調べたが、パッチを当てるのは無理そうだった。

ライブラリ内の処理で、高さの取得に getBoudingClientRect を使っているのを発見したが、これを抑制する方法はなさそう。

VRT一致を諦めれば(この時点ではまだ通っていた)ファジーに修正できるが、タイムアップ



返信
返信を追加
mizchi
mizchi
2025/03/24に更新

感想
とにかく使うライブラリの量が多い
参加時点で対象を全部知ってることはおそらくないので、都度ググって対応する筋力が必要
事前に知ってると有利そうなのは webpack chunk の設定と playwright のデバッグ手法だろうか
自分はブラウザ上の計測が得意なので個々の問題の計測はできたが、修正の腕力が足りなかった。特にCSS置き換え系。CSS苦手なので...
Lighthouse のスコアが対象だが、Lighthouseの計測可能な状態にもっていくまでが難しい
ほぼ DevTools の Performance で、CPU プロファイルを見ていた
フロントエンド界はあまりコンテストがなく経験が積めないので自分も不慣れなのだが、プロジェクトのお作法に従ってライブラリのこだわりを捨てるのが大事そう
認証周りに手が回らなかったので、サーバーに ReDOS があることを見落とした
playwright 回しながらサーバーのプロファイルをすればよかった
AI はプロジェクト全体のサマリ生成やクエリチューニングの最初の一手、あからさまな lazy の発見ぐらいしか役に立たなかった
WSL 環境が想定外っぽかったので、環境構築で時間をロスした
VRTでアイコンのマッチが落ちたことを考えると、比率が小さい要素に対してはVRTのパスはあまり仕様確認にならない
競技用にファジーな設定をしてたからだとは思うが...
自分は SQL チューニングが下手
many to many なリレーションの修正方法がその場で思いつかなかった。
最初は全部にインデックス張ってDBサイズが100MB超えて git push に失敗
動画配信界はサーバーは謎のエンコーダが多くて辛そう。
参加者だからVRT通ったのに～といってるが、作問側の気持ちになると納得感があるテストを書くの、死ぬほど大変そう
終わった後に直後に書いた雑感想はこちら（参加者・運営向け）