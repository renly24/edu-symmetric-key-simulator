// ---------- モデル（スライドの内容） ----------

import type { SceneId } from "./transfer";

export const PLAIN_COLOR = "#2e7d32";
export const CIPHER_COLOR = "#6a1b9a";
export const KEY_COLOR = "#ef6c00";
export const EVE_COLOR = "#c62828";

export const CHAPTERS = [
  { id: 1, name: "暗号ってなに？", color: "#455a64" },
  { id: 2, name: "共通鍵で暗号化する", color: "#1565c0" },
  { id: 3, name: "鍵の強さ", color: CIPHER_COLOR },
  { id: 4, name: "鍵の受け渡し", color: EVE_COLOR },
  { id: 5, name: "まとめ", color: PLAIN_COLOR },
] as const;

export type ChapterId = (typeof CHAPTERS)[number]["id"];

// ---------- 問題 ----------

export interface ChoiceQuiz {
  kind: "choice";
  question: string;
  options: string[];
  answer: number;
  ok: string;
  ng: string;
  /** true の予想問題は、答えるまで次のスライドへ進めない */
  gate?: boolean;
}

export type Quiz = ChoiceQuiz | { kind: "task" } | { kind: "test" };

export type QuizLabel = "予想問題" | "体験問題" | "確認問題";

export function quizLabel(quiz: Quiz | undefined): QuizLabel | null {
  if (!quiz) return null;
  if (quiz.kind === "choice") return quiz.gate ? "予想問題" : "確認問題";
  if (quiz.kind === "test") return "確認問題";
  return "体験問題";
}

export const QUIZ_COLOR: Record<QuizLabel, string> = {
  予想問題: "#1565c0",
  体験問題: "#ef6c00",
  確認問題: "#2e7d32",
};

// ---------- スライド ----------

export type Stage =
  /** Aさん → Bさんの送受信を、1つずつ進めて見る */
  | { kind: "transfer"; scene: SceneId }
  /** 平文・暗号文・鍵・暗号化・復号の関係 */
  | { kind: "terms" }
  /** 鍵を変えて、文字のずれ方を見る */
  | { kind: "caesar" }
  /** 手で暗号化・復号してみる */
  | { kind: "handwork"; mode: "encrypt" | "decrypt"; text: string; key: number }
  /** 復号の鍵を変えてみる */
  | { kind: "wrongkey" }
  /** 総当たりで解読する */
  | { kind: "brute" }
  /** ビットで暗号化する（XOR） */
  | { kind: "xor" }
  /** 鍵の長さと、総当たりにかかる時間 */
  | { kind: "keylength" }
  /** 人数と、必要な鍵の数 */
  | { kind: "keycount" }
  /** よいところ・困るところ */
  | { kind: "summary" }
  /** 手順を並べる */
  | { kind: "order" }
  | { kind: "test" };

export interface Slide {
  id?: string;
  chapter: ChapterId;
  title: string;
  description: string;
  stage: Stage;
  /** 説明の下に出す要点 */
  points?: string[];
  quiz?: Quiz;
}

