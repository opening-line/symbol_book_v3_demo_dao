import { Address, descriptors } from "symbol-sdk/symbol"

/**
 * アカウントメタデータの作成
 * @param target メタデータを設定されるアドレス
 * @param key メタデータキー
 * @param value メタデータ値
 * @returns アカウントメタデータトランザクションディスクリプタ
 */
export const createAccountMetadata = (
  target: Address,
  key: bigint,
  value: Uint8Array,
) => {
  return new descriptors.AccountMetadataTransactionV1Descriptor(
    target,
    key,
    value.length,
    value,
  )
}
