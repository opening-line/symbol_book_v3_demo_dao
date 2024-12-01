export const convertToMosaicActualAmount = (
  amount: string,
  divisibility: number,
) => {
  return Number(amount) / Math.pow(10, divisibility)
}
