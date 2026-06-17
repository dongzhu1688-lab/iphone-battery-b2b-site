const categories = [
  { slug: "original-cell", label: "iPhone battery(original cell)" },
  { slug: "diagnostic", label: "iPhone battery(original cell) diagnostic" },
  { slug: "pulled-original", label: "iPhone battery(pulled original)" },
];

const orderSeries = (series) => {
  if (series === "X series") return 10;
  if (series === "SE series") return 10.5;
  return Number.parseInt(series, 10) || 99;
};

const state = {
  products: [],
  category: "all",
  series: "all",
  search: "",
  sort: "series",
  cart: new Map(),
};

const money = (value) => `$${value.toFixed(2)}`;
const WHATSAPP_NUMBER = "8613558057005";

const byId = (id) => document.getElementById(id);
const whatsappUrl = (message) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
const openWhatsApp = (message) => window.open(whatsappUrl(message), "_blank", "noopener");

async function boot() {
  state.products = await fetch("src/products.json").then((response) => response.json());
  renderNav();
  renderCategoryCards();
  renderFilters();
  renderProducts();
  bindEvents();
  renderCart();
}

function productsForCategory(slug) {
  return state.products.filter((product) => product.categorySlug === slug);
}

function seriesForProducts(products) {
  return [...new Set(products.map((product) => product.series))]
    .sort((a, b) => orderSeries(a) - orderSeries(b));
}

function renderNav() {
  byId("desktopNav").innerHTML = categories.map((category) => {
    const products = productsForCategory(category.slug);
    const seriesMarkup = seriesForProducts(products).map((series) => {
      const links = products
        .filter((product) => product.series === series)
        .map((product) => `<a href="#catalog" data-jump="${product.categorySlug}" data-series="${product.series}" data-model="${product.model}">${product.model}</a>`)
        .join("");
      return `<div class="mega-series"><strong>${series}</strong>${links}</div>`;
    }).join("");

    return `
      <div class="nav-item">
        <button class="nav-trigger" type="button" data-cat="${category.slug}">${category.label}</button>
        <div class="mega-menu">${seriesMarkup}</div>
      </div>
    `;
  }).join("");
}

function renderCategoryCards() {
  byId("categoryGrid").innerHTML = categories.map((category) => {
    const products = productsForCategory(category.slug);
    return `
      <article class="category-card">
        <h3>${category.label}</h3>
        <div class="series-list">
          ${seriesForProducts(products).map((series) => `<button class="chip" type="button" data-cat="${category.slug}" data-series="${series}">${series}</button>`).join("")}
        </div>
      </article>
    `;
  }).join("");
}

function renderFilters() {
  byId("categoryFilters").innerHTML = [
    `<button class="chip active" type="button" data-cat-filter="all">All</button>`,
    ...categories.map((category) => `<button class="chip" type="button" data-cat-filter="${category.slug}">${category.label.replace("iPhone battery", "")}</button>`),
  ].join("");
  updateSeriesFilters();
}

function updateSeriesFilters() {
  const pool = state.category === "all" ? state.products : productsForCategory(state.category);
  const series = seriesForProducts(pool);
  if (state.series !== "all" && !series.includes(state.series)) state.series = "all";
  byId("seriesFilters").innerHTML = [
    `<button class="chip ${state.series === "all" ? "active" : ""}" type="button" data-series-filter="all">All</button>`,
    ...series.map((item) => `<button class="chip ${state.series === item ? "active" : ""}" type="button" data-series-filter="${item}">${item}</button>`),
  ].join("");
}

function filteredProducts() {
  let products = [...state.products];
  if (state.category !== "all") products = products.filter((product) => product.categorySlug === state.category);
  if (state.series !== "all") products = products.filter((product) => product.series === state.series);
  if (state.search) {
    const needle = state.search.toLowerCase().replace(/\s/g, "");
    products = products.filter((product) => product.model.toLowerCase().replace(/\s/g, "").includes(needle));
  }
  products.sort((a, b) => {
    if (state.sort === "price-asc") return a.price - b.price;
    if (state.sort === "price-desc") return b.price - a.price;
    return orderSeries(a.series) - orderSeries(b.series) || a.model.localeCompare(b.model);
  });
  return products;
}

function renderProducts() {
  const products = filteredProducts();
  byId("catalogTitle").textContent = state.category === "all"
    ? "All products"
    : categories.find((category) => category.slug === state.category)?.label || "Products";
  byId("catalogMeta").textContent = `${products.length} SKUs shown. Prices from attached Excel files, USD per unit.`;
  byId("productGrid").innerHTML = products.map((product) => `
    <article class="product-card" id="${product.id}">
      <div class="product-image">
        <img src="${product.image}" alt="${product.categoryName} ${product.model}" />
      </div>
      <div class="product-info">
        <div class="product-topline"><span>${product.badge}</span><span>${product.series}</span></div>
        <h3>${product.model}</h3>
        <p>${product.categoryName}</p>
        <p>MOQ ${product.moq} pcs · Lead time ${product.leadTime}</p>
        <div class="price-row">
          <span class="price">${money(product.price)}</span>
          <div class="product-actions">
            <button class="small-button" type="button" data-add="${product.id}">Add to cart</button>
            <button class="whatsapp-mini" type="button" data-whatsapp-product="${product.id}">WhatsApp</button>
          </div>
        </div>
      </div>
    </article>
  `).join("");
}

function setCategory(category, series = "all") {
  state.category = category;
  state.series = series;
  updateActiveChips();
  updateSeriesFilters();
  renderProducts();
}

function updateActiveChips() {
  document.querySelectorAll("[data-cat-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.catFilter === state.category);
  });
}