export const SLIDES: Slide[] = [
  // ---- 第1章 暗号ってなに？ ----
  {
    id: "intro",
    chapter: 1,
    title: "通信はのぞかれているかもしれない",
    description:
      "インターネットでは、データがいくつもの機器を中継しながら相手に届きます。Wi-Fi の電波や途中の機器で、だれかがこっそりデータをコピーする「盗聴」が起きるかもしれません。そのまま送ったメッセージは、盗聴した人にも読まれてしまいます。",
    stage: { kind: "transfer", scene: "plain" },
  },
  {
    chapter: 1,
    title: "読まれないようにするには？",
    description: "盗聴を完全に防ぐのは難しいことです。データが途中でコピーされてしまうことを前提に、どうすれば中身を守れるか考えてみよう。",
    stage: { kind: "transfer", scene: "plain" },
    quiz: {
      kind: "choice",
      gate: true,
      question: "コピーされても中身を読まれないようにするには、どうすればよいと思う？",
      options: ["メッセージを短くして送る", "決まりにしたがって、相手にしか戻せない形に変えてから送る", "何回も同じメッセージを送る"],
      answer: 1,
      ok: "正解！ メッセージを、決まりと「鍵」を知っている人にしか元に戻せない形に変えてから送ります。これを暗号化といいます。",
      ng: "短くしても、何回送っても、コピーされれば読まれてしまいます。決まりと「鍵」を知っている人にしか元に戻せない形に変えてから送るのが、暗号化です。",
    },
  },
  {
    id: "terms",
    chapter: 1,
    title: "暗号のことば",
    description:
      "元のメッセージを平文（ひらぶん）、読めない形に変えたものを暗号文といいます。平文を暗号文にすることを暗号化、暗号文を平文に戻すことを復号といいます。どう変えるかを決める秘密の情報が鍵です。",
    stage: { kind: "terms" },
    points: ["平文 ＋ 鍵 → 暗号化 → 暗号文", "暗号文 ＋ 鍵 → 復号 → 平文"],
  },

  // ---- 第2章 共通鍵で暗号化する ----
  {
    id: "caesar",
    chapter: 2,
    title: "文字をずらす暗号",
    description:
      "いちばん簡単な暗号の1つが、アルファベットを決まった数だけ後ろにずらす「シーザー暗号」です。ずらす数が鍵になります。鍵が 3 なら A は D、B は E になります。Z まで行ったら A に戻ります。下のつまみで鍵を変えて、ずれ方を見てみよう。",
    stage: { kind: "caesar" },
    points: ["上の段が平文の文字、下の段が暗号文の文字", "鍵（ずらす数）を知らないと、どう戻せばよいか分からない"],
  },
  {
    id: "encrypt",
    chapter: 2,
    title: "暗号化してみよう",
    description:
      "鍵 3 で「NEKO」を暗号化してください。上の段（平文）から文字を探して、すぐ下の段（暗号文）の文字を書きます。入力する欄を選ぶと、探す文字が光ります。",
    stage: { kind: "handwork", mode: "encrypt", text: "NEKO", key: 3 },
    quiz: { kind: "task" },
  },
  {
    id: "decrypt",
    chapter: 2,
    title: "復号してみよう",
    description:
      "Bさんに暗号文「VXVKL」が届きました。暗号化に使った鍵は 3 です。今度は下の段（暗号文）から文字を探して、すぐ上の段（平文）の文字を書きます。暗号化とは反対向きに、3 つ戻すことになります。",
    stage: { kind: "handwork", mode: "decrypt", text: "VXVKL", key: 3 },
    quiz: { kind: "task" },
  },
  {
    chapter: 2,
    title: "違う鍵で復号したら？",
    description: "Bさんが鍵をまちがえて覚えていたとします。暗号化には鍵 3 を使ったのに、鍵 5 で復号しようとしたらどうなるでしょう。",
    stage: { kind: "caesar" },
    quiz: {
      kind: "choice",
      gate: true,
      question: "暗号化と違う鍵で復号すると、どうなると思う？",
      options: ["少しまちがった平文になるが、だいたい読める", "意味のない文字の並びになって、読めない", "自動で正しい鍵に直してくれる"],
      answer: 1,
      ok: "正解！ 1文字ずつのずれ方が全部変わるので、意味のない文字の並びになります。次のスライドで試してみよう。",
      ng: "1文字ずつのずれ方が全部変わるので、意味のない文字の並びになります。次のスライドで試してみよう。",
    },
  },
  {
    id: "wrong-key",
    chapter: 2,
    title: "同じ鍵でないと戻せない",
    description:
      "暗号文「VXVKL」を、いろいろな鍵で復号してみよう。意味のある言葉に戻るのは、暗号化に使ったのと同じ鍵 3 のときだけです。",
    stage: { kind: "wrongkey" },
    points: ["暗号化と復号に、同じ鍵を使う", "鍵がちがうと、平文には戻らない"],
  },
  {
    id: "cipher-flow",
    chapter: 2,
    title: "共通鍵暗号方式",
    description:
      "Aさんと Bさんが同じ鍵を持っていれば、盗聴者に暗号文をコピーされても中身は読まれません。このように、暗号化と復号に同じ鍵を使うやり方を共通鍵暗号方式といいます。鍵は2人だけの秘密にしておくので、秘密鍵暗号方式とも呼ばれます。",
    stage: { kind: "transfer", scene: "cipher" },
    points: ["暗号化と復号に、共通の（同じ）鍵を使う", "鍵は、送る人と受け取る人だけの秘密にする"],
  },

  // ---- 第3章 鍵の強さ ----
  {
    chapter: 3,
    title: "鍵は何通りある？",
    description: "盗聴者は鍵を知りません。でも、シーザー暗号のしくみ（文字をずらす）を知っていたら、どうでしょう。ずらす数として考えられるのは何通りあるか考えてみよう。",
    stage: { kind: "caesar" },
    quiz: {
      kind: "choice",
      gate: true,
      question: "シーザー暗号の鍵（ずらす数）は、意味があるものだけで何通り？",
      options: ["5 通り", "25 通り", "1000 通り"],
      answer: 1,
      ok: "正解！ アルファベットは 26 文字なので、ずらす数は 1〜25 の 25 通りです（26 ずらすと元に戻ります）。",
      ng: "アルファベットは 26 文字なので、ずらす数は 1〜25 の 25 通りです（26 ずらすと元に戻ります）。",
    },
  },
  {
    id: "brute",
    chapter: 3,
    title: "総当たりで解読してみよう",
    description:
      "盗聴者になって、コピーした暗号文「CKUEBK」を解読してみよう。鍵を 1 から順に全部試すやり方を総当たりといいます。「次の鍵を試す」を押していき、意味のある言葉になった行をタップしてください。",
    stage: { kind: "brute" },
    quiz: { kind: "task" },
  },
  {
    id: "xor",
    chapter: 3,
    title: "コンピュータの暗号はビットで",
    description:
      "コンピュータの中では、文字も 0 と 1 のビットで表されます。実際の暗号では、平文のビットと鍵のビットを組み合わせて暗号文を作ります。ここでは「同じなら 0、違えば 1」という計算（XOR）を使います。鍵のビットをタップして変えても、同じ鍵でもう一度計算すると、必ず平文に戻ります。",
    stage: { kind: "xor" },
    points: ["平文 XOR 鍵 → 暗号文", "暗号文 XOR 同じ鍵 → 平文"],
  },
  {
    id: "keylength",
    chapter: 3,
    title: "鍵を長くすると",
    description:
      "鍵が n ビットなら、鍵は 2 を n 回かけた数だけあります。つまみで鍵の長さを変えて、1秒間に 1兆個の鍵を試せるコンピュータでも、全部試すのにどれくらいかかるか見てみよう。実際によく使われる共通鍵暗号（AES など）は、128〜256 ビットの鍵を使います。",
    stage: { kind: "keylength" },
    points: ["鍵が 1 ビット長くなると、鍵の数は 2 倍になる", "鍵が十分に長ければ、総当たりでは現実的に解読できない"],
  },
  {
    chapter: 3,
    title: "確認しよう",
    description: "総当たりと鍵の長さの関係をふり返ろう。",
    stage: { kind: "keylength" },
    quiz: {
      kind: "choice",
      question: "鍵を長くすると、総当たりで解読されにくくなるのはなぜ？",
      options: ["暗号文が長くなって、コピーしにくくなるから", "試さなければならない鍵の数が、ものすごく増えるから", "復号するときに、鍵がいらなくなるから"],
      answer: 1,
      ok: "正解！ 鍵が 1 ビット増えるたびに鍵の数は 2 倍になります。128 ビットなら、全部試すのに宇宙の年齢よりずっと長い時間がかかります。",
      ng: "鍵が 1 ビット増えるたびに、試さなければならない鍵の数が 2 倍になります。だから、総当たりでは現実的に解読できなくなります。",
    },
  },

  // ---- 第4章 鍵の受け渡し ----
  {
    chapter: 4,
    title: "鍵はどうやって渡す？",
    description:
      "共通鍵暗号方式では、Bさんも同じ鍵を持っていないと復号できません。会って直接渡せればよいのですが、遠くにいる相手や、初めて通信する相手（ネットショップなど）だとそうはいきません。",
    stage: { kind: "transfer", scene: "cipher" },
    quiz: {
      kind: "choice",
      gate: true,
      question: "鍵を、暗号文と同じようにインターネットで送ったらどうなると思う？",
      options: ["鍵は暗号ではないので、だれにも読まれない", "盗聴者に鍵もコピーされて、暗号文を復号されてしまう", "鍵を送ると、暗号文が自動で消える"],
      answer: 1,
      ok: "正解！ 鍵も盗聴者にコピーされてしまえば、暗号文を復号されてしまいます。次のスライドで見てみよう。",
      ng: "鍵も通信路を流れるデータなので、盗聴者にコピーされてしまいます。次のスライドで見てみよう。",
    },
  },
  {
    id: "key-leak",
    chapter: 4,
    title: "鍵を盗まれると",
    description:
      "鍵を暗号文と同じ通信路で送ると、盗聴者は鍵と暗号文の両方を手に入れて、復号できてしまいます。共通鍵暗号方式では、鍵をどうやって安全に相手に渡すかが大きな問題になります。これを鍵配送問題といいます。",
    stage: { kind: "transfer", scene: "keyleak" },
    points: ["鍵を、盗聴されない方法で相手に渡す必要がある", "これを「鍵配送問題」という"],
  },
  {
    id: "key-count",
    chapter: 4,
    title: "人数が増えると鍵も増える",
    description:
      "共通鍵は、通信する2人ごとに別のものを用意します。同じ鍵を使い回すと、ほかの人にも読まれてしまうからです。つまみで人数を変えて、必要な鍵（線の数）がどう増えるか見てみよう。",
    stage: { kind: "keycount" },
    points: ["n 人なら、必要な鍵は n ×（n − 1）÷ 2 個", "人数が増えると、鍵の管理がとても大変になる"],
  },
  {
    chapter: 4,
    title: "確認しよう",
    description: "人数と鍵の数の関係を使って考えよう。",
    stage: { kind: "keycount" },
    quiz: {
      kind: "choice",
      question: "40人のクラスで、全員が2人ずつ別の共通鍵を使うと、鍵は何個必要？",
      options: ["40 個", "80 個", "780 個"],
      answer: 2,
      ok: "正解！ 40 × 39 ÷ 2 ＝ 780 個です。1人あたり 39 個の鍵を管理しなければなりません。",
      ng: "1人ごとに、ほかの 39 人とそれぞれ別の鍵が必要です。40 × 39 ÷ 2 ＝ 780 個になります。",
    },
  },

  // ---- 第5章 まとめ ----
  {
    id: "summary",
    chapter: 5,
    title: "共通鍵暗号方式のよいところ・困るところ",
    description:
      "共通鍵暗号方式は、しくみが単純で計算が速いので、動画や大きなファイルのような大量のデータの暗号化に向いています。一方で、鍵を安全に渡すことと、人数が増えたときの鍵の管理が課題です。この課題を解決するために考えられたのが、公開鍵暗号方式です。",
    stage: { kind: "summary" },
    points: ["次の教材「公開鍵暗号方式」で、鍵配送問題の解決方法を学ぼう"],
  },
  {
    chapter: 5,
    title: "手順を並べよう",
    description: "共通鍵暗号方式で、Aさんが Bさんに秘密のメッセージを送る手順を、正しい順番にタップしてください。",
    stage: { kind: "order" },
    quiz: { kind: "task" },
  },
  {
    chapter: 5,
    title: "まとめテスト",
    description:
      "ここまでの内容から8問です。全部答えたら「採点する」を押してください。間違えた問題は、説明のスライドに戻って確認できます。最後の結果画面をスクリーンショットして提出しましょう。",
    stage: { kind: "test" },
    quiz: { kind: "test" },
  },
];

