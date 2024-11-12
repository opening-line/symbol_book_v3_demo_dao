import type { Context } from "hono";
import { PrivateKey, PublicKey, utils } from "symbol-sdk";
import { Address, descriptors, KeyPair, models, SymbolFacade } from "symbol-sdk/symbol";
import { Config } from "../../utils/config";
import { addMultisig } from "../../functions/addMultisig";
import { createDummy } from "../../functions/createDummy";
import { env } from "hono/adapter";

export const addAdmin = async (c: Context) => {
  const { daoId, addresses } = await c.req.json() as { daoId: string, ownerPublicKey: string, addresses: string[] }

  // const daoId = 'BCEECAE597FAD80A7BB81F5BDBBD39C4D2869F6128405C04F7EC23C7227B27D6'
  // const addresses = ['TDSCLQDYNIAQQGU6MRS7THIUOO526RHFNVCRFUI']

  const ENV = env<{ PRIVATE_KEY: string }>(c)
  const facade = new SymbolFacade(Config.NETWORK)
  const masterAccount = facade.createAccount(new PrivateKey(ENV.PRIVATE_KEY))
  // Add admin to DAO

  const daoAccount = facade.createPublicAccount(new PublicKey(daoId))

  const newAdmins = addresses.map((address) => new Address(address))

  const daoAccountMultisig = addMultisig(newAdmins)

  const multisigTransaction = facade.createEmbeddedTransactionFromTypedDescriptor(daoAccountMultisig, daoAccount.publicKey)

  const dummy = createDummy(daoAccount.address.toString())
  const dummyTransaction = facade.createEmbeddedTransactionFromTypedDescriptor(dummy, masterAccount.publicKey)
  const innerTransactions = [
    multisigTransaction,
    dummyTransaction
  ]

    // TODO: 署名
  const txHash = SymbolFacade.hashEmbeddedTransactions(innerTransactions)
  const aggregateDes = new descriptors.AggregateCompleteTransactionV2Descriptor(
    txHash,
    innerTransactions,
  )
  const tx = models.AggregateCompleteTransactionV2.deserialize(
    facade
      .createTransactionFromTypedDescriptor(
        aggregateDes,
        masterAccount.publicKey,
        Config.FEE_MULTIPLIER,
        Config.DEADLINE_SECONDS,
      )
      .serialize(),
  )

  const signatureMaster = masterAccount.signTransaction(tx)

  facade.transactionFactory.static.attachSignature(tx, signatureMaster)

  const newbie = new KeyPair(new PrivateKey('12F0717F0B48D9A4EE355FEAF9C0FD9F56136F9AF15857666C746A0CA4CC21EF')) // TDSCL...
  const cosign = facade.cosignTransaction(newbie, tx)

  tx.cosignatures.push(cosign)

  const owner = new KeyPair(new PrivateKey('39324C83D5427071E2D56513558A56D50EF874A92CCD53F5AE7976AE1473BBA6')) // TD61E...
  const cosign2 = facade.cosignTransaction(owner, tx)

  tx.cosignatures.push(cosign2)

  const jsonPayload2 = `{"payload":"${utils.uint8ToHex(tx.serialize())}"}`;

  const hash = facade.hashTransaction(tx)

  const sendRes = await fetch(
      new URL('/transactions', Config.NODE_URL),
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload2 }
  )
      .then((res) => res.json());
  console.log(sendRes);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const statusRes = await fetch(new URL("/transactionStatus/" + hash, Config.NODE_URL))
      .then((res) => res.json());
  console.log(statusRes);
  

  return c.json({ message: "Hello addAdmin" });
}