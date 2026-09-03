/**
 * src/i18n/options.js
 * Canonical status, role, and option dictionary for HSGQ RMA System.
 * Translates backend canonical data into display strings for id, en, and zh.
 * IMPORTANT: NEVER mutate the original canonical database values.
 */

export const OPTION_DICT = {
  // --- RMA & WhatsApp Canonical Statuses ---
  "unit diterima": { id: "Unit Diterima", en: "Unit Received", zh: "已接收" },
  "unit received": { id: "Unit Diterima", en: "Unit Received", zh: "已接收" },
  "diterima": { id: "Unit Diterima", en: "Unit Received", zh: "已接收" },

  "sedang dicek": { id: "Sedang Dicek", en: "Checking", zh: "检测中" },
  "on checking": { id: "Sedang Dicek", en: "Checking", zh: "检测中" },
  "checking": { id: "Sedang Dicek", en: "Checking", zh: "检测中" },
  "dicek": { id: "Sedang Dicek", en: "Checking", zh: "检测中" },

  "menunggu": { id: "Menunggu", en: "Waiting", zh: "等待中" },
  "waiting": { id: "Menunggu", en: "Waiting", zh: "等待中" },

  "sedang diperbaiki": { id: "Sedang Diperbaiki", en: "Under Repair", zh: "维修中" },
  "repairing": { id: "Sedang Diperbaiki", en: "Under Repair", zh: "维修中" },
  "under repair": { id: "Sedang Diperbaiki", en: "Under Repair", zh: "维修中" },
  "diperbaiki": { id: "Sedang Diperbaiki", en: "Under Repair", zh: "维修中" },

  "qc/testing": { id: "QC/Testing", en: "QC/Testing", zh: "质检/测试" },
  "qc / testing": { id: "QC/Testing", en: "QC/Testing", zh: "质检/测试" },
  "testing": { id: "QC/Testing", en: "QC/Testing", zh: "质检/测试" },

  "ready to ship": { id: "Siap Dikirim", en: "Ready to Ship", zh: "待发货" },
  "siap dikirim": { id: "Siap Dikirim", en: "Ready to Ship", zh: "待发货" },
  "akan dikirim kembali ke customer": { id: "Akan Dikirim Kembali ke Customer", en: "Will Be Sent Back to Customer", zh: "将退回客户" },
  "akan dikirim kembali": { id: "Akan Dikirim Kembali ke Customer", en: "Will Be Sent Back to Customer", zh: "将退回客户" },
  "will be sent back to customer": { id: "Akan Dikirim Kembali ke Customer", en: "Will Be Sent Back to Customer", zh: "将退回客户" },
  "dikirim kembali ke customer": { id: "Dikirim Kembali ke Customer", en: "Sent Back to Customer", zh: "已退回客户" },

  "shipped": { id: "Dikirim", en: "Shipped", zh: "已发货" },
  "dikirim": { id: "Dikirim", en: "Shipped", zh: "已发货" },

  "customer received": { id: "Diterima Customer", en: "Customer Received", zh: "客户已收货" },
  "diterima customer": { id: "Diterima Customer", en: "Customer Received", zh: "客户已收货" },

  "selesai": { id: "Selesai", en: "Completed", zh: "已完成" },
  "completed": { id: "Selesai", en: "Completed", zh: "已完成" },

  "closed": { id: "Ditutup", en: "Closed", zh: "已关闭" },
  "ditutup": { id: "Ditutup", en: "Closed", zh: "已关闭" },

  "on progress": { id: "On Progress", en: "In Progress", zh: "进行中" },
  "in progress": { id: "On Progress", en: "In Progress", zh: "进行中" },
  "sedang berjalan": { id: "On Progress", en: "In Progress", zh: "进行中" },

  "fu tim china": { id: "FU Tim China", en: "China Team Follow-up", zh: "中国团队跟进" },
  "fu china": { id: "FU Tim China", en: "China Team Follow-up", zh: "中国团队跟进" },
  "china team follow-up": { id: "FU Tim China", en: "China Team Follow-up", zh: "中国团队跟进" },
  "follow-up china team": { id: "FU Tim China", en: "China Team Follow-up", zh: "中国团队跟进" },
  "follow-up tim china": { id: "FU Tim China", en: "China Team Follow-up", zh: "中国团队跟进" },

  "belum ditag": { id: "Belum Ditag", en: "Not Tagged", zh: "尚未标记" },
  "belum ditandai": { id: "Belum Ditandai", en: "Not Tagged", zh: "尚未标记" },
  "not tagged": { id: "Belum Ditag", en: "Not Tagged", zh: "尚未标记" },

  "pending": { id: "Pending", en: "Pending", zh: "待处理" },
  "repaired": { id: "Repaired", en: "Repaired", zh: "已修复" },

  // --- PCBA Canonical Statuses ---
  "good": { id: "Good", en: "Good", zh: "良品" },
  "bad": { id: "Bad", en: "Bad", zh: "不良品" },
  "used for replacement": { id: "Digunakan Penggantian", en: "Used for Replacement", zh: "用于替换" },
  "digunakan penggantian": { id: "Digunakan Penggantian", en: "Used for Replacement", zh: "用于替换" },
  "scrap": { id: "Scrap", en: "Scrap", zh: "报废" },
  "scrapped": { id: "Scrap", en: "Scrapped", zh: "已报废" },
  "sent": { id: "Terkirim", en: "Sent", zh: "已寄送" },
  "sent to china": { id: "Dikirim ke China", en: "Sent to China", zh: "已寄送中国" },
  "kirim ke china": { id: "Dikirim ke China", en: "Sent to China", zh: "已寄送中国" },

  // --- PCBA Transaction Types ---
  "goods receipt": { id: "Terima PCBA Baru", en: "Goods Receipt", zh: "收货入库" },
  "goods receipt (stok baru)": { id: "Terima PCBA Baru (Stok)", en: "Goods Receipt (New Stock)", zh: "收货入库（新库存）" },
  "terima pcba baru": { id: "Terima PCBA Baru", en: "Goods Receipt", zh: "收货入库" },
  "replacement": { id: "Replacement", en: "Replacement", zh: "更换" },
  "replacement pcba": { id: "Replacement PCBA", en: "PCBA Replacement", zh: "PCBA 更换" },
  "send bad pcba to china": { id: "Kirim PCBA Bad ke China", en: "Send Bad PCBA to China", zh: "寄送不良 PCBA 至中国" },
  "kirim pcba bad ke china": { id: "Kirim PCBA Bad ke China", en: "Send Bad PCBA to China", zh: "寄送不良 PCBA 至中国" },

  // --- QC & Test Results ---
  "passed": { id: "Pass", en: "Passed", zh: "通过" },
  "pass": { id: "Pass", en: "Pass", zh: "通过" },
  "failed": { id: "Fail", en: "Failed", zh: "未通过" },
  "fail": { id: "Fail", en: "Fail", zh: "未通过" },

  // --- Final Results & Actions (Hasil Akhir & Tindakan) ---
  "normal": { id: "Normal", en: "Normal", zh: "正常" },
  "repair": { id: "Repair", en: "Repair", zh: "维修" },
  "replace": { id: "Replace", en: "Replace", zh: "更换" },
  "replace pcba": { id: "Replace PCBA", en: "Replace PCBA", zh: "更换 PCBA" },
  "replace unit": { id: "Replace Unit", en: "Replace Unit", zh: "更换整机" },
  "service": { id: "Service", en: "Service", zh: "维修保养" },
  "return": { id: "Return", en: "Return", zh: "退回" },
  "tidak dapat diperbaiki": { id: "Tidak Dapat Diperbaiki", en: "Cannot be Repaired", zh: "无法维修" },
  "cannot be repaired": { id: "Tidak Dapat Diperbaiki", en: "Cannot be Repaired", zh: "无法维修" },
  "rejected": { id: "Rejected", en: "Rejected", zh: "已拒绝" },
  "berhasil diperbaiki": { id: "Berhasil Diperbaiki", en: "Successfully Repaired", zh: "维修成功" },
  "successfully repaired": { id: "Berhasil Diperbaiki", en: "Successfully Repaired", zh: "维修成功" },
  "perlu follow-up tim china": { id: "Perlu Follow-up Tim China", en: "Follow-up China Team Needed", zh: "需要中国团队跟进" },
  "return to principal": { id: "Return to Principal", en: "Return to Principal", zh: "退回原厂" },

  // --- Waiting Reasons (Alasan Menunggu) ---
  "spare part": { id: "Spare Part", en: "Spare Part", zh: "备件" },
  "pending spare": { id: "Pending Spare", en: "Pending Spare", zh: "等待备件" },
  "menunggu spare part": { id: "Pending Spare", en: "Pending Spare", zh: "等待备件" },
  "firmware": { id: "Firmware", en: "Firmware", zh: "固件" },
  "hq / china": { id: "HQ / China", en: "HQ / China", zh: "总部 / 中国" },
  "customer information": { id: "Customer Information", en: "Customer Information", zh: "客户信息" },
  "informasi customer": { id: "Customer Information", en: "Customer Information", zh: "客户信息" },
  "other": { id: "Other", en: "Other", zh: "其他" },
  "lainnya": { id: "Other", en: "Other", zh: "其他" },

  // --- Warranty Statuses ---
  "in warranty": { id: "In Warranty", en: "In Warranty", zh: "保修期内" },
  "dalam garansi": { id: "In Warranty", en: "In Warranty", zh: "保修期内" },
  "garansi ada": { id: "In Warranty", en: "In Warranty", zh: "保修期内" },
  "out of warranty": { id: "Out of Warranty", en: "Out of Warranty", zh: "过保" },
  "habis garansi": { id: "Out of Warranty", en: "Out of Warranty", zh: "过保" },
  "garansi habis": { id: "Out of Warranty", en: "Out of Warranty", zh: "过保" },
  "warranty unknown": { id: "Warranty Unknown", en: "Warranty Unknown", zh: "保修未知" },
  "garansi tidak diketahui": { id: "Warranty Unknown", en: "Warranty Unknown", zh: "保修未知" },
  "belum diisi": { id: "Belum diisi", en: "Not specified", zh: "未填写" },

  // --- Shipping Methods ---
  "expedisi": { id: "EXPEDISI", en: "Expedition", zh: "物流快递" },
  "cja jakarta": { id: "CJA JAKARTA", en: "CJA Jakarta", zh: "CJA 雅加达" },
  "cja surabaya": { id: "CJA SURABAYA", en: "CJA Surabaya", zh: "CJA 泗水" },

  // --- User Roles ---
  "administrator": { id: "Administrator", en: "Administrator", zh: "管理员" },
  "admin": { id: "Administrator", en: "Administrator", zh: "管理员" },
  "engineer": { id: "Engineer", en: "Engineer", zh: "工程师" },
  "teknisi": { id: "Engineer", en: "Engineer", zh: "工程师" },
  "viewer": { id: "Viewer", en: "Viewer", zh: "查看者" },

  // --- Account Statuses ---
  "active": { id: "Aktif", en: "Active", zh: "启用" },
  "aktif": { id: "Aktif", en: "Active", zh: "启用" },
  "inactive": { id: "Nonaktif", en: "Inactive", zh: "停用" },
  "nonaktif": { id: "Nonaktif", en: "Inactive", zh: "停用" },
};

