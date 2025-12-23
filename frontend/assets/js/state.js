// --- Constants & State ---
let activeUser = null;
let activeRole = null; // "user" | "business"

// mode + role selection
let authMode = "login";  // "login" | "register"
let authRole = "user";   // "user" | "business"

let users = {};
let businesses = {}; // { password, businessName, city, district, neighborhood, addressDetail, phone }
let products = [];
let cart = [];
let nextProductId = 1;

/**
 * NEW ORDER MODEL:
 * orders = [
 *   {
 *     orderId: number,
 *     userUsername: string,
 *     userEmail: string,
 *     businessUsername: string,
 *     businessName: string,
 *     status: "ACTIVE" | "DELIVERED",
 *     createdAt: ISO string,
 *     deliveredAt: ISO string|null,
 *     items: [{ productId, description, quantity, price, type }]
 *   }
 * ]
 */
let orders = [];
let nextOrderId = 1001;

// --- QR Scan runtime state ---
let scanStream = null;
let scanLoopTimer = null;
let lastScannedPayload = null; // parsed object
let lastMatchedOrderIds = [];  // for confirm


/* =========================
   City/District/Neighborhood dataset
   ========================= */
const TR_LOCATIONS = {
  "ANKARA": {
    "CANKAYA": ["KIZILAY", "BAHÇELİEVLER", "GOP", "AYRANCI", "CEBECI"],
    "KECIOREN": ["ETLIK", "BAĞLARBAŞI", "ŞENLİK"],
    "YENIMAHALLE": ["BATIKENT", "DEMETEVLER", "ÇAYYOLU"]
  },
  "ISTANBUL": {
    "KADIKOY": ["MODA", "FENERBAHÇE", "KOZYATAĞI", "BOSTANCI"],
    "BESIKTAS": ["LEVENT", "ETILER", "BEBEK", "ORTAKOY"],
    "SISLI": ["MECIDIYEKOY", "NISANTASI", "ESENTEPE"]
  },
  "IZMIR": {
    "KONAK": ["ALSANCAK", "GÜZELYALI", "GÜLTEPE"],
    "BORNOVA": ["KAZIMDIRIK", "ERGENE", "EVKA-3"],
    "KARSIYAKA": ["BOSTANLI", "ALAYBEY", "MAVISEHIR"]
  }
};
