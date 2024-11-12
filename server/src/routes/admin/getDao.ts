import type { Context } from "hono";
import { SymbolFacade } from "symbol-sdk/symbol";
import { Config } from "../../utils/config";
import { PublicKey } from "symbol-sdk";

export const getDao = async (c: Context) => {
  const id = c.req.param('id')
  const facade = new SymbolFacade(Config.NETWORK)
  const daoAccount = facade.createPublicAccount(new PublicKey(id))
  const address = daoAccount.address
  const mdRes = await fetch(new URL(`/metadata?targetAddress=${address}&pageSize=10&pageNumber=1&order=desc`, Config.NODE_URL))
    .then((res) => res.json().then((data) => data.data));
  console.log(mdRes);
  const msRes = await fetch(new URL(`/account/${address}/multisig`, Config.NODE_URL))
    .then((res) => res.json().then((data) => data.multisig));
  console.log(msRes);

  const textDecoder = new TextDecoder()

  const metadata = mdRes.map((e: {metadataEntry: {scopedMetadataKey: string, value: string}}) => {
    return {
      key: e.metadataEntry.scopedMetadataKey,
      value: textDecoder.decode(Uint8Array.from(Buffer.from(e.metadataEntry.value, 'hex')))  
    }
  }).sort((a: {key: string}, b: {key: string}) => a.key.localeCompare(b.key))

  const res = {
    address: address.toString(),
    metadata: metadata,
    cosignatory: msRes.cosignatoryAddresses
  }

  return c.json(res)
}