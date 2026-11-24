import { useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  ArrowLeft, Search, LayoutDashboard, ShoppingCart, ChefHat, Package, 
  BarChart3, Truck, Users, Settings, Grid3X3, ClipboardList, ShieldCheck, 
  Bell, Wallet, Cookie, CreditCard, HelpCircle, BookOpen, 
  KeyRound, Shield, Smartphone, ChevronDown, ChevronRight, Zap, 
  Printer, FileText, TrendingUp, AlertTriangle, CheckCircle2,
  UtensilsCrossed, Monitor
} from 'lucide-react'
import logo from '@/assets/logo.png'

/* ─── Data ────────────────────────────────────────────────────────── */

const MODULES = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    title: 'Dashboard',
    color: 'from-orange-500 to-amber-500',
    roles: ['Admin', 'Caissier'],
    desc: "Vue d'ensemble en temps réel de votre activité.",
    details: [
      "Chiffre d'affaires du jour (recettes encaissées)",
      "Nombre de commandes et panier moyen",
      "Graphique des ventes horaires (8h–23h)",
      "Top 10 des meilleures ventes du jour",
      "Taux d'occupation des tables",
      "Historique des dernières opérations",
      "Rafraîchissement automatique toutes les 30 secondes"
    ]
  },
  {
    id: 'cash',
    icon: Wallet,
    title: 'Gestion de Caisse',
    color: 'from-emerald-500 to-green-500',
    roles: ['Admin', 'Manager', 'Caissier'],
    desc: "Ouverture, fermeture et suivi des sessions de caisse.",
    details: [
      "Ouverture de session avec fond de caisse initial",
      "Suivi du chiffre d'affaires en cours de session",
      "Détail des paiements par méthode (Espèces, CB, Mobile Money)",
      "Fermeture de session avec comptage réel",
      "Historique complet de toutes les sessions passées",
      "Calcul automatique de l'écart (surplus/déficit)"
    ]
  },
  {
    id: 'pos',
    icon: ShoppingCart,
    title: 'Point de Vente (POS)',
    color: 'from-blue-500 to-indigo-500',
    roles: ['Admin', 'Manager', 'Caissier'],
    desc: "Interface de prise de commande et encaissement.",
    details: [
      "Catalogue produits organisé par catégories",
      "Ajout rapide au panier (clic ou recherche)",
      "Modification des quantités et suppression d'articles",
      "Application de remises (% ou montant fixe)",
      "Choix du type de commande : Sur place, Emporter, Livraison",
      "Sélection de la table pour les commandes sur place",
      "Encaissement multi-méthodes (Espèces + CB, etc.)",
      "Impression automatique des tickets (client + cuisine)",
      "Identification optionnelle du client (nom, téléphone)"
    ]
  },
  {
    id: 'orders',
    icon: ClipboardList,
    title: 'Commandes',
    color: 'from-violet-500 to-purple-500',
    roles: ['Admin', 'Manager', 'Caissier'],
    desc: "Suivi et historique de toutes les commandes.",
    details: [
      "Liste de toutes les commandes du jour",
      "Filtrage par statut : En cours, Payée, Annulée",
      "Détail complet de chaque commande (articles, prix, client)",
      "Types affichés : Vente directe, Livraison, Vente directe (Gozem)",
      "Réimpression de ticket ou facture",
      "Nom du client affiché s'il a été renseigné"
    ]
  },
  {
    id: 'tables',
    icon: Grid3X3,
    title: 'Plan de Salle',
    color: 'from-cyan-500 to-teal-500',
    roles: ['Admin', 'Caissier'],
    desc: "Visualisation et gestion des tables en temps réel.",
    details: [
      "Vue graphique de toutes les tables par étage/salle",
      "Couleurs par statut : Libre (vert), Occupée (rouge), Réservée (jaune)",
      "Clic sur une table pour ouvrir/voir la commande associée",
      "Nombre de couverts par table",
      "Libération de table après paiement"
    ]
  },
  {
    id: 'kitchen',
    icon: ChefHat,
    title: 'Cuisine (KDS)',
    color: 'from-orange-500 to-red-500',
    roles: ['Admin'],
    desc: "Écran de production pour la cuisine, le bar et la pizzeria.",
    details: [
      "Affichage plein écran des commandes en attente",
      "Tickets organisés par ordre d'arrivée",
      "Marquage des articles comme « En préparation » puis « Prêt »",
      "Filtrage par destination : Cuisine, Bar, Pizza",
      "Impression automatique vers l'imprimante dédiée (si configuré)",
      "Notifications sonores pour les nouvelles commandes",
      "Timer par commande pour le suivi du temps de préparation"
    ]
  },
  {
    id: 'deliveries',
    icon: Truck,
    title: 'Livraisons',
    color: 'from-lime-500 to-emerald-500',
    roles: ['Admin', 'Caissier'],
    desc: "Gestion complète des livraisons et livreurs.",
    details: [
      "Liste des livraisons en cours et terminées",
      "Assignation d'un livreur à une commande",
      "Suivi du statut : En attente → En cours → Livrée",
      "Coordonnées du client (nom, téléphone, adresse)",
      "Historique des livraisons avec filtre par date"
    ]
  },
  {
    id: 'stock',
    icon: Package,
    title: 'Gestion de Stock',
    color: 'from-amber-500 to-yellow-500',
    roles: ['Admin'],
    desc: "Suivi des inventaires et mouvements de stock.",
    details: [
      "Inventaire complet de tous les produits/ingrédients",
      "Alertes de stock bas (seuil configurable)",
      "Historique des mouvements (entrées/sorties)",
      "Ajustement manuel des quantités avec justification",
      "Association produit ↔ ingrédients pour décompte automatique"
    ]
  },
  {
    id: 'products',
    icon: UtensilsCrossed,
    title: 'Produits & Catégories',
    color: 'from-pink-500 to-rose-500',
    roles: ['Admin', 'Manager'],
    desc: "Gestion du catalogue produits et des catégories.",
    details: [
      "Ajout, modification et suppression de produits",
      "Prix, image, catégorie et destination (Cuisine/Bar/Pizza)",
      "Gestion des catégories avec couleur et icône",
      "Activation/désactivation d'un produit (sans suppression)",
      "Ordre d'affichage personnalisable"
    ]
  },
  {
    id: 'cakes',
    icon: Cookie,
    title: 'Commandes Gâteaux',
    color: 'from-fuchsia-500 to-pink-500',
    roles: ['Admin', 'Caissier'],
    desc: "Gestion des commandes spéciales de pâtisserie.",
    details: [
      "Création de commandes de gâteaux personnalisés",
      "Suivi du statut : En attente → En production → Prête → Livrée",
      "Enregistrement des acomptes et paiements partiels",
      "Date et heure de livraison prévue",
      "Informations client (nom, téléphone)",
      "Notes et spécifications du gâteau"
    ]
  },
  {
    id: 'tabs',
    icon: CreditCard,
    title: 'Ardoises (Crédit)',
    color: 'from-indigo-500 to-blue-500',
    roles: ['Admin', 'Manager', 'Caissier'],
    desc: "Système de crédit pour les clients réguliers.",
    details: [
      "Création d'ardoises pour les clients de confiance",
      "Ajout de commandes à l'ardoise (paiement différé)",
      "Suivi du solde dû par client",
      "Enregistrement des paiements partiels ou totaux",
      "Historique complet des transactions par ardoise"
    ]
  },
  {
    id: 'reports',
    icon: BarChart3,
    title: 'Rapports & Analyses',
    color: 'from-sky-500 to-blue-500',
    roles: ['Admin', 'Manager'],
    desc: "Rapports financiers et analyses de performance.",
    details: [
      "Rapport de ventes par période (jour, semaine, mois)",
      "Analyse par serveur/caissier",
      "Répartition par catégorie et destination",
      "Top produits les plus vendus",
      "Journal de production par département",
      "Export PDF des rapports administratifs",
      "Export Excel multi-feuilles (résumé, analyse, logs)",
      "Purge sécurisée des anciennes données"
    ]
  },
  {
    id: 'users',
    icon: Users,
    title: 'Utilisateurs',
    color: 'from-teal-500 to-cyan-500',
    roles: ['Admin', 'Manager'],
    desc: "Gestion des comptes et des droits d'accès.",
    details: [
      "Création et modification des comptes utilisateurs",
      "Attribution des rôles : Admin, Caissier",
      "Connexion par Email + Mot de passe OU par code PIN (4 chiffres)",
      "Activation/désactivation de comptes",
      "Chaque rôle ne voit que les modules autorisés"
    ]
  },
  {
    id: 'cancellations',
    icon: AlertTriangle,
    title: 'Annulations',
    color: 'from-red-500 to-orange-500',
    roles: ['Admin', 'Manager'],
    desc: "Suivi de toutes les annulations de commandes.",
    details: [
      "Liste des commandes annulées avec motif",
      "Nom de l'utilisateur ayant effectué l'annulation",
      "Montant et détail des articles annulés",
      "Filtrage par date pour audit"
    ]
  },
  {
    id: 'audit',
    icon: ShieldCheck,
    title: 'Journal d\'Audit',
    color: 'from-slate-500 to-gray-500',
    roles: ['Admin', 'Manager'],
    desc: "Traçabilité complète de toutes les actions.",
    details: [
      "Log de toutes les opérations effectuées",
      "Qui a fait quoi et quand",
      "Actions sensibles : suppressions, modifications de prix, annulations",
      "Filtrage par utilisateur, type d'action et date"
    ]
  },
  {
    id: 'settings',
    icon: Settings,
    title: 'Paramètres',
    color: 'from-gray-500 to-zinc-500',
    roles: ['Admin'],
    desc: "Configuration générale du système.",
    details: [
      "Informations du restaurant (nom, adresse, téléphone)",
      "Configuration des imprimantes réseau (Cuisine, Bar, Pizza)",
      "Paramètres de TVA et devise",
      "Personnalisation du ticket de caisse",
      "Configuration de l'impression automatique par destination"
    ]
  },
]

