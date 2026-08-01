/**
 * Colombe de chargement.
 *
 * L'animation vit DANS le fichier SVG et non ici : charge par <img>, il porte sa propre feuille
 * de style, ce qui evite d'embarquer dix kilo-octets de trace vectorielle dans le paquet
 * JavaScript de chaque page. Le navigateur le met en cache une fois pour toutes les pages.
 *
 * `alt` est vide et le role masque : le texte qui accompagne la colombe dit deja « Chargement… »,
 * et l'annoncer deux fois est le defaut classique des indicateurs illustres. C'est le conteneur,
 * porteur de aria-busy, qui informe les technologies d'assistance.
 *
 * Le fichier n'a pas de fond : il se pose sur la surface d'accueil. Un aplat blanc y masque
 * toutefois le corps de l'oiseau — necessaire a la composition —, ce qui suppose une surface
 * claire. Sur un fond sombre, il faudrait une seconde variante.
 */
/**
 * @param taille cote du carre, en pixels. Le SVG est dessine sur une grille de 260 : en dessous
 *               de 60 environ, la branche d'olivier et les traits de l'aile se confondent.
 */
export default function Colombe({ taille = 80 }: { taille?: number }) {
  return (
    // next/image n'optimise pas les SVG — il les sert tels quels — et son conteneur ajouterait
    // une couche de mise en page pour un gain nul. La regle vise les images matricielles.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/colombe-loader.svg"
      alt=""
      aria-hidden="true"
      width={taille}
      height={taille}
      // Dimensions fixees en attribut ET en style : l'attribut reserve la place avant que le
      // fichier arrive, le style empeche la mise en page de sauter quand il arrive.
      style={{ width: taille, height: taille }}
      className="select-none"
      draggable={false}
    />
  );
}
