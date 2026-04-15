const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

exports.generateMarksheetPDF = async (studentData) => {
  try {
    const dir = path.join(__dirname, '..', '..', 'uploads', 'certificates');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 🎨 MODERN BPUT-INSPIRED HTML TEMPLATE
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap');
          
          body { 
            font-family: 'Inter', sans-serif; 
            margin: 0; 
            padding: 0; 
            background-color: #f5f5f5;
          }

          .page {
            width: 210mm;
            min-height: 297mm;
            padding: 15mm;
            margin: auto;
            background: white;
            box-sizing: border-box;
            position: relative;
            border-top: 10px solid #1e40af; /* BPUT Deep Blue */
          }

          /* Watermark */
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 80px;
            color: rgba(30, 64, 175, 0.05);
            font-weight: 800;
            z-index: 0;
            pointer-events: none;
            white-space: nowrap;
          }

          /* Header Section */
          .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
          }

          .institute-info h1 {
            margin: 0;
            font-size: 26px;
            color: #1e40af;
            text-transform: uppercase;
            font-weight: 800;
          }

          .institute-info p {
            margin: 5px 0 0 0;
            color: #6b7280;
            font-size: 14px;
          }

          .document-title {
            text-align: right;
          }

          .document-title h2 {
            margin: 0;
            font-size: 22px;
            color: #111827;
            font-weight: 700;
          }

          .document-title span {
            font-size: 12px;
            color: #ef4444;
            font-weight: 600;
            letter-spacing: 1px;
          }

          /* Student Info Grid */
          .student-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 40px;
            position: relative;
            z-index: 1;
          }

          .info-item {
            background: #f9fafb;
            padding: 12px 15px;
            border-radius: 6px;
            border-left: 4px solid #1e40af;
          }

          .info-label {
            font-size: 11px;
            text-transform: uppercase;
            color: #6b7280;
            font-weight: 600;
            margin-bottom: 4px;
          }

          .info-value {
            font-size: 15px;
            color: #111827;
            font-weight: 700;
          }

          /* Table Styling */
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            position: relative;
            z-index: 1;
          }

          th {
            background-color: #1e40af;
            color: white;
            text-align: left;
            padding: 14px;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }

          td {
            padding: 12px 14px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 14px;
            color: #374151;
          }

          tr:nth-child(even) { background-color: #f8fafc; }

          .grade-cell {
            font-weight: 800;
            color: #1e40af;
            text-align: center;
          }

          /* Footer Section */
          .result-summary {
            margin-top: 20px;
            padding: 15px;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #fff;
          }

          .sgpa-box {
            font-size: 18px;
            font-weight: 800;
          }

          .sgpa-label { color: #6b7280; font-size: 12px; margin-right: 10px; }
          .sgpa-value { color: #1e40af; }

          .signature-section {
            margin-top: 80px;
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
          }

          .sig-box {
            text-align: center;
            width: 200px;
          }

          .sig-line {
            border-top: 1px solid #111827;
            margin-bottom: 8px;
          }

          .sig-text {
            font-size: 12px;
            font-weight: 700;
            color: #374151;
          }

          .footer-note {
            position: absolute;
            bottom: 30px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="watermark">${studentData.instituteName || 'OFFICIAL'}</div>

          <div class="header">
            <div class="institute-info">
              <h1>${studentData.instituteName || 'Biju Patnaik University'}</h1>
              <p>Recognized by AICTE & Accredited by NAAC</p>
            </div>
            <div class="document-title">
              <span>ACADEMIC RECORD</span>
              <h2>SEMESTER GRADE SHEET</h2>
            </div>
          </div>

          <div class="student-grid">
            <div class="info-item">
              <div class="info-label">Student Name</div>
              <div class="info-value">${studentData.studentName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Registration No.</div>
              <div class="info-value">${studentData.studentId}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Course / Branch</div>
              <div class="info-value">${studentData.courseName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Semester & Batch</div>
              <div class="info-value">Semester ${studentData.semester} (${studentData.batch})</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 15%;">Subject Code</th>
                <th style="width: 50%;">Subject Description</th>
                <th style="text-align: center;">Max</th>
                <th style="text-align: center;">Obtained</th>
                <th style="text-align: center;">Grade</th>
              </tr>
            </thead>
            <tbody>
              ${studentData.marks.map((m, index) => `
                <tr>
                  <td style="font-family: monospace; font-weight: 600;">SUB${100 + index}</td>
                  <td style="font-weight: 600;">${m.subject}</td>
                  <td style="text-align: center; color: #6b7280;">${m.max}</td>
                  <td style="text-align: center; font-weight: 700;">${m.obtained}</td>
                  <td class="grade-cell">${m.grade}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="result-summary">
            <div class="sgpa-box">
              <span class="sgpa-label">SEMESTER GRADE POINT AVERAGE (SGPA):</span>
              <span class="sgpa-value">8.45</span>
            </div>
            <div style="font-weight: 700; color: #059669;">RESULT: PASS</div>
          </div>

          <div class="signature-section">
            <div class="sig-box">
              <div style="height: 40px; font-style: italic; color: #9ca3af; font-size: 12px;">Digitally Verified</div>
              <div class="sig-line"></div>
              <div class="sig-text">Date of Issue: ${new Date().toLocaleDateString()}</div>
            </div>
            <div class="sig-box">
              <div style="height: 40px;"></div>
              <div class="sig-line"></div>
              <div class="sig-text">Controller of Examinations</div>
            </div>
          </div>

          <div class="footer-note">
            This is a computer-generated document and does not require a physical signature.
            <br>Verify this document at: https://your-lms-portal.com/verify
          </div>
        </div>
      </body>
      </html>
    `;

    const fileName = `marksheet_${studentData.studentId}_sem${studentData.semester}_${Date.now()}.pdf`;
    const filePath = path.join(dir, fileName);

    const browser = await puppeteer.launch({ 
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    await page.pdf({ 
      path: filePath, 
      format: 'A4', 
      printBackground: true,
      margin: { top: '0px', bottom: '0px', left: '0px', right: '0px' } 
    });

    await browser.close();
    return `/uploads/certificates/${fileName}`;

  } catch (error) {
    console.error("PDF Generation Error:", error);
    throw error;
  }
};