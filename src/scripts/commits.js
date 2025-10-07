class CommitHistoryViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.currentPage = 1;
    this.perPage = 20;
    this.loading = false;
    this.owner = null;
    this.repo = null;
  }

  async fetchCommits(page = 1, filePath = '') {
    try {
      this.loading = true;
      this.showLoading();
      
      let url = `/.netlify/functions/commits?page=${page}&per_page=${this.perPage}`;
      
      if (this.owner) {
        url += `&owner=${encodeURIComponent(this.owner)}`;
      }
      if (this.repo) {
        url += `&repo=${encodeURIComponent(this.repo)}`;
      }
      if (filePath) {
        url += `&path=${encodeURIComponent(filePath)}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch commits: ${response.status}`);
      }
      
      const data = await response.json();
      this.loading = false;
      return data;
    } catch (error) {
      console.error('Error fetching commits:', error);
      this.loading = false;
      this.showError(error.message);
      return { commits: [], page: 1, perPage: this.perPage };
    }
  }

  showLoading() {
    this.container.innerHTML = `
      <div class="commit-loading">
        <div class="spinner"></div>
        <p>Loading commit history...</p>
      </div>
    `;
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="commit-error">
        <p>❌ Failed to load commits: ${this.escapeHtml(message)}</p>
      </div>
    `;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const diffWeeks = Math.floor(diffDays / 7);
      return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 365) {
      const diffMonths = Math.floor(diffDays / 30);
      return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  renderCommits(data) {
    const { commits, page, repo } = data;
    
    if (commits.length === 0) {
      this.container.innerHTML = `
        <div class="no-commits">
          <p>No commits found.</p>
        </div>
      `;
      return;
    }

    let html = '<div class="commit-history">';
    
    if (repo) {
      html += `
        <div class="repo-header">
          <a href="https://github.com/${repo.owner}/${repo.name}" target="_blank" rel="noopener noreferrer" class="repo-link">
            View on GitHub: ${repo.owner}/${repo.name} →
          </a>
        </div>
      `;
    }
    
    html += '<div class="commits-list">';
    
    commits.forEach(commit => {
      const lines = commit.message.split('\n');
      const firstLine = lines[0];
      const restOfMessage = lines.slice(1).join('\n').trim();
      
      html += `
        <div class="commit-item">
          <div class="commit-header">
            ${commit.author.avatar ? 
              `<img src="${commit.author.avatar}" alt="${commit.author.name}" class="commit-avatar">` : 
              `<div class="commit-avatar-placeholder">${commit.author.name.charAt(0)}</div>`
            }
            <div class="commit-info">
              <div class="commit-title">
                <a href="${commit.url}" target="_blank" rel="noopener noreferrer">
                  ${this.escapeHtml(firstLine)}
                </a>
              </div>
              ${restOfMessage ? `<div class="commit-description">${this.escapeHtml(restOfMessage)}</div>` : ''}
              <div class="commit-meta">
                <span class="commit-author">${this.escapeHtml(commit.author.name)}</span>
                <span class="commit-separator">•</span>
                <span class="commit-date">${this.formatDate(commit.author.date)}</span>
                <span class="commit-separator">•</span>
                <code class="commit-sha">${commit.sha}</code>
              </div>
            </div>
          </div>
        </div>
      `;
    });
    
    html += '</div>'; // commits-list
    
    // Pagination
    html += '<div class="commit-pagination">';
    if (page > 1) {
      html += `<button class="btn-prev" data-page="${page - 1}">← Previous</button>`;
    }
    html += `<span class="page-info">Page ${page}</span>`;
    if (commits.length === this.perPage) {
      html += `<button class="btn-next" data-page="${page + 1}">Next →</button>`;
    }
    html += '</div>';
    
    html += '</div>'; // commit-history
    
    this.container.innerHTML = html;
    this.attachPaginationEvents();
  }

  attachPaginationEvents() {
    const prevBtn = this.container.querySelector('.btn-prev');
    const nextBtn = this.container.querySelector('.btn-next');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', async (e) => {
        const page = parseInt(e.target.dataset.page);
        const data = await this.fetchCommits(page);
        this.renderCommits(data);
        this.scrollToTop();
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', async (e) => {
        const page = parseInt(e.target.dataset.page);
        const data = await this.fetchCommits(page);
        this.renderCommits(data);
        this.scrollToTop();
      });
    }
  }

  scrollToTop() {
    this.container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async initExternal(owner, repo, filePath = '') {
    this.owner = owner;
    this.repo = repo;
    const data = await this.fetchCommits(1, filePath);
    this.renderCommits(data);
  }
}
