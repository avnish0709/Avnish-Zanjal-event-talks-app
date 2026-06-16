document.addEventListener('DOMContentLoaded', () => {
    // App State
    let updates = [];
    let activeFilter = 'all';
    let currentSearch = '';
    let currentSort = 'newest';
    let selectedUpdate = null;

    // DOM Elements
    const notesContainer = document.getElementById('notes-container');
    const notesCount = document.getElementById('notes-count');
    const btnRefresh = document.getElementById('btn-refresh');
    const spinnerIcon = btnRefresh.querySelector('.spinner-icon');
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const sortSelect = document.getElementById('sort-select');
    const typeFilters = document.getElementById('type-filters');
    
    // Modal DOM Elements
    const tweetModal = document.getElementById('tweet-modal');
    const modalClose = document.getElementById('btn-close-modal');
    const modalBadge = document.getElementById('modal-update-badge');
    const modalDate = document.getElementById('modal-update-date');
    const modalExcerpt = document.getElementById('modal-update-excerpt');
    const tweetTextarea = document.getElementById('tweet-textarea');
    const charCounter = document.getElementById('char-counter');
    const btnCancelTweet = document.getElementById('btn-cancel-tweet');
    const btnShareTweet = document.getElementById('btn-share-tweet');
    
    // Toast DOM
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');

    // Fetch notes from API
    async function fetchReleaseNotes() {
        setLoading(true);
        try {
            const response = await fetch('/api/release-notes');
            const data = await response.json();
            if (data.success) {
                updates = data.updates;
                renderUpdates();
            } else {
                showToast('Failed to load release notes.', 'error');
                showEmptyState('Failed to fetch data');
            }
        } catch (error) {
            console.error('Error fetching release notes:', error);
            showToast('Error connecting to backend.', 'error');
            showEmptyState('Network Error occurred');
        } finally {
            setLoading(false);
        }
    }

    // Toggle loading states
    function setLoading(isLoading) {
        if (isLoading) {
            spinnerIcon.classList.add('loading');
            btnRefresh.disabled = true;
            // Clear content and show skeletons
            notesContainer.innerHTML = `
                <div class="skeleton-card card"></div>
                <div class="skeleton-card card"></div>
                <div class="skeleton-card card"></div>
            `;
            notesCount.textContent = "Fetching latest BigQuery release notes...";
        } else {
            spinnerIcon.classList.remove('loading');
            btnRefresh.disabled = false;
        }
    }

    // Show empty state
    function showEmptyState(msg = 'No updates found matching your search.') {
        notesContainer.innerHTML = `
            <div class="empty-state card">
                <i class="fa-solid fa-folder-open"></i>
                <h3>No Updates Found</h3>
                <p>${msg}</p>
            </div>
        `;
        notesCount.textContent = "Showing 0 updates";
    }

    // Render updates list to DOM
    function renderUpdates() {
        // Filter
        let filtered = updates.filter(update => {
            const matchesType = activeFilter === 'all' || update.type.toLowerCase() === activeFilter.toLowerCase();
            const matchesSearch = currentSearch === '' || 
                update.content_text.toLowerCase().includes(currentSearch) ||
                update.type.toLowerCase().includes(currentSearch) ||
                update.date.toLowerCase().includes(currentSearch);
            return matchesType && matchesSearch;
        });

        // Sort
        filtered.sort((a, b) => {
            // Helper to parse dates (e.g. "June 15, 2026" or "May 06, 2026")
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            if (currentSort === 'newest') {
                return dateB - dateA;
            } else {
                return dateA - dateB;
            }
        });

        // Render count
        notesCount.textContent = `Showing ${filtered.length} of ${updates.length} release notes`;

        if (filtered.length === 0) {
            showEmptyState();
            return;
        }

        notesContainer.innerHTML = '';
        
        filtered.forEach((update, idx) => {
            const card = document.createElement('article');
            const categoryClass = `type-${update.type.toLowerCase()}`;
            card.className = `note-card card ${categoryClass}`;
            card.style.animationDelay = `${idx * 0.05}s`;
            
            // Format Badge style
            const badgeType = update.type.toLowerCase();
            const badgeClass = ['feature', 'change', 'issue', 'breaking', 'announcement'].includes(badgeType) 
                ? `type-${badgeType}` 
                : 'type-default';

            card.innerHTML = `
                <div class="note-header">
                    <span class="badge ${badgeClass}">${update.type}</span>
                    <span class="date-text">${update.date}</span>
                </div>
                <div class="note-body">
                    ${update.content_html}
                </div>
                <div class="note-footer">
                    <button class="btn-icon btn-copy-action" title="Copy to clipboard">
                        <i class="fa-regular fa-copy"></i>
                    </button>
                    <button class="btn-icon btn-tweet-action" title="Tweet this update">
                        <i class="fa-brands fa-x-twitter"></i>
                    </button>
                </div>
            `;

            // Copy Action
            const copyBtn = card.querySelector('.btn-copy-action');
            copyBtn.addEventListener('click', () => {
                const textToCopy = `BigQuery Release Note [${update.date}] - ${update.type}:\n${update.content_text}`;
                navigator.clipboard.writeText(textToCopy).then(() => {
                    showToast('Copied to clipboard!');
                }).catch(err => {
                    console.error('Could not copy text: ', err);
                    showToast('Failed to copy to clipboard', 'error');
                });
            });

            // Tweet Action
            const tweetBtn = card.querySelector('.btn-tweet-action');
            tweetBtn.addEventListener('click', () => {
                openTweetModal(update);
            });

            notesContainer.appendChild(card);
        });
    }

    // Modal Manager
    function openTweetModal(update) {
        selectedUpdate = update;
        
        const badgeType = update.type.toLowerCase();
        modalBadge.className = `badge type-${badgeType}`;
        modalBadge.textContent = update.type;
        modalDate.textContent = update.date;
        
        // Excerpt showing
        const maxExcerpt = 160;
        let excerptText = update.content_text;
        if (excerptText.length > maxExcerpt) {
            excerptText = excerptText.substring(0, maxExcerpt) + "...";
        }
        modalExcerpt.textContent = excerptText;

        // Compose default tweet body
        let cleanText = update.content_text;
        
        // Construct standard tag line
        const header = `BigQuery Update: [${update.type}] 🚀\n`;
        const footer = `\nSource: ${update.link || 'Google Cloud'}\n#BigQuery #GoogleCloud #Data`;
        
        // Limit description text to fit tweet size limit (280)
        const allowedLength = 280 - header.length - footer.length;
        if (cleanText.length > allowedLength) {
            cleanText = cleanText.substring(0, allowedLength - 3) + "...";
        }
        
        tweetTextarea.value = `${header}${cleanText}${footer}`;
        updateCharCounter();
        
        tweetModal.classList.add('active');
        tweetTextarea.focus();
    }

    function closeTweetModal() {
        tweetModal.classList.remove('active');
        selectedUpdate = null;
    }

    function updateCharCounter() {
        const len = tweetTextarea.value.length;
        charCounter.textContent = `${len} / 280`;
        
        if (len > 280) {
            charCounter.classList.add('warning');
            btnShareTweet.disabled = true;
        } else {
            charCounter.classList.remove('warning');
            btnShareTweet.disabled = false;
        }
    }

    // Show Toast Alert
    function showToast(message, type = 'success') {
        toastMessage.textContent = message;
        
        if (type === 'success') {
            toast.style.background = 'rgba(16, 185, 129, 0.9)';
            toast.querySelector('.toast-icon').className = 'fa-solid fa-check-circle toast-icon';
        } else {
            toast.style.background = 'rgba(239, 68, 68, 0.9)';
            toast.querySelector('.toast-icon').className = 'fa-solid fa-circle-exclamation toast-icon';
        }
        
        toast.classList.add('active');
        
        setTimeout(() => {
            toast.classList.remove('active');
        }, 3000);
    }

    // Events Hookups
    btnRefresh.addEventListener('click', fetchReleaseNotes);
    
    // Search input handler
    searchInput.addEventListener('input', (e) => {
        currentSearch = e.target.value.toLowerCase().strip();
        if (currentSearch.length > 0) {
            searchClear.style.display = 'flex';
        } else {
            searchClear.style.display = 'none';
        }
        renderUpdates();
    });

    // Clear search
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        currentSearch = '';
        searchClear.style.display = 'none';
        searchInput.focus();
        renderUpdates();
    });

    // Sort select handler
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderUpdates();
    });

    // Tag filtering
    typeFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-tag')) {
            // Remove active from all
            typeFilters.querySelectorAll('.filter-tag').forEach(tag => {
                tag.classList.remove('active');
            });
            // Add to current
            e.target.classList.add('active');
            activeFilter = e.target.getAttribute('data-type');
            renderUpdates();
        }
    });

    // Modal event handlers
    modalClose.addEventListener('click', closeTweetModal);
    btnCancelTweet.addEventListener('click', closeTweetModal);
    tweetTextarea.addEventListener('input', updateCharCounter);
    
    btnShareTweet.addEventListener('click', () => {
        const tweetContent = tweetTextarea.value;
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetContent)}`;
        window.open(twitterIntentUrl, '_blank', 'noopener,noreferrer');
        closeTweetModal();
        showToast('Redirected to X/Twitter!');
    });

    // Close modal on clicking backdrop
    tweetModal.addEventListener('click', (e) => {
        if (e.target === tweetModal) {
            closeTweetModal();
        }
    });

    // Helpers
    String.prototype.strip = function() {
        return this.replace(/^\s+|\s+$/g, '');
    };

    // Initial Load
    fetchReleaseNotes();
});
