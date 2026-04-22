import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import './Faq.css'

interface FaqItem {
  question: string
  answer: string
}

interface FaqCategory {
  id: string
  label: string
  icon: string
  items: FaqItem[]
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    id: 'generale',
    label: 'Generale',
    icon: '💡',
    items: [
      {
        question: 'Cos\'è arCO₂?',
        answer: 'arCO₂ è la piattaforma digitale di TicinoEnergia che accompagna i proprietari di immobili nel percorso di efficientamento energetico. Dal questionario iniziale fino alla realizzazione degli interventi, arCO₂ offre orientamento personalizzato, accesso agli incentivi e un consulente dedicato.',
      },
      {
        question: 'arCO₂ è gratuito?',
        answer: 'Il questionario, la creazione dell\'account e la consulenza iniziale sono completamente gratuiti. Alcuni servizi avanzati — come la redazione del dossier tecnico completo o l\'accompagnamento nelle pratiche burocratiche — possono prevedere costi specifici che vengono comunicati in modo trasparente prima di qualsiasi impegno.',
      },
      {
        question: 'Chi c\'è dietro arCO₂?',
        answer: 'arCO₂ è un\'iniziativa di TicinoEnergia, l\'agenzia cantonale per l\'energia sostenibile del Cantone Ticino. Opera in collaborazione con il Canton Ticino, la Confederazione Svizzera e i principali enti di promozione dell\'efficienza energetica.',
      },
      {
        question: 'I miei dati sono al sicuro?',
        answer: 'Sì. Tutti i dati sono trattati in conformità alla Legge federale sulla protezione dei dati (LPD) svizzera. Le informazioni personali non vengono mai cedute a terzi senza il tuo consenso esplicito e sono conservate su server situati in Svizzera.',
      },
    ],
  },
  {
    id: 'questionario',
    label: 'Questionario',
    icon: '📋',
    items: [
      {
        question: 'Quanto tempo richiede il questionario?',
        answer: 'Il questionario si completa in circa 5 minuti. Sono solo 6 domande essenziali sul tuo edificio: tipologia, anno di costruzione, superficie, sistema di riscaldamento, classe energetica e obiettivi. Puoi farlo da qualsiasi dispositivo, senza dover cercare documenti.',
      },
      {
        question: 'Devo conoscere la classe energetica del mio edificio?',
        answer: 'No, non è obbligatorio. Puoi selezionare "Non lo so" e procedere ugualmente. Il sistema elaborerà le sue stime basandosi sugli altri dati forniti. Se disponi del certificato CECE, inserire la classe energetica permette di ottenere risultati più precisi.',
      },
      {
        question: 'Posso compilare il questionario per un edificio che non è di mia proprietà?',
        answer: 'Sì, il questionario può essere compilato anche per edifici di cui non sei proprietario — ad esempio per valutare un immobile che stai considerando di acquistare o per conto di un familiare. I risultati hanno sempre carattere orientativo e non vincolante.',
      },
      {
        question: 'I risultati del questionario sono definitivi?',
        answer: 'I risultati del questionario sono un\'analisi orientativa basata sui dati inseriti. Rappresentano un ottimo punto di partenza, ma vengono approfonditi e personalizzati dal consulente arCO₂ durante la fase di consulenza, che tiene conto delle specificità del tuo edificio e della tua situazione.',
      },
    ],
  },
  {
    id: 'incentivi',
    label: 'Incentivi',
    icon: '💶',
    items: [
      {
        question: 'A quali incentivi ho diritto?',
        answer: 'In Ticino sono disponibili contributi cantonali per isolamento termico, sostituzione del riscaldamento e impianti fotovoltaici, oltre agli incentivi federali del Programma Edifici. Gli importi variano in base all\'intervento, alla superficie e alla classe energetica di partenza. Il tuo consulente arCO₂ ti fornirà un quadro preciso degli incentivi cumulabili per il tuo caso specifico.',
      },
      {
        question: 'Gli incentivi si possono cumulare?',
        answer: 'Sì, in molti casi gli incentivi cantonali e federali sono cumulabili tra loro. Ad esempio, per la sostituzione di una caldaia a gas con una pompa di calore è possibile accedere contemporaneamente al contributo cantonale e al contributo federale del Programma Edifici, fino a coprire il 30–40% del costo dell\'intervento.',
      },
      {
        question: 'Come si fa domanda per gli incentivi?',
        answer: 'Il consulente arCO₂ ti guida passo dopo passo nella preparazione della documentazione e nella presentazione della domanda. Alcune sovvenzioni richiedono l\'approvazione preventiva prima dell\'avvio dei lavori — è quindi importante non iniziare gli interventi prima di aver verificato i requisiti.',
      },
      {
        question: 'Esiste un limite massimo di incentivo?',
        answer: 'Sì, ogni misura ha un massimale specifico. A titolo indicativo: per l\'isolamento dell\'involucro fino a CHF 25\'000, per la sostituzione del riscaldamento fino a CHF 15\'000, per il fotovoltaico fino a CHF 8\'000. Questi valori cambiano periodicamente — il consulente ti fornirà i massimali aggiornati al momento della tua richiesta.',
      },
    ],
  },
  {
    id: 'percorsi',
    label: 'Percorsi e interventi',
    icon: '🏗️',
    items: [
      {
        question: 'Da dove conviene iniziare?',
        answer: 'In generale, il percorso più efficace parte dall\'isolamento dell\'involucro (tetto, pareti, solaio), segue con la sostituzione del riscaldamento e si completa con fotovoltaico e VMC. Tuttavia, ogni edificio è diverso: il consulente arCO₂ definirà con te la sequenza ottimale in base al rapporto costo/beneficio e alla tua disponibilità economica.',
      },
      {
        question: 'Quanto tempo richiedono i lavori?',
        answer: 'I tempi variano in base all\'intervento. Una sostituzione del riscaldamento richiede tipicamente 1–2 settimane, l\'installazione di un impianto fotovoltaico 1–3 settimane, mentre un risanamento completo dell\'involucro può richiedere dai 2 agli 8 mesi, a seconda della complessità dell\'edificio.',
      },
      {
        question: 'Devo fare tutti i percorsi contemporaneamente?',
        answer: 'No. Gli interventi si possono pianificare in fasi, distribuendo i costi nel tempo e massimizzando gli incentivi disponibili per ogni fase. Il consulente arCO₂ ti aiuta a costruire una roadmap realistica, adatta al tuo budget e alle tue priorità.',
      },
      {
        question: 'Gli interventi aumentano il valore dell\'immobile?',
        answer: 'Sì. Secondo le analisi del mercato immobiliare svizzero, gli edifici con certificazione energetica elevata (classi A o B) possono valere dal 5% al 15% in più rispetto a edifici simili non risanati. Il miglioramento della classe energetica è un fattore sempre più rilevante nelle valutazioni immobiliari.',
      },
    ],
  },
  {
    id: 'consulente',
    label: 'Il consulente',
    icon: '🤝',
    items: [
      {
        question: 'Chi è il consulente arCO₂?',
        answer: 'Il consulente arCO₂ è un professionista certificato con competenze in efficienza energetica, normativa ticinese e federale, e accesso agli incentivi disponibili. Viene assegnato in base alla tipologia del tuo edificio e alla tua zona di residenza.',
      },
      {
        question: 'Come mi contatta il consulente?',
        answer: 'Dopo la registrazione e la visualizzazione dei tuoi risultati, il consulente ti contatta entro 48–72 ore lavorative via email o telefono per fissare un primo colloquio. Il colloquio può avvenire in presenza o da remoto, a tua scelta.',
      },
      {
        question: 'La consulenza iniziale è a pagamento?',
        answer: 'No. Il primo colloquio con il consulente arCO₂ è gratuito e senza impegno. È un\'occasione per approfondire i risultati del tuo questionario, fare domande e capire quali percorsi sono più adatti alla tua situazione specifica.',
      },
      {
        question: 'Il consulente mi aiuta anche con le pratiche burocratiche?',
        answer: 'Sì. Il consulente ti supporta nella raccolta della documentazione, nella preparazione delle domande di incentivo e nel coordinamento con professionisti e artigiani. L\'obiettivo è rendere il percorso il più semplice possibile, dalla decisione fino alla chiusura del cantiere.',
      },
    ],
  },
]