/**
 * Resolves current language string from any input format
 */
function resolveLang(arg1, arg2) {
  if (typeof arg1 === "string" && ["id", "en", "zh"].includes(arg1)) return arg1;
  if (typeof arg2 === "string" && ["id", "en", "zh"].includes(arg2)) return arg2;
  if (arg1 && typeof arg1 === "object" && arg1._lang && ["id", "en", "zh"].includes(arg1._lang)) return arg1._lang;
  if (arg2 && typeof arg2 === "object" && arg2._lang && ["id", "en", "zh"].includes(arg2._lang)) return arg2._lang;
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("hsgq_language");
      if (saved && ["id", "en", "zh"].includes(saved)) return saved;
    } catch (_) {}
  }
  return "id";
}

/**
 * Get localized display string for an option / status.
 * Accepts flexible parameters: (val, lang), (val, t), (val, t, lang), or (val).
 * @param {string} val - Canonical value from DB or logic
 * @param {string|object} [arg1] - Language code ('id'|'en'|'zh') or translation dictionary
 * @param {string} [arg2] - Language code if arg1 is dictionary
 * @returns {string} Translated string or original value if not mapped
 */
export function getLocalizedOption(val, arg1, arg2) {
  if (val === null || val === undefined || val === "") return "—";
  const str = String(val).trim();
  const key = str.toLowerCase();
  const found = OPTION_DICT[key];
  if (!found) return str;

  const lang = resolveLang(arg1, arg2);
  return found[lang] || found.id || str;
}

export function getLocalizedStatus(status, arg1, arg2) {
  return getLocalizedOption(status, arg1, arg2);
}

export function getLocalizedRole(role, arg1, arg2) {
  return getLocalizedOption(role, arg1, arg2);
}
