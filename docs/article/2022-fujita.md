目標を定める
チューニングの対象となるページを何もしないで計測すると、1点や2点というスコアをたたき出します。課題としてはこの上なく素晴らしいですね！

初回の計測は1点

実際のスコアは、GitHub Actionを用いて、Headless Chrome + Lighthouse により計測されますが、最適化中はDevツールに内蔵されているLighthouseに頼ることになります。この2者は微妙に異なる結果をだすため注意が必要で、Headless Chromeのほうが癖があり、得点が出にくい傾向にあります（なぜかはわかりません）。

昨年の経験から、満点に近い値を出すためにはDevツールのLighthouse（デバイスはMobile）において、少なくとも以下のような条件を満たす必要があることがわかっていました。

メトリクス	目標値
First Contentful Paint（FCP）	1.0s以下
Speed Index（SI）	1.0s以下
Largest Contentful Paint（LCP）	1.5s以下
Time to Interactive（TTI）	1.5s以下
Total Blocking Time（TBT）	50ms以下
Cumulative Layout Shift（CLS）	0
すなわち、計測の対象となる5つのページすべてで、次のような結果になれば安定して満点近い値を出すことができます。

初回の計測は1点

モバイルでこれは相当厳しいですよね。このうち最も厄介なのがTotal Blocking Timeで、何も対策をしないとReactの初期化だけでスコアが落ちます。

これから真っ赤なスコアを改善していくのですが、この目標値を達成するには、少なくとも以下の対策を施す必要がありそうです。

アセットの最適化
Reactのコード分割（Suspenseとlazyによる選択的Hydration）
SSR
なお、HTTP2に対応していないherokuでは満点を出すのは難しいと思いますので、高得点を狙うならHTTP2が利用できるサーバが必要かと思います。

JavaScriptの容量削減
目標が定まったところで、早速手を動かしていきましょう。

基本的に、React以外のサードパーティ製ライブラリはすべて削除するか、切り離す方針で進めます。まず、30Mb以上あるmain.jsに何が含まれているかを調べるために、Webpack Bundle Analyzerをインストールします。

計測の結果、index.jsxが大半を占めることがわかりました

index.jsxが巨大すぎるので中身を見てみたところ、Source Mapが含まれていたため、webpackのconfigを修正して外部ファイルに切り替えました。これで一気に容量は8Mb付近まで下がりますが、まだまだ大きいですね。

再計測の結果、zengin.jsやcore.jsなどの大きなファイルが含まれていることがわかりました

zengin-data.jsの切り離し
すべての金融機関コードが入っている「統一金融機関コード」。最初見たときはびっくりでしたが、チャージダイアログが表示されたときのみにしか利用しないので、Dynamic Importに切り替えて当座をしのぎました。webpackはDynamic Importを発見すると勝手にコードを分割してくれるので便利ですね。

const [zenginCode, setZenginCode] = useState(null);

if (!zenginCode) {
  import('zengin-code').then(module => setZenginCode(module));
  return null;
}
JavaScript
Suspenseを使えばこの処理は不要になるのですが、邪魔なので取り急ぎ切り離しておきました。

Shim系・Polyfill系の削除
「Chrome最新版で動作する」ことが条件ですので、core-jsやes5-shimは必要ありません。以下5つのパッケージを削除しました。

core-js
regenerator-runtime/runtime
es5-shim
es6-shim
es7-shim
Fontawesomeの削除
Fontawesomeはアイコンパッケージですが、調べたところ3か所でしか使用していなかったため、該当箇所に直接埋め込むことにしました。ただし、widthやheight などの値が微妙に異なるので、それぞれにスタイルを当てながら、見た目が変わらないよう作業を進めました。この作業により、以下のパッケージが不要になります。

fontawesome-free/js/fontawesome
fontawesome-free/js/solid
fontawesome-free/js/regular
Moment.jsをDay.jsに置き換え
ネイティブのDateクラスを用いて自前で書き直すかどうか悩んだのですが、使用されている箇所が多いのであきらめて、同じインターフェースを採用している軽量のDay.jsで置き換えました。

この時点で、スクリプトのサイズは2Mb強まで小さくなりました。

Lodashの削除
Lodashの便利関数は、ES6系のメソッドを用いればたいていの場合簡単に置き換えられるので、使用箇所を検索し、一つひとつ書き直しました。例えば次のような感じですね。

  const isRacesUpdate =
    _.difference(
    races.map((e) => e.id),
    prevRaces.current.map((e) => e.id),
   ).length !== 0;

  const isRacesUpdate = !races.every(race => (
    prevRaces.current.some(prevRace => race.id === prevRace.id)
  ));
