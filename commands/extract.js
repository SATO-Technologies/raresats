import { find } from './find.js';
import { success, failure } from '../utils/outputMessages.js';
import { ADDRESSES, MINVAL, PSBTModifier } from '../config.js';
import { bigIntMin } from '../utils/bigints.js';

import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import mempoolJS from "@mempool/mempool.js";

const mainnet = bitcoin.networks.bitcoin;
bitcoin.initEccLib(ecc);


function _computeOutputs(value, locations) {
  // Starting padding and first location
  let sizes = [];
  if (locations[0].offset != 0n) {
    sizes.push({size: locations[0].offset, type: "funds"});
  }

  let i;
  for (i = 0; i < locations.length - 1; i++) {
    let l1 = locations[i];
    let l2 = locations[i + 1];
    sizes.push({size: l1.size, type: l1.type});
    if (l2.offset - (l1.offset + l1.size) > 0n) {
      sizes.push({size: l2.offset - (l1.offset + l1.size), type: "funds"});
    }
  }

  // Last location and ending padding
  sizes.push({size: locations[i].size, type: locations[i].type});
  if (value - (locations[i].offset + locations[i].size) > 0n) {
    sizes.push({size: value - (locations[i].offset + locations[i].size), type: "funds"});
  }

  let res = [];
  i = 0;

  while (i < sizes.length) {
    let currentSize = sizes[i].size;
    let currentType = sizes[i].type;

    while (currentSize < MINVAL) {
      let nextIndex = i + 1;
      if (nextIndex >= sizes.length) break;

      if (sizes[nextIndex].type == "funds") {
        // Take from the funds
        let toTake = bigIntMin(MINVAL - currentSize, sizes[nextIndex].size);
        if (sizes[nextIndex].size - toTake < MINVAL) {
          // But don't let the funds go below the dust limit
          // or the next rare/exotic output will not be at offset 0
          toTake = sizes[nextIndex].size;
        }
        currentSize += toTake;
        sizes[nextIndex].size -= toTake;
        if (sizes[nextIndex].size == 0n) {
          sizes.splice(nextIndex, 1);
        }
      }
      else {
        // Merge the full values
        currentSize += sizes[nextIndex].size;
        currentType = (sizes[nextIndex].type == currentType) ? currentType : "mixed";
        sizes.splice(nextIndex, 1);
      }
    }

    res.push({size: currentSize, type: currentType});
    i++;
  }

  let total = 0n;
  for (let s of res) total += s.size;
  if (total != value) throw new Error("Sum of output sizes does not match utxo value");

  return res;
}

export async function extract({
  address = null,
  utxo = null,
  ordURL = "http://127.0.0.1:4001",
  mempoolURL = "https://mempool.space",
  satributes = null,
  feeUtxos = null,
}) {
  const { bitcoin: { transactions } } = mempoolJS({ hostname: 'mempool.space' });

  let findStatus = await find({ address, utxo, ordURL, mempoolURL, satributes });
  if (!findStatus.success) return findStatus;
  let findRes = findStatus.result;

  let utxos = Object.keys(findRes.utxos);

  let psbt = new bitcoin.Psbt({ network: mainnet });

  // Build the PSBT with no fee
  let txidToTxHex = {};
  let txidToTx = {};
  for (let u of utxos) {
    let tmp = u.split(":");
    let txid = tmp[0];
    let vout = parseInt(tmp[1]);

    try {
      txidToTxHex[txid] = await transactions.getTxHex({ txid });
      txidToTx[txid] = bitcoin.Transaction.fromHex(txidToTxHex[txid]);
    }
    catch (e) {
      return failure(`Error fetching tx hex: ${e}`);
    }

    psbt.addInput({
      hash: txid,
      index: vout,
      sequence: 0xfffffffd,
      witnessUtxo: {
        script: txidToTx[txid].outs[vout].script,
        value: txidToTx[txid].outs[vout].value,
      },
      //nonWitnessUtxo: Buffer.from(txidToTxHex[txid], 'hex'),
    });

    let outputs = _computeOutputs(BigInt(txidToTx[txid].outs[vout].value), findRes.utxos[u].locations);

    for (let o of outputs) {
      psbt.addOutput({
        script: bitcoin.address.toOutputScript(ADDRESSES[o.type], mainnet),
        value: Number(o.size),
      });
    }
  }

  let modifier = new PSBTModifier();
  let modifiedPsbt = await modifier.modifyPSBT(psbt.toBase64(), { feeUtxos });

  return success(modifiedPsbt);
}