function AccordionItem({ item, isOpen, onToggle }: {
  item: FaqItem
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className={`faq-item ${isOpen ? 'faq-item-open' : ''}`}>
      <button className="faq-question" onClick={onToggle} aria-expanded={isOpen}>
        <span>{item.question}</span>
        <span className="faq-chevron">{isOpen ? '−' : '+'}</span>
      </button>
      {isOpen && (
        <div className="faq-answer">
          <p>{item.answer}</p>
        </div>
      )}
    </div>
  )
}

export default function Faq() {
  const navigate = useNavigate()
  const { token } = useAuth()
  const [activeCategory, setActiveCategory] = useState('generale')
  const [openItem, setOpenItem] = useState<string | null>(null)

  const currentCategory = FAQ_CATEGORIES.find((c) => c.id === activeCategory)!

  function toggleItem(key: string) {
    setOpenItem((prev) => (prev === key ? null : key))
  }

  return (
    <div className="faq-page">
      {/* ─── Nav ──────────────────────────────────────────────────────────── */}
      <header className="faq-nav">
        <div className="nav-container">
          <button className="nav-logo" onClick={() => navigate('/')} style={{ background: 'none', border: 'none' }}>
            <span className="logo-mark">arCO</span>
            <span className="logo-sub">₂</span>
          </button>
          <nav className="nav-links">
            <button className="nav-link-btn" onClick={() => navigate('/')}>Home</button>
            <button className="nav-link-btn" onClick={() => navigate('/percorsi')}>Percorsi</button>
            <span className="nav-link-active">FAQ</span>
          </nav>
          <div className="nav-cta">
            {token ? (
              <button className="btn btn-primary btn-sm" onClick={() => navigate('/dashboard')}>
                Vai alla dashboard →
              </button>
            ) : (
              <>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/accedi')}>Accedi</button>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/questionario')}>Inizia ora</button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero ─────────────────────────────────────────────────────────── */}
      <section className="faq-hero">
        <div className="faq-hero-inner">
          <div className="faq-hero-badge">Domande frequenti</div>
          <h1 className="faq-hero-title">Hai domande?<br /><span className="faq-hero-accent">Abbiamo le risposte.</span></h1>
          <p className="faq-hero-sub">
            Tutto quello che devi sapere su arCO₂, i percorsi di efficientamento, gli incentivi disponibili in Ticino e come funziona la consulenza.
          </p>
        </div>
      </section>

      {/* ─── FAQ body ─────────────────────────────────────────────────────── */}
      <section className="faq-body">
        <div className="faq-body-inner">

          {/* Category tabs */}
          <div className="faq-tabs">
            {FAQ_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`faq-tab ${activeCategory === cat.id ? 'faq-tab-active' : ''}`}
                onClick={() => { setActiveCategory(cat.id); setOpenItem(null) }}
              >
                <span className="faq-tab-icon">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div className="faq-accordion">
            <div className="faq-category-header">
              <span className="faq-category-icon">{currentCategory.icon}</span>
              <h2>{currentCategory.label}</h2>
              <span className="faq-count">{currentCategory.items.length} domande</span>
            </div>

            <div className="faq-items">
              {currentCategory.items.map((item, i) => {
                const key = `${activeCategory}-${i}`
                return (
                  <AccordionItem
                    key={key}
                    item={item}
                    isOpen={openItem === key}
                    onToggle={() => toggleItem(key)}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA section ─────────────────────────────────────────────────── */}
      <section className="faq-cta">
        <div className="faq-cta-inner">
          <div className="faq-cta-card">
            <div className="faq-cta-icon">💬</div>
            <h3>Non hai trovato risposta?</h3>
            <p>Il tuo consulente arCO₂ è a disposizione per rispondere a qualsiasi domanda specifica sul tuo edificio e sulla tua situazione.</p>
            <button className="btn btn-primary" onClick={() => navigate('/questionario')}>
              Inizia il questionario gratuito →
            </button>
          </div>
          <div className="faq-cta-card">
            <div className="faq-cta-icon">📞</div>
            <h3>Preferisci parlarci?</h3>
            <p>Puoi contattare TicinoEnergia direttamente. Il nostro team è disponibile dal lunedì al venerdì, dalle 08:00 alle 17:00.</p>
            <a className="btn btn-ghost faq-contact-btn" href="mailto:info@ticinoenergia.ch">
              info@ticinoenergia.ch
            </a>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────── */}
      <footer className="faq-footer">
        <div className="faq-footer-inner">
          <div className="footer-logo">
            <span className="logo-mark">arCO</span>
            <span className="logo-sub">₂</span>
            <span className="footer-logo-by">by TicinoEnergia</span>
          </div>
          <p className="footer-copy">© 2026 TicinoEnergia. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  )
}