function addToCart(id) {
  const product = state.products.find((item) => item.id === id);
  if (!product) return;
  const existing = state.cart.get(id);
  state.cart.set(id, { product, qty: existing ? existing.qty + product.moq : product.moq });
  renderCart();
  byId("cartDrawer").classList.add("open");
  byId("cartDrawer").setAttribute("aria-hidden", "false");
}

function renderCart() {
  const entries = [...state.cart.values()];
  const units = entries.reduce((sum, entry) => sum + entry.qty, 0);
  const total = entries.reduce((sum, entry) => sum + entry.qty * entry.product.price, 0);
  byId("cartCount").textContent = entries.length;
  byId("cartUnits").textContent = units;
  byId("cartTotal").textContent = money(total);
  byId("cartItems").innerHTML = entries.length ? entries.map(({ product, qty }) => `
    <div class="cart-row">
      <div>
        <strong>${product.model}</strong>
        <span>${product.categoryName}</span>
        <span>${money(product.price)} / unit</span>
      </div>
      <div class="qty-control">
        <button type="button" data-dec="${product.id}">−</button>
        <strong>${qty}</strong>
        <button type="button" data-inc="${product.id}">+</button>
      </div>
    </div>
  `).join("") : `<p>Your cart is empty. Add models from the catalog.</p>`;
  renderPayPal(total);
}

function renderPayPal(total) {
  const holder = byId("paypalButtons");
  holder.innerHTML = "";
  if (!total || !window.paypal) {
    holder.innerHTML = `<button class="primary-button full" type="button" disabled>PayPal checkout</button>`;
    return;
  }
  window.paypal.Buttons({
    style: { layout: "vertical", color: "blue", shape: "rect", label: "paypal" },
    createOrder: (data, actions) => actions.order.create({
      purchase_units: [{ amount: { value: total.toFixed(2), currency_code: "USD" } }],
    }),
    onApprove: async (data, actions) => {
      await actions.order.capture();
      state.cart.clear();
      renderCart();
      alert("Payment captured in PayPal sandbox. Tom Zhu will follow up with order details.");
    },
  }).render(holder);
}

function cartText() {
  const entries = [...state.cart.values()];
  if (!entries.length) return "No cart items selected.";
  return entries.map(({ product, qty }) => `${product.model} | ${product.categoryName} | ${qty} pcs | ${money(product.price)}/unit`).join("\n");
}

function cartTotal() {
  return [...state.cart.values()].reduce((sum, entry) => sum + entry.qty * entry.product.price, 0);
}

function productWhatsAppMessage(product) {
  return [
    "Hello Tom, I am interested in this iPhone battery:",
    `Model: ${product.model}`,
    `Category: ${product.categoryName}`,
    `Series: ${product.series}`,
    `Unit price: ${money(product.price)}`,
    `MOQ: ${product.moq} pcs`,
    "",
    "Please confirm stock, shipping cost, and payment method.",
  ].join("\n");
}

function cartWhatsAppMessage(paymentMethod = "WhatsApp order") {
  return [
    `Hello Tom, I want to place an iPhone battery order via ${paymentMethod}.`,
    "",
    "Order items:",
    cartText(),
    "",
    `Total: ${money(cartTotal())}`,
    "",
    "Please confirm stock, shipping cost, and the final payment details.",
  ].join("\n");
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, a");
    if (!target) return;
    if (target.dataset.cat) {
      setCategory(target.dataset.cat, target.dataset.series || "all");
      byId("desktopNav").classList.remove("open");
    }
    if (target.dataset.jump) {
      setCategory(target.dataset.jump, target.dataset.series || "all");
      byId("searchInput").value = target.dataset.model || "";
      state.search = target.dataset.model || "";
      renderProducts();
    }
    if (target.dataset.catFilter) setCategory(target.dataset.catFilter);
    if (target.dataset.seriesFilter) {
      state.series = target.dataset.seriesFilter;
      updateSeriesFilters();
      renderProducts();
    }
    if (target.dataset.add) addToCart(target.dataset.add);
    if (target.dataset.whatsappProduct) {
      const product = state.products.find((item) => item.id === target.dataset.whatsappProduct);
      if (product) openWhatsApp(productWhatsAppMessage(product));
    }
    if (target.dataset.inc || target.dataset.dec) {
      const id = target.dataset.inc || target.dataset.dec;
      const entry = state.cart.get(id);
      if (!entry) return;
      entry.qty += target.dataset.inc ? entry.product.moq : -entry.product.moq;
      if (entry.qty <= 0) state.cart.delete(id);
      renderCart();
    }
  });

  byId("searchInput").addEventListener("input", (event) => {
    state.search = event.target.value;
    renderProducts();
  });
  byId("sortSelect").addEventListener("change", (event) => {
    state.sort = event.target.value;
    renderProducts();
  });
  byId("menuToggle").addEventListener("click", () => byId("desktopNav").classList.toggle("open"));
  byId("cartOpen").addEventListener("click", () => {
    byId("cartDrawer").classList.add("open");
    byId("cartDrawer").setAttribute("aria-hidden", "false");
  });
  byId("cartClose").addEventListener("click", () => {
    byId("cartDrawer").classList.remove("open");
    byId("cartDrawer").setAttribute("aria-hidden", "true");
  });
  byId("cartToWhatsApp").addEventListener("click", () => {
    openWhatsApp(cartWhatsAppMessage());
  });
  byId("alipayCheckout").addEventListener("click", () => {
    openWhatsApp(cartWhatsAppMessage("Alipay payment"));
  });

  window.addEventListener("load", () => renderCart());
}

boot();
