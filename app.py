import re
import html
import hashlib
import requests
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, jsonify, render_template

app = Flask(__name__)

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def clean_html_content(soup_node):
    # Ensure links target _blank so they don't navigate inside the iframe/app
    for link in soup_node.find_all('a'):
        link['target'] = '_blank'
        link['rel'] = 'noopener noreferrer'
        # Add modern CSS class to links
        link['class'] = link.get('class', []) + ['custom-link']
    
    # Inline code formatting
    for code in soup_node.find_all('code'):
        code['class'] = code.get('class', []) + ['custom-code']
        
    return str(soup_node)

def parse_release_notes():
    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
        xml_content = response.content
    except Exception as e:
        print(f"Error fetching feed: {e}")
        return []

    try:
        namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
        root = ET.fromstring(xml_content)
        
        all_updates = []
        
        for entry in root.findall('atom:entry', namespaces):
            date_str = entry.find('atom:title', namespaces).text or "Unknown Date"
            link_elem = entry.find('atom:link[@rel="alternate"]', namespaces)
            link_url = link_elem.get('href') if link_elem is not None else ""
            
            content_elem = entry.find('atom:content', namespaces)
            if content_elem is None or not content_elem.text:
                continue
                
            content_html = content_elem.text
            soup = BeautifulSoup(content_html, 'html.parser')
            
            current_type = "Update"
            current_elements = []
            
            # Helper to commit a parsed release note
            def commit_update(update_type, elements):
                if not elements:
                    return
                # Create a mini soup for the elements
                mini_soup = BeautifulSoup("", "html.parser")
                for el in elements:
                    mini_soup.append(el)
                
                html_str = clean_html_content(mini_soup)
                text_str = mini_soup.get_text().strip()
                
                # Clean up multiple whitespaces/newlines in text
                text_str = re.sub(r'\s+', ' ', text_str)
                
                # Generate a unique stable ID based on content hash
                content_hash = hashlib.md5(f"{date_str}-{update_type}-{text_str[:100]}".encode('utf-8')).hexdigest()
                
                all_updates.append({
                    "id": content_hash,
                    "date": date_str,
                    "type": update_type,
                    "content_html": html_str,
                    "content_text": text_str,
                    "link": link_url
                })

            for child in soup.children:
                if child.name == 'h3':
                    # Commit previous update before changing types
                    commit_update(current_type, current_elements)
                    current_elements = []
                    current_type = child.get_text().strip()
                elif child.name in ['p', 'ul', 'ol', 'div', 'h4', 'blockquote']:
                    current_elements.append(child)
                elif isinstance(child, str) and child.strip():
                    # If there's text outside of paragraphs, wrap it in a span/p
                    new_p = soup.new_tag('p')
                    new_p.string = child.strip()
                    current_elements.append(new_p)
            
            # Commit the final update of this entry
            commit_update(current_type, current_elements)
            
        return all_updates
        
    except Exception as e:
        print(f"Error parsing feed: {e}")
        return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/release-notes')
def get_release_notes():
    updates = parse_release_notes()
    return jsonify({
        "success": True,
        "count": len(updates),
        "updates": updates
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
