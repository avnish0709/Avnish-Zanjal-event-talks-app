# BigQuery Release Notes Hub 🚀

A modern, responsive, and aesthetically stunning Flask web application that fetches, parses, and formats the latest BigQuery release notes. It splits multi-update daily releases into single clear cards, supports real-time text searching, filtering by categories, and features an interactive X (Twitter) composer to post updates directly.

![Design Theme](https://img.shields.io/badge/Design-Glassmorphism-blueviolet?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Tech_Stack-Flask_|_HTML_|_CSS_|_JS-blue?style=for-the-badge)

---

## ✨ Features

- **Split Multi-Update Entries:** Daily release logs from Google are split into individual feature, change, issue, or announcement cards for granular reading, sorting, and sharing.
- **Visual Design:** Features a dark-themed glassmorphism interface, custom gradients, floating ambient backgrounds, and typography (Outfit & Plus Jakarta Sans).
- **Interactive Controls:**
  - **Live Search:** Instant client-side search matching titles, content, and dates.
  - **Category Filtering:** Filter notes by Feature, Change, Issue, Breaking, or Announcement.
  - **Sorting:** Toggle between newest and oldest entries.
- **Clipboard Utility:** Copies formatted summaries of release notes to your clipboard with custom toast alerts.
- **Smart X (Twitter) Composer:** An inline post preview modal that formats your update, adds appropriate hashtags, verifies the 280-character limit, and redirects to X Web Intent.

---

## 🛠️ Tech Stack

- **Backend:** Python, Flask, Requests (HTTP fetching), BeautifulSoup4 (HTML Parsing), XML ElementTree
- **Frontend:** Vanilla HTML5, Vanilla CSS3 (Custom Variables, Gradients, Animations), Vanilla JavaScript (ES6+ State Management)
- **Icons:** FontAwesome v6

---

## 📂 Project Structure

```text
bigquery_release_notes/
│
├── app.py                # Flask Backend & Feed Parser
├── .gitignore            # Git exclusion rules
├── README.md             # Project Documentation
│
├── static/
│   ├── app.js            # Frontend State, Filters, & Modal Controller
│   └── style.css         # UI Design, Custom Variables, & Micro-animations
│
└── templates/
    └── index.html        # Main Application Interface
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Python installed on your system.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/avnish0709/Avnish-Zanjal-event-talks-app.git
   cd Avnish-Zanjal-event-talks-app
   ```

2. **Install the dependencies:**
   ```bash
   pip install Flask requests beautifulsoup4
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Open in browser:**
   Navigate to **[http://127.0.0.1:5000](http://127.0.0.1:5000)** to view the application.

---

## 📸 Usage

- **Refresh Feed:** Click the **Refresh** button in the header (which spins during fetch requests) to load the latest feed live from Google Cloud.
- **Filter and Search:** Use the search bar or click on category tags (Features, Changes, etc.) to refine your list.
- **Tweet an Update:** Click the **X icon** on any card. Customise the text in the modal composer, then click **Post to X** to tweet it.
- **Copy Text:** Click the **Copy icon** to copy a pre-formatted markdown version of the release note.