const ROLES_INFO = [
  { role: 'Admin', icon: Shield, color: 'text-red-400', desc: 'Accès complet à tous les modules. Gestion des paramètres, utilisateurs, rapports, stock, produits, cuisine et configuration système.' },
  { role: 'Caissier', icon: Wallet, color: 'text-blue-400', desc: 'Prise de commande, encaissement, gestion de caisse, commandes, livraisons, ardoises, gâteaux et plan de salle.' },
]

const FAQ = [
  { q: "Comment ouvrir une session de caisse ?", a: "Allez sur « Caisse » dans le menu latéral, cliquez « Ouvrir une session » et entrez le montant de votre fond de caisse. Vous pourrez commencer à encaisser immédiatement." },
  { q: "Comment prendre une commande rapidement ?", a: "Depuis le module POS, sélectionnez la catégorie puis cliquez sur les produits. Ajustez les quantités dans le panier à droite, puis cliquez « Encaisser » pour finaliser." },
  { q: "Comment se connecter avec un code PIN ?", a: "Sur la page de connexion, basculez sur l'onglet « PIN ». Entrez votre code à 4 chiffres sur le pavé numérique. Le PIN est attribué par l'administrateur." },
  { q: "Comment appliquer une remise sur une commande ?", a: "Dans le POS, après avoir ajouté les articles, cliquez sur le bouton remise. Vous pouvez choisir un pourcentage ou un montant fixe." },
  { q: "Comment imprimer les tickets automatiquement en cuisine ?", a: "L'administrateur doit configurer les imprimantes dans « Paramètres ». Chaque imprimante est associée à une destination (Cuisine, Bar, Pizza). Les tickets s'impriment automatiquement." },
  { q: "Comment voir les ventes d'un jour précis ?", a: "Allez dans « Rapports », sélectionnez la date souhaitée. Vous verrez le résumé des ventes, les paiements par méthode, et vous pourrez exporter en PDF ou Excel." },
  { q: "Que faire si je ne vois pas certains modules ?", a: "Chaque rôle a un accès restreint. Contactez votre administrateur si vous avez besoin d'accéder à un module supplémentaire." },
  { q: "Comment créer une ardoise client ?", a: "Dans le module « Ardoises », cliquez « Nouvelle ardoise », renseignez le nom du client. Vous pourrez ensuite y ajouter des commandes non payées." },
  { q: "Comment gérer les commandes de gâteaux ?", a: "Le module « Gâteaux » permet de créer des commandes personnalisées avec date de livraison, acomptes et notes spécifiques." },
  { q: "Mon écran cuisine ne reçoit pas les commandes ?", a: "Vérifiez que vous êtes connecté avec un compte « Admin ». L'écran cuisine se rafraîchit automatiquement. Vérifiez aussi votre connexion réseau." },
]

