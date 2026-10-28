"use strict";

const BOOKS = [
  { id: 1, title: "Atomic Habits", author: "James Clear", category: "Self-Help", price: 14.99, old: 22.0, rating: 4.9, from: "#3b82d4", to: "#2563b0" },
  { id: 2, title: "The Midnight Library", author: "Matt Haig", category: "Fiction", price: 12.99, old: 18.0, rating: 4.7, from: "#7c5cd8", to: "#5b21b6" },
  { id: 3, title: "Dune", author: "Frank Herbert", category: "Fiction", price: 10.99, old: 16.0, rating: 4.8, from: "#d97706", to: "#92400e" },
  { id: 4, title: "Sapiens", author: "Yuval Noah Harari", category: "History", price: 13.99, old: 20.0, rating: 4.8, from: "#10b981", to: "#065f46" },
  { id: 5, title: "Project Hail Mary", author: "Andy Weir", category: "Science", price: 15.99, old: 24.0, rating: 4.9, from: "#ef4444", to: "#b91c1c" },
  { id: 6, title: "Clean Code", author: "Robert C. Martin", category: "Technology", price: 29.99, old: 45.0, rating: 4.6, from: "#0ea5e9", to: "#0369a1" },
  { id: 7, title: "Cosmos", author: "Carl Sagan", category: "Science", price: 11.5, old: 17.0, rating: 4.8, from: "#4f46e5", to: "#312e81" },
  { id: 8, title: "The Very Hungry Caterpillar", author: "Eric Carle", category: "Children", price: 8.99, old: 12.0, rating: 4.9, from: "#65a30d", to: "#3f6212" },
  { id: 9, title: "Salt Fat Acid Heat", author: "Samin Nosrat", category: "Cooking", price: 24.99, old: 35.0, rating: 4.8, from: "#ea580c", to: "#9a3412" },
  { id: 10, title: "The Design of Everyday Things", author: "Don Norman", category: "Art & Design", price: 17.99, old: 26.0, rating: 4.6, from: "#db2777", to: "#9d174d" }
];

const CATEGORIES = [
  { name: "Fiction", icon: "📖" },
  { name: "Science", icon: "🔬" },
  { name: "History", icon: "🏛️" },
  { name: "Self-Help", icon: "💡" },
  { name: "Children", icon: "🧒" },
  { name: "Cooking", icon: "🍳" },
  { name: "Technology", icon: "🖥️" },
  { name: "Art & Design", icon: "🎨" }
];

const STORAGE_KEY = "pageturner-cart";
const FREE_SHIPPING = 35;
const MAX_QTY = 99;
const fmt = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const state = { category: null, query: "", sort: "featured", cart: loadCart() };

const $ = (id) => document.getElementById(id);
const els = {
  booksGrid: $("booksGrid"), noResults: $("noResults"), featuredTitle: $("featuredTitle"),
  categoriesGrid: $("categoriesGrid"), clearFilters: $("clearFilters"),
  searchForm: $("searchForm"), searchInput: $("searchInput"), sortSelect: $("sortSelect"),
  menuToggle: $("menuToggle"), navDrawer: $("navDrawer"),
  cart: $("cart"), overlay: $("overlay"), cartToggle: $("cartToggle"), cartClose: $("cartClose"),
  cartItems: $("cartItems"), cartEmpty: $("cartEmpty"), cartTotal: $("cartTotal"),
  cartCount: $("cartCount"), checkout: $("checkout"), shipNote: $("shipNote"),
  newsletterForm: $("newsletterForm"), newsletterEmail: $("newsletterEmail"), newsletterMsg: $("newsletterMsg")
};

/* ---------- helpers ---------- */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function bookById(id) {
  return BOOKS.find((b) => b.id === id);
}

function loadCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(raw)) return [];
    // Never trust stored data: keep only valid ids and quantities
    return raw
      .filter((i) => i && Number.isInteger(i.id) && Number.isInteger(i.qty) && i.qty > 0 && i.qty <= MAX_QTY)
      .filter((i) => BOOKS.some((b) => b.id === i.id))
      .map((i) => ({ id: i.id, qty: i.qty }));
  } catch {
    return [];
  }
}

function saveCart() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.cart));
  } catch {
    /* storage unavailable: cart still works for this session */
  }
}

