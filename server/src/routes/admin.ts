import { Hono } from 'hono';
import { PrivateKey, PublicKey, utils } from 'symbol-sdk';
import { KeyPair, metadataUpdateValue, Network, SymbolFacade } from 'symbol-sdk/symbol';
import { METADATA_KEYS } from '../utils/metadataKeys.js';
import { env } from "hono/adapter"
const adminRoute = new Hono();

const NODE_URL = "https://sym-test-03.opening-line.jp:3001"
const facade = new SymbolFacade(Network.TESTNET.toString())
const network = Network.TESTNET

const deadline = facade.now().addHours(2).timestamp


adminRoute.get('/new', async (c) => {
  // const body = await c.req.json();
  
  const ENV = env<{ PRIVATE_KEY: string }>(c)
  const owner = new KeyPair(new PrivateKey(ENV.PRIVATE_KEY))


  // TODO: generate accounts
  const account = facade.createAccount(PrivateKey.random())

  const voteA = facade.createAccount(PrivateKey.random())
  const voteB = facade.createAccount(PrivateKey.random())
  const voteC = facade.createAccount(PrivateKey.random())
  const voteD = facade.createAccount(PrivateKey.random())
  // TODO: マルチシグアカウントに変換 1 of 1


  const multisigTx = facade.transactionFactory.createEmbedded({
    type: "multisig_account_modification_transaction_v1",
    signerPublicKey: account.publicKey,
    minApprovalDelta: 1,
    minRemovalDelta: 1,
    addressAdditions: [network.publicKeyToAddress(owner.publicKey)],
    addressDeletions: [],
  })

  // TODO: link vote accounts

  const keyA = METADATA_KEYS.VOTE_A
  const keyB = METADATA_KEYS.VOTE_B
  const keyC = METADATA_KEYS.VOTE_C
  const keyD = METADATA_KEYS.VOTE_D

  const textEncoder = new TextEncoder()

  const metadataTxA = facade.transactionFactory.createEmbedded({
    type: 'account_metadata_transaction_v1',
    signerPublicKey: owner.publicKey,
    targetAddress: network.publicKeyToAddress(account.publicKey),
    scopedMetadataKey: keyA,
    valueSizeDelta: 64,
    value: metadataUpdateValue(textEncoder.encode(""), textEncoder.encode(voteA.publicKey.toString())), 
  })
  const metadataTxB = facade.transactionFactory.createEmbedded({
    type: 'account_metadata_transaction_v1',
    signerPublicKey: owner.publicKey,
    targetAddress: network.publicKeyToAddress(account.publicKey),
    scopedMetadataKey: keyB,
    valueSizeDelta: 64,
    value: metadataUpdateValue(textEncoder.encode(""), textEncoder.encode(voteB.publicKey.toString())), 
  })
  const metadataTxC = facade.transactionFactory.createEmbedded({
    type: 'account_metadata_transaction_v1',
    signerPublicKey: owner.publicKey,
    targetAddress: network.publicKeyToAddress(account.publicKey),
    scopedMetadataKey: keyC,
    valueSizeDelta: 64,
    value: metadataUpdateValue(textEncoder.encode(""), textEncoder.encode(voteC.publicKey.toString())), 
  })
  const metadataTxD = facade.transactionFactory.createEmbedded({
    type: 'account_metadata_transaction_v1',
    signerPublicKey: owner.publicKey,
    targetAddress: network.publicKeyToAddress(account.publicKey),
    scopedMetadataKey: keyD,
    valueSizeDelta: 64,
    value: metadataUpdateValue(textEncoder.encode(""), textEncoder.encode(voteD.publicKey.toString())), 
  })

  const innnerTxs = [multisigTx, metadataTxA, metadataTxB, metadataTxC, metadataTxD]
  const transactionsHash = SymbolFacade.hashEmbeddedTransactions(innnerTxs)

  const transaction = facade.transactionFactory.create({
      type: 'aggregate_complete_transaction_v2',
      signerPublicKey: owner.publicKey,
      fee: 1000000n,
      deadline,
      transactions: innnerTxs,
      transactionsHash,
  })

  const signature = facade.signTransaction(owner, transaction);


  const jsonPayload = facade.transactionFactory.static.attachSignature(transaction, signature);

  const cosign = facade.cosignTransaction(account.keyPair, transaction)
  /** @ts-ignore */
  transaction.cosignatures.push(cosign)

  const jsonPayload2 = `{"payload":"${utils.uint8ToHex(transaction.serialize())}"}`;

  const hash = facade.hashTransaction(transaction)

  const sendRes = await fetch(
      new URL('/transactions', NODE_URL),
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload2 }
  )
      .then((res) => res.json());
  console.log(sendRes);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const statusRes = await fetch(new URL("/transactionStatus/" + hash, NODE_URL))
      .then((res) => res.json());
  console.log(statusRes);


  return c.json({ message: 'Organization created', data: {
    account: account.keyPair.publicKey.toString(),
    voteA: voteA.keyPair.privateKey.toString(),
    voteB: voteB.keyPair.privateKey.toString(),
    voteC: voteC.keyPair.privateKey.toString(),
    voteD: voteD.keyPair.privateKey.toString(), 
  } });
});


