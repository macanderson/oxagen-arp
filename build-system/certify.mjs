#!/usr/bin/env node
// An operator runs this explicitly after reviewing the exported payload and
// artifacts. It is never called by the controller or an agent.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {assert,canonical} from './lib/core.mjs';
const [payloadFile,keyFile,outputFile]=process.argv.slice(2);
try{
 assert(payloadFile&&keyFile&&outputFile,'Usage: node certify.mjs REVIEWED_PAYLOAD.json PRIVATE_KEY.pem CERTIFICATE.json');
 assert(!fs.existsSync(outputFile),'Certificate output already exists; review replacement separately');
 const payload=JSON.parse(fs.readFileSync(payloadFile));
 assert(payload.scope==='phase-zero'&&payload.planDigest&&payload.inputsDigest&&payload.profileDigest&&Object.keys(payload.files||{}).length>=3,'Incomplete reviewed local profile payload');
 assert(Number.isFinite(Date.parse(payload.expiresAt))&&Date.parse(payload.expiresAt)>Date.now(),'Set a future expiry in the reviewed payload before signing');
 assert((fs.statSync(keyFile).mode&0o077)===0,'Signing key must be private to the certifier');
 const key=crypto.createPrivateKey(fs.readFileSync(keyFile));assert(key.asymmetricKeyType==='ed25519','Use an Ed25519 signing key');
 const signature=crypto.sign(null,Buffer.from(canonical(payload)),key).toString('base64');
 fs.mkdirSync(path.dirname(path.resolve(outputFile)),{recursive:true});const fd=fs.openSync(outputFile,'wx',0o600);try{fs.writeSync(fd,canonical({payload,signature})+'\n');fs.fsyncSync(fd);}finally{fs.closeSync(fd);}
 console.log('Signed the exact supplied review payload. The controller will check it against current files and settings.');
}catch(error){console.error(error.message);process.exitCode=1;}
