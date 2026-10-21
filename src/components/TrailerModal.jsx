import Modal from './Modal';

export default function TrailerModal({ open, onClose, youtubeKey, title }) {
  if (!youtubeKey) return null;

  return (
    <Modal open={open} onClose={onClose} maxWidth="max-w-4xl">
      <div className="mb-3 pr-8">
        <h3 className="font-display text-[18px] font-bold text-white">
          {title} — Official Trailer
        </h3>
      </div>
      <div className="aspect-video w-full overflow-hidden rounded-xl bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeKey}?autoplay=1&rel=0`}
          title={`${title} Trailer`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="h-full w-full border-0"
        />
      </div>
    </Modal>
  );
}
