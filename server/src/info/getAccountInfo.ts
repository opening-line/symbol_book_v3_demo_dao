// TODO: NODE_URLをプロパティファイルから取得するよう変更
const NODE_URL = "https://sym-test-03.opening-line.jp:3001";

/**
 * アカウント情報を取得する
 * @param accountId アカウント公開鍵またはアドレス
 * @returns アカウント情報
 */
export const getAccountInfo = async (accountId: string) => {
  return await fetch(
    new URL(`/accounts/${accountId}`, NODE_URL),
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  ).then((res) => res.json());
}
