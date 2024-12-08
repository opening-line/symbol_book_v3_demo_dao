export const convertToMosaicActualAmount = (
  amount: number,
  divisibility: number,
) => {
  return amount / Math.pow(10, divisibility)
}
