#!/usr/bin/env node
// A human runs this only after reviewing the exact staging release evidence.
// The controller and product agents never call it or receive its private key.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {assert,canonical} from './lib/core.mjs';
const [bodyFile,keyFile,outputFile]=process.argv.slice(2);
try{
 assert(bodyFile&&keyFile&&outputFile,'Usage: node approve-release.mjs REVIEWED_BODY.json PRIVATE_KEY.pem APPROVAL.json');
 assert(!fs.existsSync(outputFile),'Approval output exists; review replacement separately');
 const body=JSON.parse(fs.readFileSync(bodyFile));
 assert(/^[0-9a-f]{40}$/.test(body.executionHead)&&/^[0-9a-f]{64}$/.test(body.artifactDigest),'An exact source commit and release artifact digest are required');
 assert(typeof body.target==='string'&&body.target.length>0&&typeof body.releaseId==='string'&&body.releaseId.length>0&&typeof body.nonce==='string'&&body.nonce.length>=16,'Target, release ID and unique nonce are required');
 const remaining=Date.parse(body.expiresAt)-Date.now();assert(remaining>0&&remaining<=24*60*60*1000,'Review an explicit expiry within 24 hours');
 assert((fs.statSync(keyFile).mode&0o077)===0,'Signing key must be private to the approver');
 const key=crypto.createPrivateKey(fs.readFileSync(keyFile));assert(key.asymmetricKeyType==='ed25519','Use an Ed25519 signing key');
 const signature=crypto.sign(null,Buffer.from(canonical(body)),key).toString('base64');
 fs.mkdirSync(path.dirname(path.resolve(outputFile)),{recursive:true});const fd=fs.openSync(outputFile,'wx',0o600);try{fs.writeSync(fd,canonical({body,signature})+'\n');fs.fsyncSync(fd)}finally{fs.closeSync(fd)}
 console.log('Signed the exact supplied production release approval. No deployment was started.');
}catch(e){console.error(e.message);process.exitCode=1}