/* ─── Components ──────────────────────────────────────────────────── */

function ModuleCard({ mod, isOpen, onToggle }) {
  const Icon = mod.icon
  return (
    <div className="group">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all text-left"
      >
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.color} flex items-center justify-center shadow-lg shrink-0`}>
          <Icon size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-black text-foreground italic tracking-tight">{mod.title}</h3>
          <p className="text-[10px] text-muted-foreground font-bold mt-0.5 truncate">{mod.desc}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-1">
            {mod.roles.map(r => (
              <span key={r} className="text-[8px] font-black uppercase tracking-wider bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">{r}</span>
            ))}
          </div>
          {isOpen ? <ChevronDown size={16} className="text-primary" /> : <ChevronRight size={16} className="text-muted-foreground" />}
        </div>
      </button>
      {isOpen && (
        <div className="mt-1 ml-4 mr-2 p-4 bg-muted/50 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex flex-wrap gap-1 mb-3 sm:hidden">
            {mod.roles.map(r => (
              <span key={r} className="text-[8px] font-black uppercase tracking-wider bg-card text-muted-foreground px-1.5 py-0.5 rounded-md border border-border">{r}</span>
            ))}
          </div>
          <ul className="space-y-2">
            {mod.details.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-foreground/80">
                <CheckCircle2 size={14} className="text-primary shrink-0 mt-0.5" />
                <span className="font-medium">{d}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <button
      onClick={onToggle}
      className="w-full text-left p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all"
    >
      <div className="flex items-start gap-3">
        <HelpCircle size={18} className={`shrink-0 mt-0.5 transition-colors ${isOpen ? 'text-primary' : 'text-muted-foreground'}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground">{item.q}</p>
          {isOpen && (
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed animate-in fade-in slide-in-from-top-1 duration-200">{item.a}</p>
          )}
        </div>
        {isOpen ? <ChevronDown size={14} className="text-primary shrink-0 mt-1" /> : <ChevronRight size={14} className="text-muted-foreground shrink-0 mt-1" />}
      </div>
    </button>
  )
}

