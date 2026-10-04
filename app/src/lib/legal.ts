import type { Locale } from '~/paraglide/runtime'

type LegalSection = { id: string; title: string; paragraphs: string[]; contact?: boolean }
type LegalDocument = { intro: string; sections: LegalSection[] }
type LegalCopy = { privacy: LegalDocument; terms: LegalDocument }

export const LEGAL_UPDATED = '2026-10-04'

export const LEGAL_OPERATOR = {
  name: 'Olena Holub',
  email: 'intentplex@gmail.com',
  phone: '+353 830091396',
  phoneHref: 'tel:+353830091396',
  address: '2 Hume Street, Dublin 2, Ireland',
}

const operator: Record<Locale, LegalSection> = {
  en: {
    id: 'operator',
    title: 'Operator and contact',
    contact: true,
    paragraphs: [
      'SkatGo is operated by Olena Holub, an individual operating from Ireland. She is responsible for the service, its commercial operation and the processing of personal data described here.',
      'References to "we", "us" and the "SkatGo team" mean this operator and the people authorised to work on the service. SkatGo is the product name; it is not a claim that a company has been incorporated.',
      'Contact the operator using the details below, including for questions about the service or requests concerning your account, tournament records or other personal data.',
    ],
  },
  de: {
    id: 'operator',
    title: 'Anbieter und Kontakt (Impressum)',
    contact: true,
    paragraphs: [
      'SkatGo wird von Olena Holub als Einzelperson von Irland aus betrieben. Sie ist für den Dienst, seinen kommerziellen Betrieb und die hier beschriebene Verarbeitung personenbezogener Daten verantwortlich.',
      'Mit "wir", "uns" und dem "SkatGo-Team" sind diese Betreiberin und die zur Mitarbeit am Dienst befugten Personen gemeint. SkatGo ist der Produktname; damit wird nicht behauptet, dass eine Gesellschaft gegründet wurde.',
      'Über die folgenden Kontaktdaten erreichst du die Betreiberin auch bei Fragen zum Dienst oder Anfragen zu deinem Konto, Turnierdaten und anderen personenbezogenen Daten.',
    ],
  },
}

