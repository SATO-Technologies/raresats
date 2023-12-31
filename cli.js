#!/usr/bin/env node

import { find } from "./commands/find.js";
import { extract } from "./commands/extract.js";
import { SATRIBUTES } from "./rareAndExotic/sats.js";
import { ArgumentParser } from "argparse";
import JSONbig from 'json-bigint';

const JSONbigNative = JSONbig({ useNativeBigInt: true, alwaysParseAsBig: true});

const parser = new ArgumentParser({ prog: "raresats", description: "Find and extract rare sats" });
const subparsers = parser.add_subparsers({ dest: "command" });

// Find
const findParser = subparsers.add_parser("find", { help: "Find rare sats" });

const findGroup = findParser.add_mutually_exclusive_group({ required: true });
findGroup.add_argument("-a", "--address", { help: "The address to find rare sats from", default: null});
findGroup.add_argument("-u", "--utxo", { help: "The utxo to find rare sats from", default: null});

findParser.add_argument("--ordurl", { help: "The ord instance to fetch ranges from", default: "http://127.0.0.1:4001"});
findParser.add_argument("--mempoolurl", { help: "The mempool instance to fetch utxos from", default: "https://mempool.space"});
findParser.add_argument("-s", "--satributes", { help: "The sattributes to find", nargs: "*", choices: SATRIBUTES });

// Extract
const extractParser = subparsers.add_parser("extract", { help: "Extract rare sats" });

const extractGroup = extractParser.add_mutually_exclusive_group({ required: true });
extractGroup.add_argument("-a", "--address", { help: "The address to extract rare sats from", default: null});
extractGroup.add_argument("-u", "--utxo", { help: "The utxo to extract rare sats from", default: null});

extractParser.add_argument("--ordurl", { help: "The ord instance to fetch ranges from", default: "http://127.0.0.1:4001"});
extractParser.add_argument("--mempoolurl", { help: "The mempool instance to fetch utxos from", default: "https://mempool.space"});
extractParser.add_argument("-s", "--satributes", { help: "The sattributes to extract", nargs: "*", choices: SATRIBUTES });
extractParser.add_argument("-f", "--feeutxos", { help: "The utxos to use for fees", nargs: "*", default: [] });

// Parse
const args = parser.parse_args();

if(!args.command) {
    parser.print_help();
    process.exit(0);
}

let res;

if(args.command === "find") {
  res = await find({
    address: args.address, 
    utxo: args.utxo,
    ordURL: args.ordurl,
    mempoolURL: args.mempoolurl,
    satributes: args.satributes
  });
}

if(args.command === "extract") {
  res = await extract({
    address: args.address, 
    utxo: args.utxo,
    ordURL: args.ordurl,
    mempoolURL: args.mempoolurl,
    satributes: args.satributes,
    feeUtxos: args.feeutxos
  });
}
  
let output = JSONbigNative.stringify(res, null, 2);
console.log(output);