/* ---------- catalogue ---------- */
function visibleBooks() {
  const q = state.query.trim().toLowerCase();
  const list = BOOKS.filter(
    (b) =>
      (!state.category || b.category === state.category) &&
      (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
  );
  const sorters = {
    "price-asc": (a, b) => a.price - b.price,
    "price-desc": (a, b) => b.price - a.price,
    title: (a, b) => a.title.localeCompare(b.title)
  };
  if (sorters[state.sort]) list.sort(sorters[state.sort]);
  return list;
}

function stars(rating) {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(5 - full) + " " + rating.toFixed(1);
}

function renderCategories() {
  els.categoriesGrid.replaceChildren(
    ...CATEGORIES.map((c) => {
      const card = el("button", "category-card");
      card.type = "button";
      card.setAttribute("aria-pressed", String(c.name === state.category));
      card.append(el("div", "category-icon", c.icon), el("p", "", c.name));
      card.addEventListener("click", () => {
        state.category = state.category === c.name ? null : c.name;
        renderCategories();
        renderBooks();
        if (state.category) $("featured").scrollIntoView();
      });
      return card;
    })
  );
}

function renderBooks() {
  const books = visibleBooks();
  els.featuredTitle.textContent = state.category ? state.category : "Featured Books";
  els.noResults.hidden = books.length > 0;
  els.booksGrid.replaceChildren(
    ...books.map((b) => {
      const card = el("article", "book-card");
      const cover = el("div", "book-cover", b.title.charAt(0));
      cover.style.background = "linear-gradient(135deg," + b.from + "," + b.to + ")";
      cover.setAttribute("aria-hidden", "true");

      const info = el("div", "book-info");
      const rating = el("p", "rating", stars(b.rating));
      rating.setAttribute("aria-label", "Rated " + b.rating.toFixed(1) + " out of 5");
      const priceRow = el("div");
      priceRow.append(el("span", "price", fmt.format(b.price)), el("span", "price-old", fmt.format(b.old)));

      const add = el("button", "add-btn", "Add to Cart");
      add.type = "button";
      add.addEventListener("click", () => {
        addToCart(b.id);
        flashAdded(add);
      });

      info.append(el("h3", "", b.title), el("p", "author", b.author), rating, priceRow, add);
      card.append(cover, info);
      return card;
    })
  );
}

function flashAdded(btn) {
  btn.textContent = "✓ Added!";
  btn.classList.add("added");
  setTimeout(() => {
    btn.textContent = "Add to Cart";
    btn.classList.remove("added");
  }, 1500);
}

/* ---------- cart ---------- */
function addToCart(id) {
  const item = state.cart.find((i) => i.id === id);
  if (item) item.qty = Math.min(item.qty + 1, MAX_QTY);
  else state.cart.push({ id, qty: 1 });
  renderCart();
}

function changeQty(id, delta) {
  const item = state.cart.find((i) => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) state.cart = state.cart.filter((i) => i.id !== id);
  else item.qty = Math.min(item.qty, MAX_QTY);
  renderCart();
}

function removeItem(id) {
  state.cart = state.cart.filter((i) => i.id !== id);
  renderCart();
}

function renderCart() {
  saveCart();
  let total = 0;
  let count = 0;

  els.cartItems.replaceChildren(
    ...state.cart.map((i) => {
      const b = bookById(i.id);
      total += b.price * i.qty;
      count += i.qty;

      const dec = el("button", "", "−");
      dec.type = "button";
      dec.setAttribute("aria-label", "Decrease quantity of " + b.title);
      dec.addEventListener("click", () => changeQty(b.id, -1));
      const inc = el("button", "", "+");
      inc.type = "button";
      inc.setAttribute("aria-label", "Increase quantity of " + b.title);
      inc.addEventListener("click", () => changeQty(b.id, 1));
      const qty = el("div", "qty");
      qty.append(dec, el("span", "", String(i.qty)), inc);
      const rm = el("button", "remove", "Remove");
      rm.type = "button";
      rm.setAttribute("aria-label", "Remove " + b.title + " from cart");
      rm.addEventListener("click", () => removeItem(b.id));

      const li = el("li", "cart-item");
      li.append(el("strong", "", b.title), el("span", "price", fmt.format(b.price * i.qty)), qty, rm);
      return li;
    })
  );

  els.cartEmpty.hidden = state.cart.length > 0;
  els.cartTotal.textContent = fmt.format(total);
  els.cartCount.textContent = String(count);
  els.checkout.disabled = state.cart.length === 0;
  els.shipNote.textContent =
    state.cart.length === 0 ? "" :
    total >= FREE_SHIPPING ? "You qualify for free shipping." :
    "Add " + fmt.format(FREE_SHIPPING - total) + " more for free shipping.";
}

function openCart() {
  closeMenu();
  els.cart.classList.add("open");
  els.cart.setAttribute("aria-hidden", "false");
  els.overlay.hidden = false;
  els.cartClose.focus();
}

function closeCart() {
  els.cart.classList.remove("open");
  els.cart.setAttribute("aria-hidden", "true");
  els.overlay.hidden = true;
  els.cartToggle.focus();
}

/* ---------- mobile menu ---------- */
function closeMenu() {
  els.navDrawer.classList.remove("open");
  els.menuToggle.setAttribute("aria-expanded", "false");
}

els.menuToggle.addEventListener("click", () => {
  const open = els.navDrawer.classList.toggle("open");
  els.menuToggle.setAttribute("aria-expanded", String(open));
});
els.navDrawer.addEventListener("click", (e) => { if (e.target.tagName === "A") closeMenu(); });

/* ---------- events ---------- */
els.searchInput.addEventListener("input", (e) => { state.query = e.target.value; renderBooks(); });
els.searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  state.query = els.searchInput.value;
  renderBooks();
  $("featured").scrollIntoView();
});
els.sortSelect.addEventListener("change", (e) => { state.sort = e.target.value; renderBooks(); });
els.clearFilters.addEventListener("click", () => {
  state.category = null;
  state.query = "";
  state.sort = "featured";
  els.searchInput.value = "";
  els.sortSelect.value = "featured";
  renderCategories();
  renderBooks();
});

els.cartToggle.addEventListener("click", openCart);
els.cartClose.addEventListener("click", closeCart);
els.overlay.addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (els.cart.classList.contains("open")) closeCart();
  else closeMenu();
});
els.checkout.addEventListener("click", () => {
  state.cart = [];
  renderCart();
  closeCart();
  alert("Thanks for your order! (demo checkout)");
});

els.newsletterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = els.newsletterEmail.value.trim();
  const valid = email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  els.newsletterMsg.className = "form-msg " + (valid ? "ok" : "error");
  els.newsletterMsg.textContent = valid ? "Thanks for subscribing!" : "Please enter a valid email address.";
  if (valid) els.newsletterForm.reset();
});

/* ---------- init ---------- */
renderCategories();
renderBooks();
renderCart();