JavaScript
Lodashはそれぞれの関数が単一のパッケージになって配信されているバージョンもあるのですが、それらを使っても厳格な実装、あるいは後方互換のための不要なコードを読み込むため、できる限り使わないほうが容量削減につながります。

Framer MotionとBezier Easingの削除
どちらもフェードインアニメーションのためだけにぜいたくに使用されていたので、いずれもCSSのKeyframesで置き換えました。Framer Motionはdurationなどのデフォルト値を調べて適用し、Bezier EasingはCSSのcubic-bezierを用いて同じエフェクトを再現しました。

Axiosの削除
Axiosはネイティブのfetch()およびHeadersクラスを用いてすべて置き換えました。

最終的に残ったもの
最終的にスクリプトのサイズはMinifyしない状態で1.3Mbまで減りました。main.jsに残ったパッケージは以下の4つです。すっきり！

react
react-dom
styled-components
dayjs
JavaScriptの出力を最適化
webpack.config.jsの分割
webpackの設定ファイルを、devとproduction、およびserverで分離します。公式のドキュメントにも記載されている通り、webpack-mergeを用いて、以下の4つのファイルに分割しました。

webpack.common.js
webpack.dev.js
webpack.prod.js
webpack.server.js
production環境ではJavaScriptがMinifyされるよう設定しなおすと同時に、cjsによる出力をやめました。また、Chrome最新版であればトランスパイルする必要がないため、package.jsonのbrowserslistを以下のように設定しました。

"browserslist": [
  "last 2 Chrome versions"
]  
JSON
別に最新版だけでもいいんですけどね。

ファイルのBrotli圧縮
brotli-webpack-pluginを導入して、JavaScriptファイルを事前にBrotli圧縮しておきます。分割出力されるチャンクもろとも圧縮してくれるので、とても便利です。

どのタイミングで圧縮するかはいろいろあると思いますが、fastify-staticのpreCompressedオプションと相性が良いため、ビルド時に圧縮することにしました。

fastify.register(fastifyStatic, {
  preCompressed: true,
});
JavaScript
このオプションを有効にすると、Brotliファイルが存在する場合はそちらを優先して配信するようになります。Responseヘッダもよしなに書き換えてくれます。

Brotli形式は高い圧縮性能を発揮しますが、反面エンコードに時間がかかるというデメリットがあるため、オンザフライで処理する場合は注意が必要です。gzipよりも高い圧縮を行えるレベル11付近では、逆に処理時間が倍以上かかります。事前圧縮してしまえばBrotliの良さだけをいかせるため、速度とのトレードオフや、CDNによるキャッシュなどの別処理を考えなくてよくなります（僕はCDN使ってませんけど）。

ちなみに、以下でさらにコードを分割しますが、最終的に僕のmain.jsは28.3Kbまで減りました。最初の30Mbを考えると、びっくりするくらいのダイエットに成功です！

画像の容量削減
用途の整理
画像を圧縮する前に、それぞれの画像がどのような用途で使用されているかを整理しました。

種類	用途
Hero.jpg	フロントページ（1024×735）
races/xxx.jpg	本日のレース（100×100）、レースカード（400×225）
players/xxx.jpg	出走表（100×100）
これらのサイズを下回らないように、リサイズおよび圧縮処理を書いていきます。

Sharpとfast-globによる一括リサイズ・圧縮
画像を圧縮するライブラリはいくつかありますが、僕は普段sharpを利用しています。fast-globを併用し、下のような感じでディレクトリ内にある画像を一括して処理しました。

await Promise.all(
  (await glob('./public/assets/images/players/*.jpg'))
    .map(async path => {
      await sharp(path)
        .resize(...)
        .png({ quality: 30 })
        .toFile(...);
    })
);
JavaScript
ソースとなる画像のアスペクト比が一定ではないので、100×100のサムネイル画像を作成する際は、短辺が100pxになるよう計算して出力、そのほかの画像については表示サイズより少し大きめになるようリサイズしました。

レスポンシブ画像の作成
Hero画像に関しては、モバイルデバイス用の小さな画像（幅640px）を用意しました。この画像のURLはAPI経由で取得していたので、レスポンスにsrcsetを含めるよう拡張しました。

AvifかWebPか
画質・圧縮率などを総合的にみると当然Avifに軍配が挙がるのですが、翻って僕はWebpを採用しました。前回も同じように迷ったのですが、AvifのほうがWebPよりブラウザでのデコード時間が長くかかっているように見えたため、最終的にはWebPに落ち着きました。

