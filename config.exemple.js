import { SATRIBUTES } from "./rareAndExotic/sats.js";
import * as ecc from 'tiny-secp256k1'
import bs58check from 'bs58check';
import { BIP32Factory } from 'bip32';
import * as bitcoin from 'bitcoinjs-lib';

const mainnet = bitcoin.networks.bitcoin;
bitcoin.initEccLib(ecc);
const bip32 = BIP32Factory(ecc);

/*
  >>> PERSONALIZE THIS <<<

  The minimum value of an output in satoshis. This is used to pad outputs to the minimum value.
  The code treats this value as the dust limit.
*/
const MINVAL = 600n;

/*
  >>> PERSONALIZE THIS <<<

  A class to modify a PSBT based on personal preferences.

  For a simple hot wallet setup:
    - Add funding input and change output

  For a multisig setup involving hardware wallets for instance:
    - Add globalXpubs
    - Add bip32Derivation
    - Add witnessScript
    - Add funding input and change output
*/
class PSBTModifier {
 

  constructor() {}

  modifyPSBT(psbtBase64) {
    return psbtBase64;
  }
}

/*
  >>> PERSONALIZE THIS <<<

  It is a map associating an address to a list of sattributes controlled by this address

  Like this:
  {
  "address1": [
    "type1",
    "type2",
  ],
  "address2": [
    "type3",
    "type4",
  ],
  }

  The types from SATRIBUTES must be present.
  The type "funds" is reserved for the address that will receive the funds and must be present.
  The type "fundingChange" is reserved for the address that will receive the change of the funding utxo and must be present.
*/
const _addressesToTypes = {
  
}

const ADDRESSES = {};

for (let address of Object.keys(_addressesToTypes)) {
  for (let type of _addressesToTypes[address]) {
    // Detect collisions
    if (type in ADDRESSES) {
      throw new Error(`Collision for type ${type}`);
    }
    ADDRESSES[type] = address;
  }
}

// Make sure all sattributes are in ADDRESSES
let n1 = Object.keys(ADDRESSES).length;
let n2 = SATRIBUTES.length + 3;
if (n1 != n2 || [...SATRIBUTES, "funds", "fundingChange", "mixed"].some(s => !(s in ADDRESSES))) {
  throw new Error("Mismatch between sattributes and addresses");
}

export { ADDRESSES, MINVAL, PSBTModifier};