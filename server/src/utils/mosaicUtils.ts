/**
 * 可分性を考慮したモザイク量を取得
 * @param amount 量
 * @param divisibility 可分性
 * @returns 可分性を考慮したモザイク量
 */
export const convertToMosaicActualAmount = (
  amount: number,
  divisibility: number,
) => {
  return amount / Math.pow(10, divisibility)
}