/* ─── Main Page ───────────────────────────────────────────────────── */

export default function HelpPage() {
  const [search, setSearch] = useState('')
  const [openModule, setOpenModule] = useState(null)
  const [openFaq, setOpenFaq] = useState(null)
  const [activeSection, setActiveSection] = useState('modules') // 'modules' | 'roles' | 'faq' | 'connexion'

  const filtered = search.trim()
    ? MODULES.filter(m =>
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        m.desc.toLowerCase().includes(search.toLowerCase()) ||
        m.details.some(d => d.toLowerCase().includes(search.toLowerCase()))
      )
    : MODULES

  const filteredFaq = search.trim()
    ? FAQ.filter(f =>
        f.q.toLowerCase().includes(search.toLowerCase()) ||
        f.a.toLowerCase().includes(search.toLowerCase())
      )
    : FAQ

  const SECTIONS = [
    { id: 'modules', label: 'Modules', icon: Monitor },
    { id: 'roles', label: 'Rôles', icon: Shield },
    { id: 'connexion', label: 'Connexion', icon: KeyRound },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* ── Hero Header ── */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/8 blur-[120px] rounded-full -mr-48 -mt-48 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/8 blur-[120px] rounded-full -ml-32 -mb-32 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto px-6 py-10 relative z-10">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-xs font-black text-primary uppercase tracking-widest mb-8 hover:gap-3 transition-all group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Retour à la connexion
          </Link>

          <div className="flex items-center gap-5 mb-4">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 overflow-hidden p-2.5 -rotate-6">
              <img src={logo} alt="Logo" className="w-full h-full object-contain invert grayscale brightness-[5] dark:invert-0 dark:brightness-100" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-foreground tracking-tighter uppercase italic">Guide d'utilisation</h1>
              <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-widest">SmartFlow POS — Documentation complète</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative mt-8 max-w-lg">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher dans la documentation..."
              className="w-full h-12 bg-card border border-border rounded-2xl pl-12 pr-4 text-sm font-bold text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-3">
            {SECTIONS.map((s) => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  onClick={() => { setActiveSection(s.id); setSearch('') }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all ${
                    activeSection === s.id
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon size={14} />
                  {s.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-4xl mx-auto px-6 py-8">

        {/* ── Modules Section ── */}
        {activeSection === 'modules' && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-foreground italic tracking-tight">Tous les modules</h2>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{filtered.length} modules</span>
            </div>
            {filtered.map((mod) => (
              <ModuleCard
                key={mod.id}
                mod={mod}
                isOpen={openModule === mod.id}
                onToggle={() => setOpenModule(openModule === mod.id ? null : mod.id)}
              />
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-16">
                <Search size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm font-bold text-muted-foreground">Aucun module trouvé pour « {search} »</p>
              </div>
            )}
          </div>
        )}

        {/* ── Roles Section ── */}
        {activeSection === 'roles' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="mb-6">
              <h2 className="text-lg font-black text-foreground italic tracking-tight">Rôles & Permissions</h2>
              <p className="text-xs text-muted-foreground font-medium mt-1">Chaque utilisateur a un rôle qui détermine ses accès.</p>
            </div>
            {ROLES_INFO.map(({ role, icon: Icon, color, desc }) => (
              <div key={role} className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border">
                <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Icon size={20} className={color} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground italic">{role}</h3>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}

            {/* Tableau récapitulatif */}
            <div className="mt-8 p-5 rounded-2xl bg-card border border-border overflow-hidden">
              <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-4">Matrice d'accès rapide</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4 font-black text-muted-foreground uppercase tracking-widest">Module</th>
                      {['Admin', 'Caissier'].map(r => (
                        <th key={r} className="text-center py-2 px-2 font-black text-muted-foreground uppercase tracking-wider">{r}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {MODULES.map((mod) => (
                      <tr key={mod.id} className="border-b border-border/50 last:border-0">
                        <td className="py-2.5 pr-4 font-bold text-foreground whitespace-nowrap">{mod.title}</td>
                        {['Admin', 'Caissier'].map(r => (
                          <td key={r} className="text-center py-2.5 px-2">
                            {mod.roles.includes(r)
                              ? <CheckCircle2 size={14} className="text-emerald-500 mx-auto" />
                              : <span className="text-muted-foreground/20">—</span>
                            }
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Connexion Section ── */}
        {activeSection === 'connexion' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="mb-6">
              <h2 className="text-lg font-black text-foreground italic tracking-tight">Méthodes de connexion</h2>
              <p className="text-xs text-muted-foreground font-medium mt-1">Deux méthodes sont disponibles pour vous authentifier.</p>
            </div>

            {/* Méthode Email */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                  <FileText size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground italic">Connexion par Email</h3>
                  <p className="text-[10px] text-muted-foreground font-bold">Pour les administrateurs et caissiers</p>
                </div>
              </div>
              <ol className="space-y-3 ml-1">
                {[
                  "Sélectionnez l'onglet « Email » (activé par défaut)",
                  "Entrez votre adresse email professionnelle",
                  "Entrez votre mot de passe",
                  "Cliquez sur « Authentification »",
                  "Vous serez redirigé vers le Dashboard"
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-foreground/80">
                    <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                    <span className="font-medium pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Méthode PIN */}
            <div className="p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg">
                  <KeyRound size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-foreground italic">Connexion par code PIN</h3>
                  <p className="text-[10px] text-muted-foreground font-bold">Accès rapide pour les caissiers</p>
                </div>
              </div>
              <ol className="space-y-3 ml-1">
                {[
                  "Sélectionnez l'onglet « PIN »",
                  "Entrez votre code à 4 chiffres sur le pavé numérique",
                  "Les points se remplissent au fur et à mesure",
                  "Cliquez « Authentification » ou attendez la saisie complète",
                  "Utilisez « C » pour tout effacer ou « ⌫ » pour corriger"
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-foreground/80">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-black shrink-0">{i + 1}</span>
                    <span className="font-medium pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Note importante */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
              <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-500">Important</p>
                <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                  Votre code PIN ou mot de passe est personnel et confidentiel. Ne le partagez avec personne.
                  En cas d'oubli, contactez votre administrateur pour le réinitialiser.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── FAQ Section ── */}
        {activeSection === 'faq' && (
          <div className="space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-foreground italic tracking-tight">Questions fréquentes</h2>
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{filteredFaq.length} questions</span>
            </div>
            {filteredFaq.map((item, i) => (
              <FaqItem
                key={i}
                item={item}
                isOpen={openFaq === i}
                onToggle={() => setOpenFaq(openFaq === i ? null : i)}
              />
            ))}
            {filteredFaq.length === 0 && (
              <div className="text-center py-16">
                <HelpCircle size={48} className="text-muted-foreground/20 mx-auto mb-4" />
                <p className="text-sm font-bold text-muted-foreground">Aucune question trouvée pour « {search} »</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-border mt-8">
        <div className="max-w-4xl mx-auto px-6 py-8 text-center space-y-2">
          <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} SmartFlow POS — Version 2.1
          </p>
          <p className="text-[10px] text-muted-foreground/30">
            Pour toute assistance technique, contactez votre administrateur système.
          </p>
        </div>
      </div>
    </div>
  )
}