export const LEGAL: Record<Locale, LegalCopy> = {
  en: {
    privacy: {
      intro: 'SkatGo uses data to run its Skat course, games, optional accounts and assistant, and to understand how the site is used.',
      sections: [
        operator.en,
        {
          id: 'accounts',
          title: 'Accounts and Google sign-in',
          paragraphs: [
            'You can use the course and assistant without an account. If you choose to register, Clerk manages your account, email address and login session.',
            'If you choose Google sign-in, Google supplies Clerk with your account identifier, email address and basic profile, such as your name and profile picture. SkatGo uses these details for authentication and account display. It does not request access to Gmail, Drive, Calendar or your Google password.',
            'Your Clerk account identifier can identify your daily tournament entry and count assistant requests for rate limits. Google login details are not included in the assistant prompts or deliberately sent to product analytics.',
          ],
        },
        {
          id: 'device',
          title: 'Data on your device',
          paragraphs: [
            'Lesson progress, stars, game totals and card-colour preferences are saved in this browser. They are not synchronized to your account. A language cookie remembers a language you select.',
            'The assistant keeps recent messages in the current tab so you can move between pages. Starting a new conversation clears this history. Closing the tab ends its session storage; clearing site data also removes local progress and preferences.',
            'Clerk uses cookies and similar storage for authentication and security. Starting the daily tournament as a guest sets a secure device cookie, lasting up to 400 days, to recognize your entry. The tournament service receives a hash of that identifier, not the cookie value.',
          ],
        },
        {
          id: 'games',
          title: 'Games and public results',
          paragraphs: [
            'The daily tournament stores a player identifier, moves, results, scores and timestamps on the server. If you submit a nickname, it appears with your score and rank on the public leaderboard. Do not use a nickname that reveals information you do not want to publish.',
            'Signing in can attach today\'s guest entry on this device to your account. Daily records do not automatically disappear at midnight. Free-play state is instead held in a temporary encrypted game token on the page; reloading starts a new game.',
          ],
        },
        {
          id: 'assistant',
          title: 'Questions sent to the assistant',
          paragraphs: [
            'When you send a question, SkatGo sends recent conversation messages, the language and the current lesson or visible game context to Microsoft Azure OpenAI to generate an answer. Your Google profile is not part of that request.',
            'The application does not write questions or answers to its server database or conversation logs. Microsoft processes the request under its service terms, including applicable safety and abuse monitoring. Do not send passwords, payment details or other sensitive information.',
          ],
        },
        {
          id: 'analytics',
          title: 'Usage measurement',
          paragraphs: [
            'On the published site, PostHog Cloud EU receives page views and interaction events, such as course and game actions. It uses a browser identifier stored in local storage. A persistent identifier can distinguish visits even without a name or email address.',
            'The integration does not call PostHog account identification. Session recording and surveys are disabled. This is usage measurement, not a recording of your screen. The current integration starts automatically when you visit; it does not present an analytics consent choice.',
          ],
        },
        {
          id: 'providers',
          title: 'Service providers and technical data',
          paragraphs: [
            'Render hosts the site and tournament database. Clerk provides authentication, Google provides Google sign-in and externally loaded fonts, Microsoft provides the AI assistant, and PostHog provides usage measurement.',
            'Requests to the site and these services transmit technical information such as IP address, browser information and the requested resource. SkatGo also uses an IP address or account identifier to limit abusive requests. Providers can process data outside your country under their own applicable terms and safeguards.',
            'Data is shared for these functions, not to sell your Google profile or use Google login data for advertising or AI training. Provider security, log retention and international processing are not controlled solely by this application.',
          ],
        },
        {
          id: 'choices',
          title: 'Your choices and data requests',
          paragraphs: [
            'You can remain signed out, stop using the assistant, clear browser site data, and manage your Google connection in your Google Account. Revoking Google access does not itself delete data already held by Clerk or SkatGo.',
            'Applicable privacy law may give you rights to access, correct, delete or receive your personal data, restrict processing, object to processing, or withdraw consent where processing relies on consent. You may also complain to your data protection authority.',
            'Browser data remains until cleared or expired. Account and tournament records can remain after you stop using the site; account deletion does not automatically erase tournament records or provider logs. You can contact the operator above to request access or deletion, including tournament records. Include enough information to identify the relevant account or entry, but do not send your password.',
          ],
        },
      ],
    },
    terms: {
      intro: 'SkatGo is a free Skat learning and practice service. These terms apply to its course, games, daily tournament and optional account.',
      sections: [
        operator.en,
        {
          id: 'use',
          title: 'Using SkatGo',
          paragraphs: [
            'You may use the course and assistant without registering. An account is optional. Keep your login credentials private and use an account you are entitled to use.',
            'Account providers can impose age requirements. Children should involve a parent or guardian when creating an account or sharing personal information. Do not bypass provider restrictions.',
          ],
        },
        {
          id: 'fair-play',
          title: 'Fair play and public nicknames',
          paragraphs: [
            'The daily tournament allows one entry per player per day. Its scores are calculated from the moves recorded by the server. Do not manipulate scores, create extra identities to gain an advantage, automate abusive requests or interfere with other players.',
            'Nicknames you submit appear publicly with tournament results. Do not impersonate someone, disclose private information or use illegal or abusive content. SkatGo may remove an unsuitable nickname or restrict abusive access.',
          ],
        },
        {
          id: 'guidance',
          title: 'Learning, hints and AI answers',
          paragraphs: [
            'Games, hints and explanations are for learning and practice. AI answers can be wrong; check important rule questions against the published Skat rules.',
            'Scores have no cash value. The service does not take stakes or provide cash gambling. Completing the course does not guarantee a particular result in games or competitions.',
          ],
        },
        {
          id: 'content',
          title: 'Content and availability',
          paragraphs: [
            'You may access the course for learning and practice. Copyright and third-party licence rights remain with their owners; these terms do not grant ownership of the site or its content.',
            'SkatGo may update its lessons, games and features. Network failures and maintenance can interrupt play or affect unsaved progress. Continuous availability and preservation of every game are not guaranteed. These terms do not exclude rights or liability that applicable law does not allow to be excluded.',
          ],
        },
        {
          id: 'privacy',
          title: 'Privacy and changes',
          paragraphs: [
            'The Privacy Policy explains how accounts, device storage, game records, analytics and assistant requests are handled. These terms are not consent to optional data processing.',
            'The date above identifies this version. Changes will be published here. You can stop using the service at any time.',
          ],
        },
      ],
    },
  },
  de: {
    privacy: {
      intro: 'SkatGo verwendet Daten für den Skatkurs, Spiele, freiwillige Konten und den Assistenten sowie zur Auswertung der Websitenutzung.',
      sections: [
        operator.de,
        {
          id: 'accounts',
          title: 'Konto und Google-Anmeldung',
          paragraphs: [
            'Du kannst den Kurs und den Assistenten ohne Konto nutzen. Wenn du dich registrierst, verwaltet Clerk dein Konto, deine E-Mail-Adresse und deine Anmeldesitzung.',
            'Bei der Google-Anmeldung übermittelt Google an Clerk deine Kontokennung, E-Mail-Adresse und grundlegende Profildaten, etwa Name und Profilbild. SkatGo nutzt diese Angaben zur Anmeldung und Kontoanzeige. Es fordert keinen Zugriff auf Gmail, Drive, Kalender oder dein Google-Passwort an.',
            'Deine Clerk-Kontokennung kann deinen Eintrag im Tagesturnier zuordnen und Assistentenanfragen für Nutzungslimits zählen. Google-Anmeldedaten werden nicht in Assistentenanfragen aufgenommen oder gezielt an die Nutzungsanalyse übermittelt.',
          ],
        },
        {
          id: 'device',
          title: 'Daten auf deinem Gerät',
          paragraphs: [
            'Lernfortschritt, Sterne, Spielstatistik und Kartenfarben werden in diesem Browser gespeichert. Sie werden nicht mit deinem Konto synchronisiert. Ein Sprach-Cookie merkt sich die Sprache, die du auswählst.',
            'Der Assistent speichert die letzten Nachrichten im aktuellen Tab, damit du zwischen Seiten wechseln kannst. Eine neue Unterhaltung löscht diesen Verlauf. Mit dem Schließen des Tabs endet dessen Sitzungsspeicher; das Löschen der Websitedaten entfernt auch lokalen Fortschritt und Einstellungen.',
            'Clerk verwendet Cookies und ähnliche Speicher für Anmeldung und Sicherheit. Wenn du das Tagesturnier als Gast startest, wird ein sicheres Geräte-Cookie für bis zu 400 Tage gesetzt, um deinen Eintrag wiederzuerkennen. Der Turnierserver erhält nur einen Hash dieser Kennung, nicht den Cookie-Wert.',
          ],
        },
        {
          id: 'games',
          title: 'Spiele und öffentliche Ergebnisse',
          paragraphs: [
            'Das Tagesturnier speichert Spielerkennung, Spielzüge, Ergebnisse, Punkte und Zeitangaben auf dem Server. Wenn du einen Spitznamen einträgst, erscheint er mit Punktzahl und Rang in der öffentlichen Bestenliste. Verwende keinen Namen, der unerwünschte persönliche Informationen offenlegt.',
            'Bei der Anmeldung kann der heutige Gasteintrag dieses Geräts deinem Konto zugeordnet werden. Turnierdaten werden nicht automatisch um Mitternacht gelöscht. Beim freien Spiel liegt der Spielstand dagegen in einem zeitlich begrenzten, verschlüsselten Spiel-Token auf der Seite; Neuladen beginnt ein neues Spiel.',
          ],
        },
        {
          id: 'assistant',
          title: 'Fragen an den Assistenten',
          paragraphs: [
            'Wenn du eine Frage sendest, übermittelt SkatGo die letzten Gesprächsnachrichten, Sprache und den aktuellen Lektions- oder sichtbaren Spielkontext an Microsoft Azure OpenAI, um eine Antwort zu erzeugen. Dein Google-Profil gehört nicht zu dieser Anfrage.',
            'Die Anwendung schreibt Fragen und Antworten nicht in ihre Serverdatenbank oder Gesprächsprotokolle. Microsoft verarbeitet die Anfrage nach seinen Dienstbedingungen, einschließlich anwendbarer Sicherheits- und Missbrauchsüberwachung. Sende keine Passwörter, Zahlungsdaten oder andere sensible Angaben.',
          ],
        },
        {
          id: 'analytics',
          title: 'Nutzungsanalyse',
          paragraphs: [
            'Auf der veröffentlichten Website erhält PostHog Cloud EU Seitenaufrufe und Interaktionsereignisse, etwa Kurs- und Spielaktionen. Eine Browserkennung wird im lokalen Speicher abgelegt. Auch ohne Namen oder E-Mail-Adresse kann eine dauerhafte Kennung Besuche unterscheiden.',
            'Die Integration identifiziert kein Clerk-Konto bei PostHog. Sitzungsaufzeichnungen und Umfragen sind deaktiviert. Es geht um Nutzungsereignisse, nicht um Bildschirmaufnahmen. Die aktuelle Integration startet beim Besuch automatisch und bietet keine Auswahl zur Zustimmung zur Analyse.',
          ],
        },
        {
          id: 'providers',
          title: 'Dienstleister und technische Daten',
          paragraphs: [
            'Render betreibt Website und Turnierdatenbank. Clerk übernimmt die Anmeldung, Google die Google-Anmeldung und extern geladene Schriftarten, Microsoft den KI-Assistenten und PostHog die Nutzungsanalyse.',
            'Anfragen an die Website und diese Dienste übermitteln technische Angaben wie IP-Adresse, Browserinformationen und angeforderte Ressource. SkatGo verwendet eine IP-Adresse oder Kontokennung auch zur Begrenzung missbräuchlicher Anfragen. Dienstleister können Daten außerhalb deines Landes nach ihren anwendbaren Bedingungen und Schutzmaßnahmen verarbeiten.',
            'Die Weitergabe dient diesen Funktionen, nicht dem Verkauf deines Google-Profils oder der Verwendung von Google-Anmeldedaten für Werbung oder KI-Training. Sicherheit, Protokollaufbewahrung und internationale Verarbeitung der Dienstleister werden nicht allein von dieser Anwendung bestimmt.',
          ],
        },
        {
          id: 'choices',
          title: 'Deine Möglichkeiten und Datenanfragen',
          paragraphs: [
            'Du kannst ohne Anmeldung bleiben, den Assistenten nicht nutzen, Websitedaten im Browser löschen und die Google-Verbindung in deinem Google-Konto verwalten. Der Widerruf des Google-Zugriffs löscht nicht automatisch bereits bei Clerk oder SkatGo gespeicherte Daten.',
            'Das anwendbare Datenschutzrecht kann dir Rechte auf Auskunft, Berichtigung, Löschung, Datenübertragbarkeit, Einschränkung und Widerspruch geben. Beruht eine Verarbeitung auf Einwilligung, kannst du diese widerrufen. Du kannst dich auch bei deiner Datenschutzaufsichtsbehörde beschweren.',
            'Browserdaten bleiben bis zum Löschen oder Ablauf erhalten. Konto- und Turnierdaten können auch nach Ende der Nutzung gespeichert bleiben; eine Kontolöschung entfernt nicht automatisch Turnierdaten oder Dienstleisterprotokolle. Du kannst bei der oben genannten Betreiberin Auskunft oder Löschung einschließlich der Turnierdaten anfragen. Nenne ausreichend Angaben zur Zuordnung des Kontos oder Eintrags, aber sende kein Passwort.',
          ],
        },
      ],
    },
    terms: {
      intro: 'SkatGo ist ein kostenloses Angebot zum Skatlernen und Üben. Diese Bedingungen gelten für Kurs, Spiele, Tagesturnier und das freiwillige Konto.',
      sections: [
        operator.de,
        {
          id: 'use',
          title: 'SkatGo nutzen',
          paragraphs: [
            'Kurs und Assistent sind ohne Registrierung nutzbar. Ein Konto ist freiwillig. Halte Zugangsdaten geheim und nutze nur ein Konto, zu dessen Nutzung du berechtigt bist.',
            'Anmeldeanbieter können Altersvorgaben haben. Kinder sollten Eltern oder Sorgeberechtigte einbeziehen, wenn sie ein Konto erstellen oder persönliche Daten teilen. Umgehe keine Beschränkungen der Anbieter.',
          ],
        },
        {
          id: 'fair-play',
          title: 'Fair spielen und Spitznamen wählen',
          paragraphs: [
            'Im Tagesturnier ist ein Eintrag pro Spieler und Tag vorgesehen. Der Server berechnet die Punkte aus den gespeicherten Spielzügen. Manipuliere keine Ergebnisse, lege keine zusätzlichen Identitäten zur Vorteilsnahme an und störe andere Spieler oder den Dienst nicht durch automatisierte missbräuchliche Anfragen.',
            'Eingetragene Spitznamen erscheinen öffentlich mit den Turnierergebnissen. Gib dich nicht als andere Person aus und veröffentliche keine privaten, rechtswidrigen oder beleidigenden Inhalte. SkatGo kann ungeeignete Spitznamen entfernen und missbräuchliche Zugriffe beschränken.',
          ],
        },
        {
          id: 'guidance',
          title: 'Lernen, Hinweise und KI-Antworten',
          paragraphs: [
            'Spiele, Hinweise und Erklärungen dienen dem Lernen und Üben. KI-Antworten können falsch sein; prüfe wichtige Regelfragen anhand der veröffentlichten Skatregeln.',
            'Punkte haben keinen Geldwert. Das Angebot nimmt keine Geldeinsätze an und bietet kein Glücksspiel um Geld. Der Kursabschluss garantiert kein bestimmtes Ergebnis in Spielen oder Wettbewerben.',
          ],
        },
        {
          id: 'content',
          title: 'Inhalte und Verfügbarkeit',
          paragraphs: [
            'Du darfst den Kurs zum Lernen und Üben nutzen. Urheberrechte und Lizenzrechte Dritter verbleiben bei ihren Inhabern; diese Bedingungen übertragen kein Eigentum an der Website oder ihren Inhalten.',
            'SkatGo kann Lektionen, Spiele und Funktionen aktualisieren. Netzstörungen und Wartung können Spiele unterbrechen oder ungesicherten Fortschritt beeinträchtigen. Dauerhafte Verfügbarkeit und der Erhalt jedes Spiels werden nicht garantiert. Gesetzlich nicht ausschließbare Rechte und Haftung bleiben unberührt.',
          ],
        },
        {
          id: 'privacy',
          title: 'Datenschutz und Änderungen',
          paragraphs: [
            'Die Datenschutzerklärung erläutert den Umgang mit Konten, Gerätespeicher, Spielaufzeichnungen, Nutzungsanalyse und Assistentenanfragen. Diese Bedingungen sind keine Einwilligung in optionale Datenverarbeitung.',
            'Das Datum oben bezeichnet diese Fassung. Änderungen werden hier veröffentlicht. Du kannst die Nutzung jederzeit beenden.',
          ],
        },
      ],
    },
  },
}
