import { Link } from 'react-router-dom';
import { useReveal } from '../hooks/useReveal';

const PAGES = {
  about: {
    kicker: 'About',
    title: 'Built for people who love film',
    sections: [
      {
        heading: 'What Priva is',
        body: 'Priva is a discovery-first streaming front-end. We bring trending movies, series and anime into one calm, cinematic interface so you spend less time scrolling through menus and more time watching.',
      },
      {
        heading: 'How it works',
        body: 'Titles, artwork, ratings and descriptions come from TMDB. Playback is handled by independent third-party embed providers, each exposed as a numbered server. If one source is unavailable, switch to the next — your progress is kept locally and in your account.',
      },
      {
        heading: 'What we do not do',
        body: 'Priva does not host, upload or store video files. We do not run advertising networks inside the player, and we do not sell your watch history. Your list and progress belong to you and can be cleared at any time from Settings.',
      },
    ],
  },
  faq: {
    kicker: 'Support',
    title: 'Frequently asked questions',
    sections: [
      {
        heading: 'A stream will not start. What should I try?',
        body: 'Switch servers using the numbered buttons under the player. Each server connects to a different source, so one being down rarely affects the others. If every server fails, the title may not be available yet.',
      },
      {
        heading: 'Do I need an account?',
        body: 'No. You can browse and watch as a guest. Signing in with email or Google syncs your watchlist, favourites and resume points across devices via Firebase.',
      },
      {
        heading: 'Why does my progress disappear?',
        body: 'Progress is saved from the player every few seconds. If you watch in a private window, or clear browser storage while signed out, guest progress is removed. Signed-in progress is stored in your account.',
      },
      {
        heading: 'How do downloads work?',
        body: 'Download buttons open an external provider page where you choose 480p, 720p or 1080p. Priva does not host those files. Only download material you have the right to access.',
      },
      {
        heading: 'Can I request a title?',
        body: 'Yes — send us the TMDB link through the contact page and we will look at adding it to the catalogue view.',
      },
    ],
  },
  contact: {
    kicker: 'Contact',
    title: 'Talk to us',
    sections: [
      {
        heading: 'General enquiries',
        body: 'Email hello@priva.example and we usually reply within two working days. For playback problems, include the title, the server number and the approximate time it failed.',
      },
      {
        heading: 'Content removal',
        body: 'If you are a rights holder and believe a title should not be listed, email dmca@priva.example with the title, the TMDB identifier and a description of your rights. Valid requests are actioned promptly.',
      },
      {
        heading: 'Feature requests',
        body: 'We read everything. Tell us what would make Priva better — a new sort order, a language filter, better subtitles — and it goes straight into the backlog.',
      },
    ],
  },
  privacy: {
    kicker: 'Legal',
    title: 'Privacy policy',
    sections: [
      {
        heading: 'What we collect',
        body: 'If you create an account we store your email address, display name and the library data you generate (watchlist, favourites, watch progress). Guests store the same library data in their own browser only.',
      },
      {
        heading: 'How it is used',
        body: 'Library data is used solely to render your list, continue-watching row and settings. We do not sell data, and we do not run third-party advertising trackers.',
      },
      {
        heading: 'Third parties',
        body: 'Authentication and storage are provided by Firebase (Google). Metadata and images are provided by TMDB. Embedded players are served by independent providers and may set their own cookies once loaded.',
      },
      {
        heading: 'Your control',
        body: 'You can clear watch history at any time from Settings, and you can request account deletion by emailing us. Deleting your account removes the Firestore document tied to it.',
      },
    ],
  },
  terms: {
    kicker: 'Legal',
    title: 'Terms of use',
    sections: [
      {
        heading: 'Service',
        body: 'Priva is a discovery interface that links to third-party media sources. We do not guarantee availability, quality or continuity of any stream, and we may change or remove features at any time.',
      },
      {
        heading: 'Acceptable use',
        body: 'You agree not to scrape the service, attempt to bypass access controls, or use Priva for unlawful purposes. Access may be suspended for abuse.',
      },
      {
        heading: 'Content and rights',
        body: 'All metadata and artwork belong to their respective owners. Priva claims no ownership over any film, series or image shown. Rights holders can request removal through the contact page.',
      },
      {
        heading: 'Liability',
        body: 'The service is provided “as is” without warranties. To the extent permitted by law, Priva is not liable for damages arising from use of the service or of third-party providers.',
      },
    ],
  },
  dmca: {
    kicker: 'Legal',
    title: 'Copyright & DMCA',
    sections: [
      {
        heading: 'Our position',
        body: 'Priva does not host video files. Listings reference media that is publicly indexed through TMDB and playable through independent third-party embeds. We respect the rights of copyright owners.',
      },
      {
        heading: 'Filing a notice',
        body: 'Send a notice to dmca@priva.example including your contact details, identification of the work, the exact Priva URL or TMDB ID, and a statement that you are authorised to act for the rights holder.',
      },
      {
        heading: 'What happens next',
        body: 'We review complete notices within two working days and remove or de-list the referenced title while the claim is assessed. Incomplete notices are returned with an explanation.',
      },
    ],
  },
};

export default function Static({ page = 'about' }) {
  const content = PAGES[page] || PAGES.about;
  useReveal([page]);

  return (
    <div className="container-page max-w-3xl pb-20 pt-[120px]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-400">
        {content.kicker}
      </p>
      <h1 className="mt-2 text-[32px] font-extrabold tracking-[-0.03em] sm:text-[42px]">
        {content.title}
      </h1>

      <div className="mt-9 space-y-8">
        {content.sections.map((section) => (
          <section key={section.heading} data-reveal>
            <h2 className="mb-2 text-[16px] font-bold text-white/85">{section.heading}</h2>
            <p className="text-[13.5px] leading-relaxed text-white/50">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 flex flex-wrap gap-2 border-t border-white/[0.07] pt-6">
        <Link to="/" className="chip py-2">
          Back to browsing
        </Link>
        <Link to="/contact" className="chip py-2">
          Contact us
        </Link>
      </div>
    </div>
  );
}
