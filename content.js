class FloatingSidebar {
  constructor() {
    this.createSidebarHTML();
    this.initElememts();
    this.initListener();
    this.loadItems();
    this.currentEditIndex = null;
  }

  createSidebarHTML() {
    const sidebarHTML = `
      <div id="floating-sidebar">
        <div id="sidebar-container">
          <div id="items-list"></div>
          <button id="add-button">+</button>
        </div>
      </div>
      <div id="dialog-overlay" class="hidden"></div>
      <div id="add-dialog" class="hidden">
        <input type="text" id="title-input" placeholder="title">
        <textarea id="content-input" placeholder="content"></textarea>
        <div class="dialog-buttons">
          <button id="save-button">save</button>
          <button id="cancel-button">cancel</button>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', sidebarHTML);
    console.log('Sidebar HTML inserted');
  }

  initElememts() {
    this.itemsList = document.getElementById('items-list');
    this.addButton = document.getElementById('add-button');
    this.addDialog = document.getElementById('add-dialog');
    this.dialogOverlay = document.getElementById('dialog-overlay');
    this.titleInput = document.getElementById('title-input');
    this.contentInput = document.getElementById('content-input');
    this.saveButton = document.getElementById('save-button');
    this.cancelButton = document.getElementById('cancel-button');
    
    console.log('Elements initialized:', {
      itemsList: this.itemsList,
      addButton: this.addButton,
      addDialog: this.addDialog
    });
  }

  initListener() {
    this.addButton.addEventListener('click', () => this.showAddDialog());
    this.saveButton.addEventListener('click', () => this.saveItem());
    this.cancelButton.addEventListener('click', () => this.hideAddDialog());
  }

  async loadItems() {
    const result = await browser.storage.sync.get('items');
    const items = result.items || [];
    this.drawItems(items);
  }

  drawItems(items) {
    this.itemsList.innerHTML = '';
    items.forEach((item, index) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'item';
      itemElement.innerHTML = `
        <span class="item-title">${item.title}</span>
        <div class="item-buttons">
          <span class="edit-button">✏️</span>
          <span class="delete-button">🗑️</span>
        </div>
      `;
      
      itemElement.querySelector('.item-title').addEventListener('click', () => {
        this.insertContent(item.content);
      });
      
      itemElement.querySelector('.edit-button').addEventListener('click', (e) => {
        e.stopPropagation();
        this.showEditDialog(item, index);
      });
      
      itemElement.querySelector('.delete-button').addEventListener('click', async (e) => {
        e.stopPropagation();
        await this.deleteItem(index);
      });
      
      this.itemsList.appendChild(itemElement);
    });
  }

  showAddDialog() {
    this.currentEditIndex = null;
    this.dialogOverlay.classList.remove('hidden');
    this.addDialog.classList.remove('hidden');
    this.titleInput.value = '';
    this.contentInput.value = '';
    this.saveButton.textContent = 'save';
  }

  showEditDialog(item, index) {
    this.currentEditIndex = index;
    this.dialogOverlay.classList.remove('hidden');
    this.addDialog.classList.remove('hidden');
    this.titleInput.value = item.title;
    this.contentInput.value = item.content;
    this.saveButton.textContent = 'update';
  }

  hideAddDialog() {
    this.dialogOverlay.classList.add('hidden');
    this.addDialog.classList.add('hidden');
    this.currentEditIndex = null;
  }

  async saveItem() {
    const title = this.titleInput.value.trim();
    const content = this.contentInput.value;
    
    if (!title || !content) return;

    const result = await browser.storage.sync.get('items');
    const items = result.items || [];

    if (this.currentEditIndex !== null) {
      items[this.currentEditIndex] = { title, content };
    } else {
      items.push({ title, content });
    }

    await browser.storage.sync.set({ items });
    this.hideAddDialog();
    this.drawItems(items);
  }

  async deleteItem(index) {
    const result = await browser.storage.sync.get('items');
    const items = result.items || [];
    items.splice(index, 1);
    await browser.storage.sync.set({ items });
    this.drawItems(items);
  }

  insertContent(content) {
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
      chatInput.value = content;
      chatInput.dispatchEvent(new Event('input', { bubbles: true }));
    }else{
      
    }
  }
}

function initializeSidebar() {
  console.log('Attempting to initialize sidebar...');
  if (document.readyState === 'complete') {
    console.log('Document ready, creating sidebar...');
    new FloatingSidebar();
  } else {
    console.log('Document not ready, waiting...');
    window.addEventListener('load', () => {
      console.log('Load event fired, creating sidebar...');
      new FloatingSidebar();
    });
  }
}


(function() {
  console.log('Content script loaded');
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new FloatingSidebar());
  } else {
    new FloatingSidebar();
  }
})(); 