# Raresats

## Abstract
We provide a tool to find and extract rare sats in a wallet. We currently support the following rare and exotic types:
- Rodarmor rarity:
  - uncommon
  - rare
  - epic
  - legendary
  - mythic
- Exotic sats:
  - black
  - alpha
  - omega
  - nakamoto
  - palindrome
  - first tx
  - block 9
  - block 78
  - vintage
  - pizza

## Installation
The tool is available as a npm package (soon). You can install it with the following command:

```bash
git clone https://github.com/SATO-Technologies/raresats.git
cd raresats
npm install --global .
```

## Usage
The tool can be used as a CLI or as a library. The CLI is available with the `raresats` command and the library is available with the `raresats` package.

### Find

#### CLI

```bash
raresats find -a <address> -s uncommon rare epic legendary
raresats find -u <utxo> -s black alpha omega
```

Options:
- `--ordurl <url>`: the url of the ord instance used to fetch ranges (default: http://127.0.0.1:4001). This instance MUST run the JSON-RPC API.
- `--mempoolurl <url>`: the url of the mempool instance used to fetch utxos (default: https://mempool.space)
- `-s <satributes>`: the satributes to search for (default: all) separated by a space.

Library:
```javascript
const raresats = require('raresats');
const res = raresats.find({
  address: 'bc1p...',
  satributes: ['uncommon', 'rare', 'epic', 'legendary'],
});
console.log(res);
```
