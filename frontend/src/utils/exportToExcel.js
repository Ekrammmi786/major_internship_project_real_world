export const exportOrdersToCSV = (ordersList) => {
  if (!ordersList || ordersList.length === 0) {
    alert("No orders data available to export!");
    return;
  }

  const headers = ["Invoice ID", "Date", "Table No", "Items Summary", "Subtotal (₹)", "CGST 2.5% (₹)", "SGST 2.5% (₹)", "Grand Total (₹)", "Payment Method", "Status"];
  
  const rows = ordersList.map((order) => {
    const subtotal = order.items?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
    const cgst = (subtotal * 0.025).toFixed(2);
    const sgst = (subtotal * 0.025).toFixed(2);
    const total = Math.round(subtotal + Number(cgst) + Number(sgst));
    const itemsSummary = order.items?.map((i) => `${i.name} (${i.quantity})`).join(" | ") || "";

    return [
      `TRB-${order._id?.slice(-6).toUpperCase()}`,
      `"${new Date(order.createdAt || Date.now()).toLocaleString()}"`,
      order.tableNumber,
      `"${itemsSummary}"`,
      subtotal,
      cgst,
      sgst,
      total,
      order.paymentMethod || "N/A",
      order.status
    ];
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `RiceBowl_Sales_Report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};