It takes more CPU power to decode AVIF images for display than other codecs; however, it should be fast enough in practice. The AVIF format supports tiling, which accelerates multi-core CPU encoding. — Does AVIF support tiling

マルチコアCPUの場合、論理的にはAvifのほうが速いはずなのですが、詳しく検証してみないとわかりません。

CSSの最適化
variable.jsに使用されていない大量の色があったため、不要なものはすべて削除しました。また、GlobalStyles.jsで読み込まれているmodern-css-resetはJSコード削減のため、<head>に直接埋め込むことにしました。

さらに、ベンダープレフィックスも不要なので、StyleSheetManagerにdisableVendorPrefixesを追加しておきました。

<StyleSheetManager disableVendorPrefixes>
  ...
</StyleSheetManager>
JSX
フォントの最適化
オッズページで使用されている「せのびゴシック」は、よく見るとBoldのみしか使用されておらず、かつ数字とピリオドしか必要なさそうでした。そこで、必要なグリフのみが入ったサブセットを作成したのち、woff2に変換しておきました。Chromeで動作すればよいので、フォールバック用のフォーマット（ttfやwoff）は必要ありません。

同時に、フォント自体がレンダリングをブロックしないよう、font-displayをblockからswapに変更しておきました。

@font-face {
  font-family: "Senobi-Gothic";
  font-weight: bold;
  font-display: swap;
  src: url(...) format("woff2");
}
CSS
React18へのアップグレードとSuspenseの導入
React18では、React.SuspenseならびにReact.lazyがSSRでも利用できるようになりました。これらを利用することで、main.jsをさらに小さくでき、かつ“Selective Hydration”によってTTBの悪化を防ぐことができます。逆に導入しない場合は、下の画像のように一気にHydrateすることになるため、TTBで満点を出すことはかなり難しくなります。

Suspenseしない場合は、Reactの実行時間が70ms近くかかります

課題パッケージではReact17がインストールされていたため、まずはReact18にアップグレードしました。このとき、初期化処理を若干変える必要があるので、ついでにRouterレベルでSuspenseを実装しておきました。

const Top = lazy(() => import('./pages/Top'));
const Odds = lazy(() => import('./pages/races/Odds'));
const RaceCard = lazy(() => import('./pages/races/RaceCard'));
const RaceResult = lazy(() => import('./pages/races/RaceResult'));

export const Routes = () => {
  return (
    <Suspense>
      <RouterRoutes>
        <Route element={ <CommonLayout/> } path="/">
          <Route index element={ <Top/> }/>
          <Route element={ <Top/> } path=":date"/>
          <Route path="races/:raceId">
            <Route element={ <RaceCard/> } path="race-card"/>
            <Route element={ <Odds/> } path="odds"/>
            <Route element={ <RaceResult/> } path="result"/>
          </Route>
        </Route>
      </RouterRoutes>
    </Suspense>
  );
};
JSX
一気にSuspenseできるのはとても便利ですね（Named Importに対応してくれるともっとよかったですけど）。

SSRの実装
ここまではそれほど難しいところはありませんでしたが、SSRの導入にはいくつかの難関があります。

SWRによるfetch対策
SSR時にはAPIでデータを取得できないため、当然その先はレンダリングできません。フロントページではHero画像すら表示できないことになるので、何とかする必要があります。

自前でデータを送ってもよいのですが、階層が深いと面倒ですし、いちいちデータがあるかないかを確認するのも大変なので、SWRを導入して対応することにしました。SWRは各APIにfallbackを与えておくと、SSR時などにデータを取得できない場合、そのfallbackを返してくれるという便利な機能があります。データの取得部分をuseSWRを用いて書き換える必要がありますが、以下のように課題のコードがuseFetchとしてまとめてくださっているので、とてもスムーズに導入できました。

export function useFetch(apiPath, fetcher) {
  const [result, setResult] = useState({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    setResult(() => ({
      data: null,
      error: null,
      loading: true,
    }));

    const promise = fetcher(apiPath);

    promise.then((data) => {
      setResult((cur) => ({
        ...cur,
        data,
        loading: false,
      }));
    });

    promise.catch((error) => {
      setResult((cur) => ({
        ...cur,
        error,
        loading: false,
      }));
    });
  }, [apiPath, fetcher]);

  return result;
}
JavaScript
これを、useSWRを用いて書き換えます。ジャストフィット感満載です。

