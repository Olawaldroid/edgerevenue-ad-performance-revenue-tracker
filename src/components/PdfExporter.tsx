import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { toast } from 'sonner';
interface PdfExporterProps {
  elementId: string;
  accountId: string | null;
}
export function PdfExporter({ elementId, accountId }: PdfExporterProps) {
  const handleExport = () => {
    if (!accountId) {
      toast.error("Please select an account to export.");
      return;
    }
    const element = document.getElementById(elementId);
    if (!element) {
      toast.error("Could not find the chart element to export.");
      return;
    }
    // This is a mock implementation. A real implementation would use a library
    // like jsPDF and html2canvas to generate a proper PDF.
    // For this demo, we'll create a simple HTML file and download it.
    const title = element.querySelector('h2')?.textContent || 'Performance Report';
    const description = element.querySelector('p')?.textContent || '';
    const chartSvg = element.querySelector('svg')?.outerHTML;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Report for ${accountId}</title>
        <style>
          body { font-family: sans-serif; }
          h1, h2 { color: #333; }
          .chart-container { border: 1px solid #eee; padding: 20px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Performance Report</h1>
        <p>Account: ${accountId}</p>
        <p>Date: ${new Date().toLocaleDateString()}</p>
        <div class="chart-container">
          <h2>${title}</h2>
          <p>${description}</p>
          ${chartSvg || '<p>Chart could not be rendered.</p>'}
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    // We name it .pdf to simulate a PDF download for the demo.
    a.download = `report-${accountId}-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Report download started.", { description: "Your mock PDF report is being generated." });
  };
  return (
    <Button
      className="w-full"
      variant="outline"
      onClick={handleExport}
      disabled={!accountId}
    >
      <FileDown className="mr-2 h-4 w-4" /> Export PDF (Mock)
    </Button>
  );
}