import { buildRmaDocDefinition, buildWaDocDefinition, buildPcbaDocDefinition, generatePdfBuffer } from '../server/pdfService.js';
import fs from 'fs';

async function testPdfSuite() {
  console.log('--- 1. Testing Empty Datasets ---');
  const rmaEmpty = await generatePdfBuffer(buildRmaDocDefinition([], 'Total: 0'));
  const waEmpty = await generatePdfBuffer(buildWaDocDefinition([], 'Total: 0'));
  const pcbaEmpty = await generatePdfBuffer(buildPcbaDocDefinition([], 'stock', 'Total: 0'));
  console.log('✓ Empty PDFs generated:', rmaEmpty.length, waEmpty.length, pcbaEmpty.length);

  console.log('--- 2. Testing 1-Page Normal Datasets ---');
  const rmaSample = [
    { ticketNo: 'RMA-20260901-001', receivedDate: '2026-09-01', status: 'Selesai', engineer: 'Yusuf', customerName: 'PT Maju Bersama', product: 'G08ID', sn: 'HSGQ123456', mac: 'AA:BB:CC:DD:EE:FF', initialProblem: 'LOS LED merah berkedip', actionTaken: 'Ganti modul optical BOSA', warrantyStatus: 'In Warranty', shippedDate: '2026-09-03', shipping: 'EXPEDISI' },
    { ticketNo: 'RMA-20260902-002', receivedDate: '2026-09-02', status: 'Sedang Dicek', engineer: 'Danang', customerName: 'Bapak Ahmad', company: 'CV Citra Net', product: 'E04ID', sn: 'HSGQ654321', mac: '11:22:33:44:55:66', initialProblem: 'Power supply drop saat load', actionTaken: 'Pengecekan voltase regulator 12V', warrantyStatus: 'Out of Warranty', shipping: 'CJA JAKARTA' }
  ];
  const rmaPdf = await generatePdfBuffer(buildRmaDocDefinition(rmaSample, 'Total Data: 2'));
  console.log('✓ RMA sample PDF generated:', rmaPdf.length);

  const waSample = [
    { caseNo: 'WA-20260901-001', caseDate: '2026-09-01', status: 'Selesai', engineerTag: 'Danang', customerName: 'Fajar', customerPhone: '0812345678', company: 'PT Solusi Data', deviceType: 'OLT EPON 4 Port', sn: 'SN9988', mac: '00:11:22:33', initialProblem: 'Tidak bisa login web management', finalAnalysis: 'Reset password admin via console serial port berhasil', solvedDate: '2026-09-01' },
    { caseNo: 'WA-20260902-002', caseDate: '2026-09-02', status: 'FU Tim China', engineerTag: 'Aris', customerName: 'Budi Santoso', customerPhone: '0898765432', company: 'ISP Global', deviceType: 'OLT GPON 8 Port', sn: 'SN7766', mac: '44:55:66:77', initialProblem: 'Firmware upgrade gagal di 85%', finalAnalysis: 'Meminta file recovery image BIN langsung dari HQ engineer', solvedDate: '' }
  ];
  const waPdf = await generatePdfBuffer(buildWaDocDefinition(waSample, 'Total Data: 2'));
  console.log('✓ WA sample PDF generated:', waPdf.length);

  const pcbaStockSample = [
    { serialNo: 'PCBA-G08ID-001', pcbaType: 'G08ID', status: 'Good', supplier: 'HSGQ HQ (China)', warehouseLocation: 'Gudang Jakarta', receivedDate: '2026-08-15', receivedBy: 'Yusuf', notes: 'Kondisi prima siap pakai' },
    { serialNo: 'PCBA-E04ID-002', pcbaType: 'E04ID', status: 'Bad', supplier: 'Supplier Lokal', warehouseLocation: 'Gudang Surabaya', receivedDate: '2026-08-20', receivedBy: 'Danang', notes: 'Short circuit di port uplink' }
  ];
  const pcbaStockPdf = await generatePdfBuffer(buildPcbaDocDefinition(pcbaStockSample, 'stock', 'Sub-tab: STOCK | Total Data: 2'));
  console.log('✓ PCBA Stock PDF generated:', pcbaStockPdf.length);

  const pcbaRepSample = [
    { replacementNo: 'REP-20260901-001', rmaTicketNo: 'RMA-20260901-001', oldSerialNo: 'PCBA-OLD-01', pcbaType: 'G08ID', newSerialNo: 'PCBA-NEW-02', chinaStatus: 'Sent', replacedBy: 'Yusuf', replacedAt: '2026-09-01', notes: 'Ganti motherboard' }
  ];
  const pcbaRepPdf = await generatePdfBuffer(buildPcbaDocDefinition(pcbaRepSample, 'replacements', 'Sub-tab: REPLACEMENTS | Total Data: 1'));
  console.log('✓ PCBA Replacements PDF generated:', pcbaRepPdf.length);

  console.log('--- 3. Testing Multi-Page Large Dataset (100 rows) ---');
  const largeRma = [];
  for (let i = 1; i <= 100; i++) {
    largeRma.push({
      ticketNo: 'RMA-20260903-' + String(i).padStart(3, '0'),
      receivedDate: '2026-09-03',
      status: i % 3 === 0 ? 'Selesai' : i % 3 === 1 ? 'Sedang Dicek' : 'Menunggu',
      engineer: 'Teknisi ' + (i % 5),
      customerName: 'Customer MultiPage ' + i,
      company: 'PT Client Number ' + i,
      product: 'G08ID V3',
      sn: 'SN-HSGQ-' + i,
      mac: 'AA:BB:CC:' + String(i).padStart(2, '0'),
      initialProblem: 'Kendala deskripsi panjang baris ke-' + i + ' pada pengujian laporan multi halaman',
      actionTaken: 'Tindakan teknis terperinci untuk unit baris ke-' + i,
      warrantyStatus: 'In Warranty',
      shippedDate: '2026-09-05',
      shipping: 'EXPEDISI'
    });
  }
  const largePdf = await generatePdfBuffer(buildRmaDocDefinition(largeRma, 'Total Data: 100 baris'));
  console.log('✓ Large Multi-Page PDF generated! Buffer length:', largePdf.length);
  console.log('\n🎉 ALL PDF GENERATION TESTS PASSED 100%!');
}

testPdfSuite().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