export function useFetch(apiPath, fetcher) {
  const { data, error } = useSWR(apiPath, fetcher);
  return { data, error, loading: !data && !error };
}
JavaScript
フォールバックは次のような感じでAppを囲んで渡します。クライアント側とサーバ側で多少設定を変える必要がありますが、基本的にはこれだけで導入完了です。

<SWRConfig value={ { fallback: {} } }>
  <AuthContextProvider>
    <GlobalStyle/>
    <BrowserRouter>
      <Routes/>
    </BrowserRouter>
  </AuthContextProvider>
</SWRConfig>
JSX
styled-components対応
今回頭を悩ませたのはstyled-componentsのSSR対応です。

Suspenseによる実装を正しくHydrateするには、renderToPipeableStream()を使用する必要があるのですが、styled-componentsはこのメソッドに対応していません。状況をまとめると次の表の通りです。

レンダリング用関数	状況
renderToString	Suspenseに限定的にしか対応していない
renderToNodeStream	styled-componentsは対応しているが、React18ではdeprecated
renderToPipeableStream	styled-componentsが対応していない
なんとどれもNGです。おつかれさまでした！

実際、renderToStringを利用すると、クライアント側で確実にエラーになりますし、renderToNodeStreamを使用するとSuspenseが正しく動作しません。したがって、renderToPipeableStreamを使用するのは確定で、何とかしてstyled-componentsが機能するよう回避策を考える必要がでてきました。

styled-componentsはReactがJSXをレンダリングする過程でスタイルを抽出しているようでしたので、ストリーミングはあきらめ、renderToPipeableStreamをrenderToString のように扱えれば問題を解決できそうです。一応Reactのドキュメントをよく見ると、onAllReady()のところに以下のような記載があります。

If you don’t want streaming, use this instead of onShellReady. This will fire after the entire page content is ready. You can use this for crawlers or static generation. — renderToPipeableStream()

つまり、「静的なHTMLとして取得したい場合はこのメソッドを使ってね」ということなのですが、肝心な使い方が書かれていません。不親切！

仕方がないので、正しい実装方法かどうかはわかりませんが、別のWritableストリームを作成して順次HTMLを蓄積し、最後に抽出することにしました。

HTML用のWritableを作成します（単にWritableのコンストラクタを使って、もっと単純なコードとして実装することもできます）。

class HTMLStream extends Writable {
  html = '';

  _write(chunk, encoding, next) {
    this.html += chunk;
    next();
  }

  get() {
    return this.html;
  }
}
JavaScript
HTMLStreamをrenderToPipeableStream()に接続し、終わるまで待ってからHTMLを返します。

function render(jsx) {
  const stream = new HTMLStream();

  return new Promise((resolve, reject) => {
    const { pipe } = renderToPipeableStream(jsx, {
      onShellReady() {
        pipe(stream);
      },
    });

    stream.on('finish', () => resolve(stream.get()));
    stream.on('error', reject)
  });
}
JavaScript
styled-componentsのcollectStylesにより生成されたjsxをrender()に渡し、アプリケーション部分のHTMLを生成します。

const sheet = new ServerStyleSheet();
const jsx = sheet.collectStyles(...);
const app = await render(jsx);
JavaScript
styled-componentsがスタイルの収集を終えているので、全体のHTMLを生成します。

const html = `
  ${ getHeader(sheet.getStyleTags()) }
  ${ app }
  ${ getFooter() }
`.trim();
JavaScript
getHeaderとgetFooterはReactがハンドリングしている部分以外のHTMLを返す関数だと考えてください。

これで、晴れて今回の難関はクリアすることができました。

クエリ結果のキャッシュ
SSRにしたことでブラウザ側の処理は軽くなったのですが、trifectaOddsを取得するサーバ側のクエリ処理がとても重いため、Speed Indexに大ダメージが残りました。

fastify.get('/races/:raceId/*', async (req, reply) => {
  const repo = (await createConnection()).getRepository(Race);
  const { raceId } = req.params;

  const race = await repo.findOne({
    where: { id: raceId },
    relations: ['entries', 'entries.player', 'trifectaOdds'],
  });

  const fallback = {
    [`/api/races/${ raceId }`]: race,
  };

  ...
});
JavaScript
僕はDB系の知識があまりないのですが、このクエリは生半可な対応では速くならなそうでした。いくつかの試みを紹介すると

relationsをtrifectaOddsとそれ以外に分ける
Indexを追加
最新版で実装されたrelationLoadStrategyをqueryに変更
などで、このいずれも速度的な改善はみられましたが、それでも遅い！（関連Issue#3857）。ということで、クエリ自体を速くすることはさっさと諦め、キャッシュすることにしました。

