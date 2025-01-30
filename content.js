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
             <a href="https://github.com/zxkmm/firefox_plugin_deepseek_helper" 
             id="github-link" 
             target="_blank">
            Please give me some support by starring my GitHub repo, it means a lot to me! Thank you!
          </a>
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
    document.body.insertAdjacentHTML("beforeend", sidebarHTML);
    console.log("Sidebar HTML inserted");
  }

  initElememts() {
    this.itemsList = document.getElementById("items-list");
    this.addButton = document.getElementById("add-button");
    this.addDialog = document.getElementById("add-dialog");
    this.dialogOverlay = document.getElementById("dialog-overlay");
    this.titleInput = document.getElementById("title-input");
    this.contentInput = document.getElementById("content-input");
    this.saveButton = document.getElementById("save-button");
    this.cancelButton = document.getElementById("cancel-button");

    console.log("Elements initialized:", {
      itemsList: this.itemsList,
      addButton: this.addButton,
      addDialog: this.addDialog,
    });
  }

  initListener() {
    this.addButton.addEventListener("click", () => this.showAddDialog());
    this.saveButton.addEventListener("click", () => this.saveItem());
    this.cancelButton.addEventListener("click", () => this.hideAddDialog());
  }

  async loadItems() {
    const result = await browser.storage.sync.get("items");
    const items = result.items || [];
    this.drawItems(items);
  }

  drawItems(items) {
    this.itemsList.innerHTML = "";
    items.forEach((item, index) => {
      const itemElement = document.createElement("div");
      itemElement.className = "item";
      itemElement.innerHTML = `
        <span class="item-title">${item.title}</span>
        <div class="item-buttons">
          <span class="edit-button">✏️</span>
          <span class="delete-button">🗑️</span>
        </div>
      `;

      itemElement.querySelector(".item-title").addEventListener("click", () => {
        this.insertContent(item.content);
      });

      itemElement
        .querySelector(".edit-button")
        .addEventListener("click", (e) => {
          e.stopPropagation();
          this.showEditDialog(item, index);
        });

      itemElement
        .querySelector(".delete-button")
        .addEventListener("click", async (e) => {
          e.stopPropagation();
          await this.deleteItem(index);
        });

      this.itemsList.appendChild(itemElement);
    });
  }

  showAddDialog() {
    this.currentEditIndex = null;
    this.dialogOverlay.classList.remove("hidden");
    this.addDialog.classList.remove("hidden");
    this.titleInput.value = "";
    this.contentInput.value = "";
    this.saveButton.textContent = "save";
  }

  showEditDialog(item, index) {
    this.currentEditIndex = index;
    this.dialogOverlay.classList.remove("hidden");
    this.addDialog.classList.remove("hidden");
    this.titleInput.value = item.title;
    this.contentInput.value = item.content;
    this.saveButton.textContent = "update";
  }

  hideAddDialog() {
    this.dialogOverlay.classList.add("hidden");
    this.addDialog.classList.add("hidden");
    this.currentEditIndex = null;
  }

  async saveItem() {
    const title = this.titleInput.value.trim();
    const content = this.contentInput.value;

    if (!title || !content) return;

    const result = await browser.storage.sync.get("items");
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
    const result = await browser.storage.sync.get("items");
    const items = result.items || [];
    items.splice(index, 1);
    await browser.storage.sync.set({ items });
    this.drawItems(items);
  }

  async insertContent(content) {
    // find
    const findInput = async (retries = 100, interval = 10) => {
      for (let i = 0; i < retries; i++) {
        const input = document.getElementById("chat-input");
        if (input) return input;
        await new Promise((resolve) => setTimeout(resolve, interval));
      }
      return null;
    };

    // set text
    const setInputValue = async (input, retries = 10) => {
      for (let i = 0; i < retries; i++) {
        input.value = content;
        input.dispatchEvent(new Event("input", { bubbles: true }));

        // verify
        if (input.value === content) return true;
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return false;
    };

    // paste
    const tryPasteContent = async (input, retries = 10) => {
      for (let i = 0; i < retries; i++) {
        try {
          await navigator.clipboard.writeText(content);
          input.focus();
          document.execCommand("paste");

          // verify
          if (input.value === content) return true;
        } catch (error) {
          console.error("paste failed:", error);
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return false;
    };

    const showToast = (message) => {
      const toast = document.createElement("div");
      toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 4px;
        z-index: 10000;
      `;
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);
    };

    // main worker
    const input = await findInput();
    if (!input) {
      showToast("did not find input box to input");
      return;
    }

    // try set text
    if (await setInputValue(input)) {
      return;
    }

    // try paste
    if (await tryPasteContent(input)) {
      return;
    }

    // all failed
    showToast("content insert failed");
  }
}

function initializeSidebar() {
  if (document.readyState === "complete") {
    new FloatingSidebar();
  } else {
    console.log("Document not ready, waiting...");
    window.addEventListener("load", () => {
      new FloatingSidebar();
    });
  }
}

(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new FloatingSidebar());
  } else {
    new FloatingSidebar();
  }
})();
