/**
 * Mot de passe provisoire, tire au hasard et destine a etre DICTE.
 *
 * Un mot de passe constant du type « user123 » rendrait chaque compte patient accessible a qui
 * connait la convention : l'adresse de connexion se deduit du nom, et le dossier medical
 * s'ouvrirait avec. Le tirage supprime ce secret partage sans rien couter a l'accueil — le champ
 * est pre-rempli, l'infirmiere le lit au patient.
 *
 * L'alphabet exclut ce qui se confond a l'oral ou a la lecture : ni O ni 0, ni I ni l ni 1, ni
 * ambiguite entre majuscules et minuscules puisqu'il n'y a que des minuscules. Un mot de passe
 * qu'on dicte mal est un mot de passe qu'on remplace par un post-it.
 */
const CONSONNES = "bcdfghjkmnpqrstvwxz";
const VOYELLES = "aeuy";
const CHIFFRES = "23456789";

/** Tirage cryptographique : Math.random n'est pas fait pour produire un secret. */
function tirer(alphabet: string, hasard: Uint32Array, index: number): string {
  return alphabet[hasard[index] % alphabet.length];
}

/**
 * Rend quelque chose comme « kefa-tumo-47 » : deux syllabes prononcables, deux chiffres.
 *
 * Douze caracteres, largement au-dessus du minimum de huit impose par le formulaire, et
 * lisible au telephone.
 */
export function genererMotDePasse(): string {
  const hasard = new Uint32Array(10);
  crypto.getRandomValues(hasard);

  const syllabe = (decalage: number) =>
    tirer(CONSONNES, hasard, decalage) +
    tirer(VOYELLES, hasard, decalage + 1) +
    tirer(CONSONNES, hasard, decalage + 2) +
    tirer(VOYELLES, hasard, decalage + 3);

  return `${syllabe(0)}-${syllabe(4)}-${tirer(CHIFFRES, hasard, 8)}${tirer(CHIFFRES, hasard, 9)}`;
}
