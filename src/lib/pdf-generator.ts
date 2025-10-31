import { Project } from '@/types/project';

/**
 * Generate a PDF from project details
 * Uses browser's native print functionality to generate PDF
 */
export function generateProjectPDF(project: Project): void {
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  if (!printWindow) {
    alert('Please allow popups to download the PDF');
    return;
  }

  // Format deliverables
  const deliverablesHTML = project.deliverables
    ?.map((d, i) => `<li>${d}</li>`)
    .join('') || '<li>No deliverables specified</li>';

  // Format learning objectives
  const objectivesHTML = project.learningObjectives
    ?.map((obj, i) => `<li>${obj}</li>`)
    .join('') || '<li>No learning objectives specified</li>';

  // Create PDF-optimized HTML
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${project.title} - Project Brief</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1a1a1a;
      max-width: 100%;
    }
    .header {
      border-bottom: 3px solid #2563eb;
      padding-bottom: 1em;
      margin-bottom: 1.5em;
    }
    h1 {
      font-size: 24pt;
      color: #1a1a1a;
      margin-bottom: 0.3em;
      font-weight: bold;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1.5em;
      margin-top: 0.8em;
      font-size: 10pt;
      color: #4b5563;
    }
    .meta-item {
      display: flex;
      align-items: center;
      gap: 0.4em;
    }
    .meta-label {
      font-weight: 600;
      color: #2563eb;
    }
    .badge {
      display: inline-block;
      padding: 0.2em 0.6em;
      border-radius: 0.3em;
      font-size: 9pt;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge.beginner { background-color: #dcfce7; color: #166534; }
    .badge.intermediate { background-color: #fef3c7; color: #92400e; }
    .badge.advanced { background-color: #fee2e2; color: #991b1b; }
    
    section {
      margin-bottom: 1.5em;
      page-break-inside: avoid;
    }
    h2 {
      font-size: 14pt;
      color: #1e40af;
      margin-bottom: 0.5em;
      font-weight: 600;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0.3em;
    }
    p {
      text-align: justify;
      margin-bottom: 0.8em;
    }
    ul {
      margin-left: 1.5em;
      margin-bottom: 0.8em;
    }
    li {
      margin-bottom: 0.4em;
    }
    .footer {
      margin-top: 2em;
      padding-top: 1em;
      border-top: 1px solid #e5e7eb;
      font-size: 9pt;
      color: #6b7280;
      text-align: center;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${project.title}</h1>
    <div class="meta">
      <div class="meta-item">
        <span class="meta-label">Industry:</span>
        <span>${project.industry}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Domain:</span>
        <span>${project.domain}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Difficulty:</span>
        <span class="badge ${project.difficulty?.toLowerCase()}">${project.difficulty}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Duration:</span>
        <span>${project.estimatedHours} hours</span>
      </div>
    </div>
  </div>

  <section>
    <h2>Project Description</h2>
    <p>${project.description || 'No description available'}</p>
  </section>

  ${project.scope ? `
  <section>
    <h2>Scope</h2>
    <p>${project.scope}</p>
  </section>
  ` : ''}

  ${project.learningObjectives && project.learningObjectives.length > 0 ? `
  <section>
    <h2>Learning Objectives</h2>
    <ul>
      ${objectivesHTML}
    </ul>
  </section>
  ` : ''}

  <section>
    <h2>Deliverables</h2>
    <ul>
      ${deliverablesHTML}
    </ul>
  </section>

  <div class="footer">
    <p>Generated from ProjectHub • ${new Date().toLocaleDateString()}</p>
  </div>

  <script>
    // Auto-print when page loads
    window.onload = function() {
      window.print();
      // Close window after print dialog
      setTimeout(function() {
        window.close();
      }, 100);
    };
  </script>
</body>
</html>
  `;

  // Write to the new window and trigger print
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
