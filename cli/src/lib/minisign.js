// Verification minisign (Ed25519), pour les etapes 3/4 du verbe `install` (lot C.1,
// specs/instructions/chaine-complete-install-amorcage-dmg-msi.md § 5.4 : « les etapes 3 et 4
// telechargent des bundles signes depuis les sources ordonnees d'AR-H et verifient la signature
// avant de poser »).
//
// PORTE, PAS ECRIT ICI EN PREMIER : ce module est un PORTAGE quasi verbatim de la logique deja
// EPROUVEE et LIVREE (lot B, § 0.2/M11) dans les deux apps consommatrices —
// `iakaFrameGUI/scripts/mesurer-artefacts.mjs` (et son jumeau byte-identique cote IakaCockpit,
// `fixtures/convergence.sha256`). Porte ici, PAS reimporte depuis ces depots, parce que le CLI
// (ce qui pose CES apps chez un utilisateur qui n'a NI l'un NI l'autre depot sur sa machine) ne
// peut pas dependre d'un module qui vit dans ce qu'il installe. AR-E : « ces deux depots ne sont
// pas a modifier par ce lot » — ce portage ne les touche pas, il en RECOPIE la logique deja
// mesuree, avec son propre jeu de tests (cli/test/minisign.test.js), offline.
//
// Zero dependance externe : minisign se verifie avec `node:crypto` seul (Ed25519 + blake2b-512).
import { createHash, createPublicKey, verify as cryptoVerify } from 'node:crypto';

/** Prefixe DER SPKI d'une cle publique Ed25519 brute (32 octets). */
const SPKI_ED25519 = Buffer.from('302a300506032b6570032100', 'hex');

/**
 * Decode le bloc `pubkey` de `tauri.conf.json` : c'est un FICHIER minisign entier, encode en
 * base64. Sa derniere ligne non vide porte `algo(2) || keyid(8) || cle(32)` = 42 octets.
 */
export function parsePublicKey(pubkeyB64) {
  const texte = Buffer.from(String(pubkeyB64), 'base64').toString('utf8');
  const lignes = texte.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const brut = Buffer.from(lignes[lignes.length - 1], 'base64');
  if (brut.length !== 42) {
    throw new Error(`cle publique minisign invalide : ${brut.length} octets, 42 attendus`);
  }
  return {
    algo: brut.subarray(0, 2).toString('utf8'),
    keyId: brut.subarray(2, 10).toString('hex'),
    cle: createPublicKey({
      key: Buffer.concat([SPKI_ED25519, brut.subarray(10)]),
      format: 'der',
      type: 'spki',
    }),
  };
}

/**
 * Decode une signature minisign (le champ `signature` d'une entree de plateforme du manifeste
 * est ce fichier, en base64).
 *
 * Format : 4 lignes — commentaire non fiable, `algo(2)||keyid(8)||sig(64)`, `trusted comment: …`,
 * signature GLOBALE (64 octets) sur `sig || trusted_comment`.
 */
export function parseSignature(signatureB64) {
  const texte = Buffer.from(String(signatureB64), 'base64').toString('utf8');
  const lignes = texte.split(/\r?\n/);
  const brut = Buffer.from(lignes[1] ?? '', 'base64');
  if (brut.length !== 74) {
    throw new Error(`signature minisign invalide : ${brut.length} octets, 74 attendus`);
  }
  const ligneTrusted = lignes[2] ?? '';
  const prefixe = 'trusted comment: ';
  if (!ligneTrusted.startsWith(prefixe)) {
    throw new Error("signature minisign sans `trusted comment` — signature globale inverifiable");
  }
  const trustedComment = ligneTrusted.slice(prefixe.length);
  const globale = Buffer.from(lignes[3] ?? '', 'base64');
  if (globale.length !== 64) {
    throw new Error(`signature globale invalide : ${globale.length} octets, 64 attendus`);
  }
  return {
    algo: brut.subarray(0, 2).toString('utf8'),
    keyId: brut.subarray(2, 10).toString('hex'),
    signature: brut.subarray(10),
    trustedComment,
    globale,
  };
}

/** Le fichier que la signature pretend signer, lu dans son `trusted comment` (`file:<nom>`). */
export function fichierSigne(trustedComment) {
  const m = /(?:^|\s)file:(.+?)(?:\s|$)/.exec(String(trustedComment));
  return m ? m[1] : null;
}

/**
 * Verifie une signature minisign contre des OCTETS.
 *
 * `"ED"` = pre-hachage blake2b-512 (ce que produit Tauri) ; `"Ed"` = signature directe (legacy).
 * Renvoie `{ valide, globaleValide, keyIdConcorde, algo, motif }` — JAMAIS d'exception sur un
 * echec de verification : un echec est une MESURE (CA-14 : bundle refuse), pas un incident.
 */
export function verifierMinisign({ octets, signature, clePublique }) {
  const sig = parseSignature(signature);
  const keyIdConcorde = sig.keyId === clePublique.keyId;
  let message;
  if (sig.algo === 'ED') message = createHash('blake2b512').update(octets).digest();
  else if (sig.algo === 'Ed') message = octets;
  else {
    return {
      valide: false,
      globaleValide: false,
      keyIdConcorde,
      algo: sig.algo,
      trustedComment: sig.trustedComment,
      motif: `algorithme minisign inconnu : ${sig.algo}`,
    };
  }
  const valide = cryptoVerify(null, message, clePublique.cle, sig.signature);
  const globaleValide = cryptoVerify(
    null,
    Buffer.concat([sig.signature, Buffer.from(sig.trustedComment, 'utf8')]),
    clePublique.cle,
    sig.globale,
  );
  return {
    valide,
    globaleValide,
    keyIdConcorde,
    algo: sig.algo,
    trustedComment: sig.trustedComment,
    motif: valide && globaleValide && keyIdConcorde ? 'ok' : 'verification en echec',
  };
}