TypeORMにはクエリ結果をキャッシュする機能があるようなのですが、Migrationがうまく動かせなかったので、自前で適当にキャッシュする処理を書きました。

最初にアクセスするユーザには犠牲になっていただいてキャッシュを作成し、二人目以降からすばやくレスポンスしようという算段です。trifectaOddsが更新されるタイミングが仕様にはなかったのですが、念のためキャッシュをクリアするAPIも用意しておきました。

TBT対応
ここまでの対応でもかなりの高得点を出せるようになってはいるのですが、まだわずかにTBTおよびLCPが満点を出しません。TBTは、50msを超える処理があると、超えた分の時間が累積され、Lighthouseの結果として表示される仕様らしいです（DevツールのLighthouseではそうは見えませんが）。

80msのタスクが2つあると、TBTは60msとして計算されます

パフォーマンスパネルで対象となるページを計測し、一つひとつのタスクが50msを超えないようにします。ただし、Headless Chromeによる計測はなぜかブラウザで計測するよりも厳しい結果を出すため、僕は30ms付近を目標に最適化を行いました。

たとえば、最も重いオッズページでパフォーマンスを計測すると、最適化前では次のようになります。

最適化前では40ms付近のタスクが残っています

40msはセーフですが、安全圏ではありません。最初の40msのタスクはSSRにより配信されたHTMLのレンダリング、次の40msはSuspenseされたオッズページのスクリプトをコンパイルし、実行するタスクです。これらを解消するため、次のようにして処理を分散していきます。

ダイアログ系やフッターのSuspense
処理の重いDOMはSSRせず、後からレンダリング
ただし、Suspenseは多用しすぎるとTTIに傷が入る可能性があるので、注意が必要です。また、処理を遅延させるとCLSを引き起こす可能性があるため、適宜Placeholderを配置しながら進めます。

たとえば、オッズのテーブルはSSR時に高さを計算できるため空のDivを表示しておき、Hydrate時に中身をレンダリングすれば、CLSを防ぎつつ重い処理を後回しにできます。いろいろ端折りますが、次のようなコードで実現します。

const Table = ({ odds }) => {
  const [visible, setVisible] = useState(false);
  useEffect(() => setVisible(true), []);

  return visible
    ? <OddsTable/>
    : <Placeholder $height={ /* oddsの情報から高さを計算 */ }/>;
};
JSX
結果、下のように一つひとつのタスク実行時間が小さくなりました。

それぞれのタスクの実行時間が20ms付近に収まりました

最適化前の重い処理はどこに行ったかというと、後半に回っています。

処理が分割され、遅延実行に成功しました

このような対策を進めることで、各ページのTBTが50msを超えることはなくなりました。

LCP対応
LCPはTBTに引きずられることが多いため、上記の対策により改善されてはいるのですが、Largest Content以外の画像があるページでは、その処理に若干の影響を受ける場合があります。そこで、一番大きな画像以外はすべてloading="lazy"属性を追加し、ブラウザによる遅延読み込みを有効にしました。

が、どうもそれだけでは「出走表」ページのLCPが不安定だったので、プレイヤーの画像はSSR時にはレンダリングせず、useEffectによりHydrate時に行うことで安定した数値を出せるようにしました。

いざ計測！
ここまでできた段階で、Leaderboardに登録し、計測を行ってみました。手元での計測では500がちらほら出ていたので、高いスコアが出ることを期待していたのですが……

実際の結果は……

なんと439.1点。「あれ？？？？？」ってなりましたが、「サーバ寝てたかも？」と思い直し再度計測。しかし何度計測しても平均450点くらいしか出ませんでした。

原因がわからずしばらく途方に暮れていたのですが……、一番最初に述べた「手を抜いた実装」のせいでした。計測対象となるページは

トップページ
出走表ページ
オッズページ
結果ページ
と記載されていたため、フロントページは/を最適化の対象としていたのですが、サーバのログを確認したところ、実際計測されていたのは/2022-11-01でした😖

「そこは最適化してねぇ！」

ということで、/:dateもチューニングしました。幸いフロントページと処理は全く同じなので、すぐに対応することができました。この原因を突き止めるのに1日費やしてしまいましたが、完全に身から出た錆でしたね。反省。

最終的なスコアを改めて計測しました

気を取り直して再度計測した結果、一発で500点がでました！ Hooray！🎉🎉🎉