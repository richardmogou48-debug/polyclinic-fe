export type Role =
  | "patient"
  | "doctor"
  | "nurse"
  | "pharmacist"
  | "secretary"
  | "labo"
  | "imagerie"
  | "hr"
  | "finance"
  | "quality"
  | "admin";

export type NavItem = {
  label: string;
  href: string;
  description: string;
};

export type RoleConfig = {
  role: Role;
  label: string;
  basePath: string;
  navItems: NavItem[];
};

const withBase = (
  basePath: string,
  items: (Omit<NavItem, "href"> & { slug: string })[]
): NavItem[] =>
  items.map(({ slug, ...item }) => ({
    ...item,
    href: slug ? `${basePath}/${slug}` : basePath,
  }));

export const roleConfigs: Record<Role, RoleConfig> = {
  patient: {
    role: "patient",
    label: "Patient",
    basePath: "/dashboard/patient",
    navItems: withBase("/dashboard/patient", [
      { slug: "", label: "Vue d'ensemble", description: "Résumé de votre suivi médical." },
      { slug: "rendez-vous", label: "Mes rendez-vous", description: "Consultez et gérez vos rendez-vous." },
      { slug: "dossier-medical", label: "Mon dossier médical", description: "Historique médical, ordonnances, examens." },
      { slug: "factures", label: "Mes factures", description: "Factures et paiements." },
      { slug: "teleconsultation", label: "Téléconsultation", description: "Rejoindre une consultation à distance." },
      { slug: "profil", label: "Mon profil", description: "Informations personnelles." },
    ]),
  },
  doctor: {
    role: "doctor",
    label: "Médecin",
    basePath: "/dashboard/doctor",
    navItems: withBase("/dashboard/doctor", [
      { slug: "", label: "Vue d'ensemble", description: "Aperçu de votre journée." },
      { slug: "rendez-vous", label: "Mes rendez-vous", description: "Planning de consultations." },
      // Le poste de travail du medecin : consultation, examens, ordonnance et hospitalisation
      // s'y enchainent. Place avant les dossiers, qui ne servent qu'a relire.
      { slug: "consultations", label: "Consultations", description: "Consigner une consultation, demander des examens, prescrire." },
      { slug: "examens", label: "Examens en attente", description: "Examens demandés dont le résultat n'est pas rendu." },
      { slug: "patients", label: "Dossiers patients", description: "Dossiers médicaux de vos patients." },
      { slug: "teleconsultation", label: "Téléconsultation", description: "Sessions de téléconsultation." },
      { slug: "prescriptions", label: "Ordonnances", description: "Prescriptions émises." },
      { slug: "profil", label: "Mon profil", description: "Informations personnelles." },
    ]),
  },
  nurse: {
    role: "nurse",
    label: "Infirmier(ère)",
    basePath: "/dashboard/nurse",
    navItems: withBase("/dashboard/nurse", [
      { slug: "", label: "Vue d'ensemble", description: "Aperçu du service." },
      // L'accueil est le premier geste du parcours : le patient arrive, l'infirmiere
      // l'enregistre et prend ses parametres dans la meme saisie.
      { slug: "accueil", label: "Accueil", description: "Enregistrer un patient et relever ses paramètres." },
      // Le pendant de l'accueil : l'infirmiere realise les examens et saisit ce qu'ils rendent.
      { slug: "examens", label: "Examens à réaliser", description: "Examens demandés en attente de résultat." },
      { slug: "patients", label: "Patients hospitalisés", description: "Suivi des patients par chambre/lit." },
      { slug: "chambres", label: "Chambres & lits", description: "État d'occupation des chambres." },
      { slug: "dossiers", label: "Dossiers médicaux", description: "Consultation des dossiers." },
      { slug: "profil", label: "Mon profil", description: "Informations personnelles." },
    ]),
  },
  pharmacist: {
    role: "pharmacist",
    label: "Pharmacien(ne)",
    basePath: "/dashboard/pharmacist",
    navItems: withBase("/dashboard/pharmacist", [
      { slug: "", label: "Vue d'ensemble", description: "Aperçu de la pharmacie." },
      { slug: "catalogue", label: "Catalogue médicaments", description: "Médicaments référencés." },
      { slug: "prescriptions", label: "Prescriptions", description: "Ordonnances à délivrer." },
      { slug: "stock", label: "Stock", description: "Niveaux de stock et réapprovisionnement." },
      { slug: "profil", label: "Mon profil", description: "Informations personnelles." },
    ]),
  },
  secretary: {
    role: "secretary",
    label: "Accueil",
    basePath: "/dashboard/accueil",
    navItems: withBase("/dashboard/accueil", [
      { slug: "", label: "Vue d'ensemble", description: "Aperçu de l'accueil." },
      { slug: "rendez-vous", label: "Rendez-vous", description: "Planification des rendez-vous." },
      { slug: "patients", label: "Patients", description: "Enregistrement et recherche de patients." },
      { slug: "facturation", label: "Facturation", description: "Factures et paiements." },
      { slug: "chambres", label: "Chambres", description: "Disponibilité des chambres." },
      { slug: "personnel", label: "Personnel", description: "Annuaire du personnel." },
    ]),
  },
  // Les deux plateaux techniques partagent la meme forme : leur ecran de travail est la file des
  // examens de leur categorie, rien d'autre. Le detail clinique reste dans le dossier, que ces
  // roles ne lisent pas.
  labo: {
    role: "labo",
    label: "Laboratoire",
    basePath: "/dashboard/labo",
    navItems: withBase("/dashboard/labo", [
      { slug: "", label: "Vue d'ensemble", description: "Aperçu du laboratoire." },
      { slug: "examens", label: "Examens à réaliser", description: "Analyses de biologie en attente de résultat." },
      { slug: "rendez-vous", label: "Rendez-vous", description: "Prélèvements et analyses programmés." },
      { slug: "profil", label: "Mon profil", description: "Informations personnelles." },
    ]),
  },
  imagerie: {
    role: "imagerie",
    label: "Imagerie médicale",
    basePath: "/dashboard/imagerie",
    navItems: withBase("/dashboard/imagerie", [
      { slug: "", label: "Vue d'ensemble", description: "Aperçu de l'imagerie." },
      { slug: "examens", label: "Examens à réaliser", description: "Examens d'imagerie en attente de compte rendu." },
      { slug: "rendez-vous", label: "Rendez-vous", description: "Examens d'imagerie programmés." },
      { slug: "profil", label: "Mon profil", description: "Informations personnelles." },
    ]),
  },
  hr: {
    role: "hr",
    label: "Ressources Humaines",
    basePath: "/dashboard/hr",
    navItems: withBase("/dashboard/hr", [
      { slug: "", label: "Vue d'ensemble", description: "Aperçu RH." },
      { slug: "personnel", label: "Personnel", description: "Gestion du personnel." },
      { slug: "recrutement", label: "Recrutement", description: "Postes ouverts et candidatures." },
      { slug: "profil", label: "Mon profil", description: "Informations personnelles." },
    ]),
  },
  finance: {
    role: "finance",
    label: "Finance",
    basePath: "/dashboard/finance",
    navItems: withBase("/dashboard/finance", [
      { slug: "", label: "Vue d'ensemble", description: "Aperçu financier." },
      { slug: "facturation", label: "Facturation", description: "Factures émises." },
      { slug: "paiements", label: "Paiements", description: "Suivi des paiements reçus." },
      { slug: "rapports", label: "Rapports", description: "Rapports financiers." },
      { slug: "profil", label: "Mon profil", description: "Informations personnelles." },
    ]),
  },
  quality: {
    role: "quality",
    label: "Qualité",
    basePath: "/dashboard/quality",
    navItems: withBase("/dashboard/quality", [
      { slug: "", label: "Vue d'ensemble", description: "Aperçu qualité." },
      { slug: "plaintes", label: "Plaintes", description: "Plaintes des patients." },
      { slug: "incidents", label: "Incidents", description: "Signalements d'incidents." },
      { slug: "audits", label: "Audits", description: "Audits internes planifiés." },
      { slug: "profil", label: "Mon profil", description: "Informations personnelles." },
    ]),
  },
  admin: {
    role: "admin",
    label: "Administrateur",
    basePath: "/dashboard/admin",
    navItems: withBase("/dashboard/admin", [
      { slug: "", label: "Vue d'ensemble", description: "Aperçu global de la plateforme." },
      { slug: "utilisateurs", label: "Utilisateurs", description: "Comptes et rôles." },
      { slug: "rendez-vous", label: "Rendez-vous", description: "Tous les rendez-vous." },
      { slug: "facturation", label: "Facturation", description: "Facturation globale." },
      { slug: "pharmacie", label: "Pharmacie", description: "Catalogue et stock." },
      { slug: "nomenclature", label: "Nomenclature", description: "Actes d'examens et tarifs." },
      { slug: "chambres", label: "Chambres", description: "Gestion des chambres." },
      { slug: "equipements", label: "Équipements", description: "Parc d'équipements médicaux." },
      { slug: "qualite", label: "Qualité", description: "Plaintes, incidents, audits." },
      { slug: "hygiene", label: "Hygiène", description: "Protocoles et déchets biomédicaux." },
      { slug: "personnel", label: "Personnel", description: "Annuaire et gestion RH." },
      { slug: "parametres", label: "Paramètres", description: "Configuration de la plateforme." },
    ]),
  },
};

export const roleList: RoleConfig[] = Object.values(roleConfigs);
