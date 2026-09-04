// Gardes de lib/minisign.js (lot C.1, CA-14) — verification minisign OFFLINE, sans toucher au
// reseau : une paire de cles Ed25519 est generee EN MEMOIRE et une signature au FORMAT minisign
// exact (4 lignes, algo/keyid/sig + trusted comment + signature globale) est construite a la
// main, pour rejouer EXACTEMENT le contrat que `verifierMinisign` attend — jamais une confiance
// aveugle dans un fichier de fixture recopie.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createHash, sign as cryptoSign, randomBytes } from 'node:crypto';
import { parsePublicKey, parseSignature, verifierMinisign, fichierSigne } from '../src/lib/minisign.js';

// --- Fabrique une paire de cles + un "fichier" minisign valide, offline --------------------------

function fabriquerPaire() {
  const { publicKey, privateKey } = generateKeyPairSync('ed25519');
  const keyId = randomBytes(8); // distinct a CHAQUE appel — deux paires ne doivent JAMAIS partager un keyid
  // Cle publique EXPORTEE au format DER SPKI, puis les 32 DERNIERS octets sont la cle brute
  // Ed25519 (le prefixe SPKI est fixe et connu de `parsePublicKey`).
  const der = publicKey.export({ format: 'der', type: 'spki' });
  const brute = der.subarray(der.length - 32);
  const bloc = Buffer.concat([Buffer.from('Ed'), keyId, brute]); // 42 octets : algo+keyid+cle
  const pubkeyFichier = `untrusted comment: fixture\n${bloc.toString('base64')}\n`;
  const pubkeyB64 = Buffer.from(pubkeyFichier, 'utf8').toString('base64');
  return { publicKey, privateKey, keyId, pubkeyB64 };
}

/** Signe `octets` au format minisign "ED" (pre-hachage blake2b-512, ce que produit Tauri). */
function signerED({ octets, privateKey, keyId, fichier = 'bundle.tar.gz' }) {
  const message = createHash('blake2b512').update(octets).digest();
  const sig = cryptoSign(null, message, privateKey); // 64 octets
  const sigBloc = Buffer.concat([Buffer.from('ED'), keyId, sig]); // 74 octets
  const trustedComment = `timestamp:0\tfile:${fichier}`;
  const globale = cryptoSign(null, Buffer.concat([sig, Buffer.from(trustedComment, 'utf8')]), privateKey);
  const texte = [
    'untrusted comment: signature from minisign secret key',
    sigBloc.toString('base64'),
    `trusted comment: ${trustedComment}`,
    globale.toString('base64'),
  ].join('\n');
  return Buffer.from(texte, 'utf8').toString('base64');
}

test('parsePublicKey : decode algo/keyid/cle depuis le bloc fabrique', () => {
  const { pubkeyB64, keyId } = fabriquerPaire();
  const cle = parsePublicKey(pubkeyB64);
  assert.equal(cle.algo, 'Ed');
  assert.equal(cle.keyId, keyId.toString('hex'));
});

test('verifierMinisign : signature VALIDE sur les octets exacts -> valide+globaleValide+keyIdConcorde', () => {
  const { privateKey, keyId, pubkeyB64 } = fabriquerPaire();
  const octets = Buffer.from('contenu du bundle, fixture minisign.test.js');
  const signature = signerED({ octets, privateKey, keyId });
  const clePublique = parsePublicKey(pubkeyB64);
  const v = verifierMinisign({ octets, signature, clePublique });
  assert.equal(v.valide, true);
  assert.equal(v.globaleValide, true);
  assert.equal(v.keyIdConcorde, true);
  assert.equal(v.motif, 'ok');
  assert.equal(fichierSigne(v.trustedComment), 'bundle.tar.gz');
});

// TEMOIN NEGATIF (obligatoire, § "un contrefactuel doit pouvoir echouer") : la MEME signature,
// rejouee contre un octet retourne, DOIT rendre invalide — sinon la verification ne prouve rien.
test('CA-14, temoin negatif : UN octet retourne -> signature INVALIDE (jamais un "toujours vrai")', () => {
  const { privateKey, keyId, pubkeyB64 } = fabriquerPaire();
  const octets = Buffer.from('contenu du bundle, fixture minisign.test.js');
  const signature = signerED({ octets, privateKey, keyId });
  const clePublique = parsePublicKey(pubkeyB64);
  const alteres = Buffer.from(octets);
  alteres[Math.floor(alteres.length / 2)] ^= 0xff;
  const v = verifierMinisign({ octets: alteres, signature, clePublique });
  assert.equal(v.valide, false, 'CONTREFACTUEL : un octet altéré doit faire ROUGIR la vérification');
  assert.equal(v.motif, 'verification en echec');
});

test('CA-14 : signature d\'une AUTRE paire de clés (keyid different) -> keyIdConcorde=false, refuse', () => {
  const paireA = fabriquerPaire();
  const paireB = fabriquerPaire();
  const octets = Buffer.from('bundle signe par A, verifie contre la cle publique de B');
  const signature = signerED({ octets, privateKey: paireA.privateKey, keyId: paireA.keyId });
  const clePubliqueB = parsePublicKey(paireB.pubkeyB64);
  const v = verifierMinisign({ octets, signature, clePublique: clePubliqueB });
  assert.equal(v.keyIdConcorde, false);
  assert.equal(v.valide, false, 'la signature de A ne doit PAS se vérifier contre la clé de B');
});

test('parseSignature : rejette une signature au format tronque (moins de 74 octets)', () => {
  const texte = ['c', Buffer.from([1, 2, 3]).toString('base64'), 'trusted comment: x', Buffer.from([4]).toString('base64')].join('\n');
  assert.throws(() => parseSignature(Buffer.from(texte, 'utf8').toString('base64')), /signature minisign invalide/);
});

test('parsePublicKey : rejette une cle au format tronque (pas 42 octets)', () => {
  const texte = `c\n${Buffer.from([1, 2, 3]).toString('base64')}\n`;
  assert.throws(() => parsePublicKey(Buffer.from(texte, 'utf8').toString('base64')), /cle publique minisign invalide/);
});