export function slideIndexOf(id: string) {
  return SLIDES.findIndex((s) => s.id === id);
}

// ---------- 総当たり ----------

export const BRUTE_CIPHER = "CKUEBK";
export const BRUTE_KEY = 10;

// ---------- 手順の並べ替え ----------

export const ORDER_STEPS = [
  "Aさんと Bさんが、同じ鍵を安全な方法で共有する",
  "Aさんが、平文を鍵で暗号化する",
  "Aさんが、暗号文を Bさんに送る",
  "Bさんが、同じ鍵で暗号文を復号する",
];
/** 選択肢を並べる順番（正しい順番とは変えておく） */
export const ORDER_SHOWN = [2, 0, 3, 1];
export const ORDER_HINT = [
  "暗号化する前に、2人が同じ鍵を持っていないと、Bさんは復号できません。",
  "鍵を共有したら、次は送る前に平文を暗号文に変えます。",
  "暗号化したら、暗号文を送ります。",
  "最後に、受け取った Bさんが元に戻します。",
];

// ---------- まとめテスト ----------

export const TEST_QUESTIONS: { question: string; options: string[]; answer: number; review: string }[] = [
  {
    question: "暗号化する前の、だれでも読める元のデータを何という？",
    options: ["暗号文", "平文", "鍵"],
    answer: 1,
    review: "terms",
  },
  {
    question: "暗号文を元の平文に戻すことを何という？",
    options: ["復号", "暗号化", "盗聴"],
    answer: 0,
    review: "terms",
  },
  {
    question: "共通鍵暗号方式の特徴は？",
    options: ["暗号化と復号に同じ鍵を使う", "暗号化と復号に違う鍵を使う", "鍵を使わない"],
    answer: 0,
    review: "cipher-flow",
  },
  {
    question: "シーザー暗号で、鍵 3 を使って「CAT」を暗号化すると？",
    options: ["ZXQ", "FDW", "DBU"],
    answer: 1,
    review: "caesar",
  },
  {
    question: "暗号化と違う鍵で復号すると、どうなる？",
    options: ["元の平文に戻る", "意味のない文字の並びになる", "暗号文が消える"],
    answer: 1,
    review: "wrong-key",
  },
  {
    question: "シーザー暗号が総当たりですぐに解読されてしまうのはなぜ？",
    options: ["鍵が 25 通りしかないから", "暗号文が短いから", "アルファベットを使うから"],
    answer: 0,
    review: "brute",
  },
  {
    question: "共通鍵暗号方式の「鍵配送問題」とは？",
    options: ["暗号化に時間がかかりすぎること", "鍵を安全に相手に渡すのが難しいこと", "鍵が短すぎること"],
    answer: 1,
    review: "key-leak",
  },
  {
    question: "5人が2人ずつ別の共通鍵を使うとき、鍵は全部で何個必要？",
    options: ["5 個", "10 個", "20 個"],
    answer: 1,
    review: "key-count",
  },
];
