export default function ArtworkWarning({ item, onClose, onReveal, titleId }) {
  return (
    <section className="artwork-warning" aria-labelledby={titleId}>
      <div className="artwork-warning-preview"><img src={item.thumbWebp} alt="Blurred artwork preview" /></div>
      <h2 id={titleId}>Sensitive artwork</h2>
      <p>{(item.contentWarning || "Mature content or artistic nudity").replace(/[.!?\s]+$/, "")}. The image stays blurred until you choose to view it.</p>
      <div className="artwork-warning-actions">
        <button type="button" onClick={onClose}>Keep blurred</button>
        <button type="button" onClick={onReveal}>View artwork</button>
      </div>
    </section>
  );
}
