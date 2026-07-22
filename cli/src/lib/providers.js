// Registre des fournisseurs d'hebergement de depot -> l'interface HostAdapter.
//
// Un HostAdapter est une INTERFACE a 3 capacites, INDEPENDANTE de son substrat (une lib locale,
// une commande shell OU un serveur MCP) :
//   - existe(repo, opts)                        -> true | false | null   (test, NON destructif)
//   - creer(repo, description, isPrivate, opts) -> 'created' | 'exists' | throw   (DESTRUCTIF)
//   - urlRemote(repo, opts)                     -> string   (credential injecte, jamais persiste)
//
// Le registre mappe un NOM de provider -> un RESOLVEUR qui *produit* l'interface. La valeur n'est
// JAMAIS "un import de module Node" grave en dur : c'est une fonction qui rend l'interface, quel
// que soit le substrat. Ajouter gitlab/github (lib, shell OU MCP) = une entree + un objet qui
// remplit l'interface -- un '+' SYMETRIQUE, jamais une reecriture du geste neutre. C'est le point
// d'extension : nomme, pas hacke.

const REGISTRY = {
  // MVP : un seul adaptateur code, substrat lib (cli/src/lib/forgejo.js). Sa signature EST deja
  // l'interface HostAdapter -> on l'ENVELOPPE tel quel, on ne le modifie pas.
  forgejo: async () => {
    const f = await import('./forgejo.js');
    return {
      name: 'forgejo',
      existe: (repo, opts) => f.testRepo(repo, opts),
      creer: (repo, description, isPrivate, opts) => f.createRepo(repo, description, isPrivate, opts),
      urlRemote: (repo, opts) => f.remoteUrl(repo, opts),
    };
  },
};

// Les fournisseurs enregistres (pour les messages d'erreur et le HELP).
export function providerNames() { return Object.keys(REGISTRY); }

// Resout le HostAdapter d'un provider. Provider inconnu -> Error NETTE (jamais un crash non gere),
// nommant les fournisseurs disponibles. Le geste neutre transforme cette erreur en REFUS exit != 0.
export async function resolveAdapter(name) {
  const key = String(name || '').toLowerCase();
  const resolver = REGISTRY[key];
  if (!resolver) {
    throw new Error(`fournisseur inconnu : '${name}' ; disponible : ${providerNames().join(', ')}`);
  }
  return resolver();
}