adminRoute.get('/get', async (c) => {
  const address = 'TBBK4CCZYAXRAHIDKDLBHT7DWIDRKGX7G4Q2JGQ'

  const mdRes = await fetch(new URL(`/metadata?targetAddress=${address}&pageSize=10&pageNumber=1&order=desc`, NODE_URL))
    .then((res) => res.json().then((data) => data.data));
  console.log(mdRes);
  const msRes = await fetch(new URL(`/account/${address}/multisig`, NODE_URL))
    .then((res) => res.json().then((data) => data.multisig));
  console.log(msRes);

  const metadata = mdRes.map((e: {metadataEntry: {scopedMetadataKey: string, value: string}}) => {
    return {
      key: e.metadataEntry.scopedMetadataKey,
      value: e.metadataEntry.value
    }
  })

  const res = {
    address,
    metadata: metadata,
    cosignatory: msRes.cosignatoryAddresses
  }

  return c.json(res)
})


adminRoute.get('/add', async (c) => {
  const ENV = env<{ PRIVATE_KEY: string }>(c)
  const owner = new KeyPair(new PrivateKey(ENV.PRIVATE_KEY))


  const newAdmin = facade.createAccount(new PrivateKey('6D8990D23807A7BAF7C3D30F7892D477097E3C83CC238D25F4634E98EF74E785'))
  const account = facade.createPublicAccount(new PublicKey('4D31AEFA5E131DBAB03ACFB122D8C21A833F5DF667525221590FF67F8E14F84E'))

  console.log(newAdmin.address.toString())

  const multisigTx = facade.transactionFactory.createEmbedded({
    type: "multisig_account_modification_transaction_v1",
    signerPublicKey: account.publicKey,
    minApprovalDelta: 1,
    minRemovalDelta: 1,
    addressAdditions: [network.publicKeyToAddress(newAdmin.publicKey)],
    addressDeletions: [],
  })

  const innnerTxs = [multisigTx]
  const transactionsHash = SymbolFacade.hashEmbeddedTransactions(innnerTxs)

  const transaction = facade.transactionFactory.create({
      type: 'aggregate_complete_transaction_v2',
      signerPublicKey: owner.publicKey,
      fee: 1000000n,
      deadline,
      transactions: innnerTxs,
      transactionsHash,
  })

  const signature = facade.signTransaction(owner, transaction);


  const jsonPayload = facade.transactionFactory.static.attachSignature(transaction, signature);

  const cosign = facade.cosignTransaction(newAdmin.keyPair, transaction)
  /** @ts-ignore */
  transaction.cosignatures.push(cosign)

  const jsonPayload2 = `{"payload":"${utils.uint8ToHex(transaction.serialize())}"}`;

  const hash = facade.hashTransaction(transaction)

  const sendRes = await fetch(
      new URL('/transactions', NODE_URL),
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload2 }
  )
      .then((res) => res.json());
  console.log(sendRes);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const statusRes = await fetch(new URL("/transactionStatus/" + hash, NODE_URL))
      .then((res) => res.json());
  console.log(statusRes);

  const res = {
    pri: newAdmin.keyPair.privateKey.toString(),
    pub: newAdmin.keyPair.publicKey.toString(),
  }

  return c.json(res)
})
adminRoute.get('/remove', async (c) => {
  const ENV = env<{ PRIVATE_KEY: string }>(c)
  const owner = new KeyPair(new PrivateKey(ENV.PRIVATE_KEY))


  const newAdmin = facade.createAccount(new PrivateKey('6D8990D23807A7BAF7C3D30F7892D477097E3C83CC238D25F4634E98EF74E785'))
  const account = facade.createPublicAccount(new PublicKey('4D31AEFA5E131DBAB03ACFB122D8C21A833F5DF667525221590FF67F8E14F84E'))

  console.log(newAdmin.address.toString())

  const multisigTx = facade.transactionFactory.createEmbedded({
    type: "multisig_account_modification_transaction_v1",
    signerPublicKey: account.publicKey,
    minApprovalDelta: -1,
    minRemovalDelta: -1,
    addressAdditions: [],
    addressDeletions: [network.publicKeyToAddress(newAdmin.publicKey)],
  })

  const innnerTxs = [multisigTx]
  const transactionsHash = SymbolFacade.hashEmbeddedTransactions(innnerTxs)

  const transaction = facade.transactionFactory.create({
      type: 'aggregate_complete_transaction_v2',
      signerPublicKey: owner.publicKey,
      fee: 1000000n,
      deadline,
      transactions: innnerTxs,
      transactionsHash,
  })

  const signature = facade.signTransaction(owner, transaction);


  const jsonPayload = facade.transactionFactory.static.attachSignature(transaction, signature);

  const cosign = facade.cosignTransaction(newAdmin.keyPair, transaction)
  /** @ts-ignore */
  transaction.cosignatures.push(cosign)

  const jsonPayload2 = `{"payload":"${utils.uint8ToHex(transaction.serialize())}"}`;

  const hash = facade.hashTransaction(transaction)

  const sendRes = await fetch(
      new URL('/transactions', NODE_URL),
      { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: jsonPayload2 }
  )
      .then((res) => res.json());
  console.log(sendRes);

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const statusRes = await fetch(new URL("/transactionStatus/" + hash, NODE_URL))
      .then((res) => res.json());
  console.log(statusRes);

  const res = {
    pri: newAdmin.keyPair.privateKey.toString(),
    pub: newAdmin.keyPair.publicKey.toString(),
  }

  return c.json(res)
})

export default adminRoute;