// frontend/src/services/api.js
const BASE_URL = "http://localhost:5000/api";

export const api = {
  getMenu: () => fetch(`${BASE_URL}/menu`).then((res) => res.json()),
  getOrders: () => fetch(`${BASE_URL}/orders`).then((res) => res.json()),
  createOrder: (data) =>
    fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then((res) => res.json()),
  updateStatus: (id, status) =>
    fetch(`${BASE_URL}/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    }).then((res) => res.json()),
  deleteOrder: (id) =>
    fetch(`${BASE_URL}/orders/${id}`, { method: "DELETE" }).then((res) => res.json())
};