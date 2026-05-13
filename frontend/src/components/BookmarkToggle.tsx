interface BookmarkToggleProps {
  isBookmarked: boolean
  onToggle: () => void
  className?: string
}

export default function BookmarkToggle({ isBookmarked, onToggle, className = '' }: BookmarkToggleProps) {
  return (
    <button
      type="button"
      className={['bookmark-toggle', isBookmarked ? 'is-bookmarked' : '', className]
        .filter(Boolean)
        .join(' ')}
      aria-label={isBookmarked ? '取消收藏本题' : '收藏本题'}
      title={isBookmarked ? '取消收藏本题' : '收藏本题'}
      onClick={onToggle}
    >
      <svg className="bookmark-toggle-icon" viewBox="0 0 28 36" aria-hidden="true">
        <path d="M5 3.5H23C24.4 3.5 25.5 4.6 25.5 6V31.2C25.5 32.4 24.1 33.1 23.2 32.3L15.2 25.7C14.5 25.1 13.5 25.1 12.8 25.7L4.8 32.3C3.9 33.1 2.5 32.4 2.5 31.2V6C2.5 4.6 3.6 3.5 5 3.5Z" />
      </svg>
      {!isBookmarked ? <span className="bookmark-toggle-plus" aria-hidden="true">+</span> : null}
    </button>
  )
}
