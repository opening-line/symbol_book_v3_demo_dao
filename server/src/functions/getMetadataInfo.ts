import { Config } from "../utils/config"

export const getMetadataInfo = async (address: string) => {
  return fetch(new URL(`/metadata?targetAddress=${address}&pageSize=10&pageNumber=1&order=desc`, Config.NODE_URL))
    .then((res) => res.json().then((data) => data.data))
}