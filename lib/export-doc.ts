/**
 * Tiện ích xuất văn bản Word chuẩn thể thức hành chính theo Nghị định 30/2020/NĐ-CP của Chính phủ.
 * Hỗ trợ tạo file .doc mở hoàn hảo trong MS Word, Google Docs, WPS Office với đầy đủ Quốc hiệu, Tiêu ngữ,
 * Cơ quan ban hành, Số ký hiệu, Bố cục La Mã và Bảng chữ ký chức danh.
 */

export interface ExportDocOptions {
  title: string;
  documentNumber?: string;
  schoolName: string;
  departmentName: string;
  location?: string;
  dateStr?: string;
  signerTitle?: string;
  signerName?: string;
  secretaryTitle?: string;
  secretaryName?: string;
  metaSummary?: string;
  sections?: {
    heading: string;
    content: string | string[];
    table?: {
      headers: string[];
      rows: (string | number)[][];
    };
  }[];
  notes?: string[];
}

function escapeXml(unsafe: any): string {
  return String(unsafe ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function generateDecree30WordHtml(opts: ExportDocOptions): string {
  const school = escapeXml(opts.schoolName || 'TRƯỜNG CỦA TÔI');
  const dept = escapeXml(opts.departmentName || 'TỔ CHUYÊN MÔN');
  const title = escapeXml(opts.title || 'VĂN BẢN TỔ CHUYÊN MÔN');
  const docNo = escapeXml(opts.documentNumber || 'Số: …/BB-TCM');
  const location = escapeXml(opts.location || 'Hà Nội');
  
  const now = new Date();
  const dateFormatted = opts.dateStr || `ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  
  const signerRole = escapeXml(opts.signerTitle || 'TỔ TRƯỞNG CHUYÊN MÔN');
  const signer = escapeXml(opts.signerName || 'Nguyễn Thị Mai');
  const secretaryRole = escapeXml(opts.secretaryTitle || 'THƯ KÝ CUỘC HỌP');
  const secretary = escapeXml(opts.secretaryName || 'Trần Thị Hương');

  let sectionsHtml = '';
  if (opts.sections && opts.sections.length > 0) {
    sectionsHtml = opts.sections.map(sec => {
      let contentBlock = '';
      if (Array.isArray(sec.content)) {
        contentBlock = sec.content.map(p => `<p class="Paragraph">• ${escapeXml(p)}</p>`).join('');
      } else if (sec.content) {
        contentBlock = `<p class="Paragraph">${escapeXml(sec.content).replaceAll('\n', '<br/>')}</p>`;
      }

      let tableBlock = '';
      if (sec.table && sec.table.headers.length > 0) {
        const headerCells = sec.table.headers.map(h => `<th>${escapeXml(h)}</th>`).join('');
        const bodyRows = sec.table.rows.map(row => {
          const cells = row.map(c => `<td>${escapeXml(c)}</td>`).join('');
          return `<tr>${cells}</tr>`;
        }).join('');

        tableBlock = `
          <table class="DataTable">
            <thead><tr>${headerCells}</tr></thead>
            <tbody>${bodyRows}</tbody>
          </table>
        `;
      }

      return `
        <div class="Section">
          <h2 class="SectionHeading">${escapeXml(sec.heading)}</h2>
          ${contentBlock}
          ${tableBlock}
        </div>
      `;
    }).join('');
  }

  return `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 20mm 20mm 20mm 25mm; /* Tiêu chuẩn Nghị định 30: Trái 30/25, Phải 15-20, Trên/Dưới 20 */
        }
        body {
          font-family: 'Times New Roman', serif;
          font-size: 13pt;
          line-height: 1.35;
          color: #000;
          background-color: #fff;
        }
        .HeaderTable {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24pt;
        }
        .HeaderTable td {
          vertical-align: top;
          text-align: center;
          padding: 0;
        }
        .OrgUpper {
          font-size: 12pt;
          font-weight: normal;
          text-transform: uppercase;
        }
        .OrgName {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .DocNo {
          font-size: 11pt;
          margin-top: 4pt;
        }
        .Nation {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .Motto {
          font-size: 13pt;
          font-weight: bold;
        }
        .UnderlineNation {
          width: 160px;
          height: 1px;
          background: #000;
          margin: 4pt auto 0 auto;
        }
        .DateLocation {
          font-size: 12pt;
          font-style: italic;
          margin-top: 6pt;
        }
        .DocTitle {
          text-align: center;
          font-size: 15pt;
          font-weight: bold;
          text-transform: uppercase;
          margin: 18pt 0 6pt 0;
        }
        .DocSubtitle {
          text-align: center;
          font-size: 12pt;
          font-style: italic;
          margin-bottom: 18pt;
        }
        .MetaSummary {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          padding: 8pt 12pt;
          margin-bottom: 14pt;
          font-size: 11pt;
        }
        .SectionHeading {
          font-size: 13pt;
          font-weight: bold;
          margin-top: 14pt;
          margin-bottom: 4pt;
          text-indent: 0;
        }
        .Paragraph {
          text-indent: 1.27cm; /* Lùi đầu dòng chuẩn 1.27 cm */
          text-align: justify;
          margin: 4pt 0;
        }
        .DataTable {
          width: 100%;
          border-collapse: collapse;
          margin: 10pt 0 14pt 0;
          font-size: 11pt;
        }
        .DataTable th, .DataTable td {
          border: 1px solid #333;
          padding: 5pt 6pt;
        }
        .DataTable th {
          background-color: #f2f2f2;
          font-weight: bold;
          text-align: center;
        }
        .FooterTable {
          width: 100%;
          border-collapse: collapse;
          margin-top: 24pt;
          page-break-inside: avoid;
        }
        .FooterTable td {
          vertical-align: top;
          padding: 0;
        }
        .RecipientBox {
          font-size: 10pt;
          width: 45%;
        }
        .RecipientHeading {
          font-weight: bold;
          font-style: italic;
        }
        .SignBox {
          text-align: center;
          width: 55%;
        }
        .SignTitle {
          font-size: 12pt;
          font-weight: bold;
          text-transform: uppercase;
        }
        .SignHint {
          font-size: 10pt;
          font-style: italic;
          margin-bottom: 50pt; /* Khoảng trống ký tên */
        }
        .SignName {
          font-size: 12pt;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <!-- Phần Đầu Trang: Chuẩn Nghị Định 30/2020/NĐ-CP -->
      <table class="HeaderTable">
        <tr>
          <td style="width: 45%;">
            <div class="OrgUpper">SỞ/PHÒNG GIÁO DỤC VÀ ĐÀO TẠO</div>
            <div class="OrgName">${school}</div>
            <div class="OrgName" style="font-size: 11pt;">${dept}</div>
            <div class="DocNo">${docNo}</div>
          </td>
          <td style="width: 55%;">
            <div class="Nation">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="Motto">Độc lập - Tự do - Hạnh phúc</div>
            <div class="UnderlineNation"></div>
            <div class="DateLocation">${location}, ${dateFormatted}</div>
          </td>
        </tr>
      </table>

      <!-- Tiêu Đề Văn Bản -->
      <div class="DocTitle">${title}</div>
      ${opts.metaSummary ? `<div class="DocSubtitle">${escapeXml(opts.metaSummary)}</div>` : ''}

      <!-- Nội Dung Chi Tiết -->
      ${sectionsHtml}

      <!-- Phần Ký Tên & Nơi Nhận: Chuẩn Nghị Định 30/2020/NĐ-CP -->
      <table class="FooterTable">
        <tr>
          <td class="RecipientBox">
            <div class="RecipientHeading">Nơi nhận:</div>
            <div>- Ban Giám hiệu (để b/c);</div>
            <div>- Các thành viên ${dept};</div>
            <div>- Lưu: Hồ sơ tổ chuyên môn.</div>
            ${(opts.notes || []).map(n => `<div>- ${escapeXml(n)}</div>`).join('')}
          </td>
          <td class="SignBox">
            <table style="width: 100%;">
              <tr>
                ${opts.secretaryName ? `
                  <td style="width: 50%; text-align: center;">
                    <div class="SignTitle">${secretaryRole}</div>
                    <div class="SignHint">(Ký và ghi rõ họ tên)</div>
                    <div class="SignName">${secretary}</div>
                  </td>
                ` : ''}
                <td style="text-align: center;">
                  <div class="SignTitle">${signerRole}</div>
                  <div class="SignHint">(Ký và ghi rõ họ tên)</div>
                  <div class="SignName">${signer}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

export function downloadWordFile(filename: string, htmlContent: string) {
  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.doc') ? filename : filename + '.doc';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 2000);
}
