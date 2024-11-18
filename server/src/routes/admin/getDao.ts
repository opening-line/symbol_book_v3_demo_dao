import type { Context } from "hono";
import { Address, models, SymbolFacade } from "symbol-sdk/symbol";
import { Config } from "../../utils/config";
import { PublicKey, utils } from "symbol-sdk";
import { getMultisigInfo } from "../../info/getMultisigInfo";
import { getMetadataInfo } from "../../info/getMetadataInfo";

export const getDao = async (c: Context) => {
  const id = c.req.param('id')
  const facade = new SymbolFacade(Config.NETWORK)
  const daoAccount = facade.createPublicAccount(new PublicKey(id))
  const address = daoAccount.address
  const mdRes = await getMetadataInfo(address.toString())
  const msRes = await getMultisigInfo(address.toString())

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
    cosignatory: msRes.cosignatoryAddresses.map((cosignatory: string) => new Address((new models.UnresolvedAddress(utils.hexToUint8(cosignatory)).bytes)).toString())
  }

  return c.json(res)
}