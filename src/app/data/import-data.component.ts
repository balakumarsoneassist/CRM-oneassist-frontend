import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-import-data',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './import-data.component.html',
  styleUrls: ['./import-data.component.css']
})
export class ImportDataComponent {
  selectedFile: File | null = null;
  csvData: any[] = [];
  loading = false;
  uploadProgress = 0;
  errors: any = {};
  successMessage = '';
  
  // CSV requirements
  requiredFields = ['firstname',  'mobilenumber', 'email', 'presentaddress'];
  
  // Fixed values for API
  fixedValues = {
    locationid: 5001,
    status: 1,
    organizationid: 1001,
    contacttype: 'Company Contact'
  };

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {}

  // Handle file selection
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && file.type === 'text/csv') {
      this.selectedFile = file;
      this.errors.file = '';
      this.successMessage = '';
      console.log('CSV file selected:', file.name);
    } else {
      this.errors.file = 'Please select a valid CSV file';
      this.selectedFile = null;
    }
  }

  // Parse CSV file
  parseCsvFile(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.selectedFile) {
        reject('No file selected');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        try {
          const csvText = e.target.result;
          const lines = csvText.split('\n').filter((line: string) => line.trim());
          
          if (lines.length < 2) {
            reject('CSV file must contain at least a header row and one data row');
            return;
          }

          // Parse header
          const headers = lines[0].split(',').map((h: string) => h.trim().toLowerCase());
          
          // Validate required fields
          const missingFields = this.requiredFields.filter(field => !headers.includes(field));
          if (missingFields.length > 0) {
            reject(`Missing required fields: ${missingFields.join(', ')}`);
            return;
          }

          // Parse data rows
          const data = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v: string) => v.trim());
            if (values.length === headers.length) {
              const row: any = {};
              headers.forEach((header: string, index: number) => {
                row[header] = values[index];
              });
              
              // Validate required fields are not empty
              const emptyFields = this.requiredFields.filter(field => !row[field] || row[field].trim() === '');
              if (emptyFields.length === 0) {
                data.push(row);
              }
            }
          }

          if (data.length === 0) {
            reject('No valid data rows found in CSV file');
            return;
          }

          resolve(data);
        } catch (error) {
          reject('Error parsing CSV file: ' + (error as Error).message);
        }
      };

      reader.onerror = () => reject('Error reading file');
      reader.readAsText(this.selectedFile);
    });
  }

  // Upload and process CSV data
  async uploadCsvData(): Promise<void> {
    if (!this.selectedFile) {
      this.errors.file = 'Please select a CSV file';
      return;
    }

    this.loading = true;
    this.errors = {};
    this.successMessage = '';
    this.uploadProgress = 0;

    try {
      // Parse CSV file
      this.csvData = await this.parseCsvFile();
      console.log('Parsed CSV data:', this.csvData);

      // Process each row
      const totalRows = this.csvData.length;
      let processedRows = 0;
      let successCount = 0;
      let errorCount = 0;

      for (const row of this.csvData) {
        try {
          await this.saveLeadPersonal(row);
          successCount++;
        } catch (error) {
          console.error('Error saving row:', row, error);
          errorCount++;
        }
        
        processedRows++;
        this.uploadProgress = Math.round((processedRows / totalRows) * 100);
        this.cdr.detectChanges();
      }

      // Show results
      if (successCount > 0) {
        this.successMessage = `Successfully imported ${successCount} records`;
        
        // Show alert message for successful import
        alert(`✅ Import Completed Successfully!\n\n${successCount} records have been imported.\n\nPlease select a new CSV file for the next import.`);
        
        // Clear the selected file to disable import button
        this.selectedFile = null;
        
        // Reset file input
        const fileInput = document.getElementById('csvFile') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
      if (errorCount > 0) {
        this.errors.general = `${errorCount} records failed to import`;
        
        // Show alert for errors (if there were some successes too)
        if (successCount > 0) {
          alert(`⚠️ Import Completed with Some Errors\n\n${successCount} records imported successfully\n${errorCount} records failed\n\nPlease check the error messages and select a new file.`);
        } else {
          alert(`❌ Import Failed\n\nAll ${errorCount} records failed to import.\n\nPlease check your CSV file format and try again.`);
        }
        
        // Clear the selected file to disable import button
        this.selectedFile = null;
        
        // Reset file input
        const fileInput = document.getElementById('csvFile') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      }
    } catch (error) {
      console.error('CSV processing error:', error);
      this.errors.general = error as string;
    } finally {
      this.loading = false;
      this.uploadProgress = 0;
      // Force UI update using comprehensive change detection + DOM manipulation
      this.forceUIUpdate();
    }
  }

  // Save individual lead personal data
  private saveLeadPersonal(csvRow: any): Promise<any> {
    const leadData = {
      // CSV data
      firstname: csvRow.firstname,
      lastname: csvRow.lastname,
      mobilenumber: csvRow.mobilenumber,
      email: csvRow.email,
      presentaddress: csvRow.presentaddress,
      
      // Fixed values
      locationid: this.fixedValues.locationid,
      status: this.fixedValues.status,
      organizationid: this.fixedValues.organizationid,
      createdon: new Date().toISOString(),
      createdby: localStorage.getItem('usernameID') || '',
      contacttype: this.fixedValues.contacttype
    };

    console.log('Saving lead personal data:', leadData);

    return this.http.post(`${environment.apiUrl}/leadpersonal`, leadData).toPromise();
  }

  // Force UI update using comprehensive change detection + DOM manipulation (fixes Angular change detection issues)
  private forceUIUpdate(): void {
    // Multiple change detection cycles with different timing
    setTimeout(() => {
      this.loading = false;
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.ngZone.run(() => {
          this.loading = false;
          this.cdr.detectChanges();
          
          // Direct DOM manipulation to force button text update
          setTimeout(() => {
            this.updateButtonDirectly();
          }, 10);
        });
      }, 10);
    }, 10);
  }

  // Direct DOM manipulation to update button text (bypasses Angular change detection)
  private updateButtonDirectly(): void {
    const uploadButton = document.querySelector('.upload-btn') as HTMLButtonElement;
    if (uploadButton) {
      // Remove loading spinner
      const spinner = uploadButton.querySelector('.loading-spinner');
      if (spinner) {
        spinner.remove();
      }
      
      // Update button text
      const buttonText = uploadButton.querySelector('span:not(.loading-spinner)');
      if (buttonText) {
        buttonText.textContent = '📤 Import Data';
      } else {
        // If no span found, update entire button text
        uploadButton.innerHTML = '📤 Import Data';
      }
      
      // Ensure button is enabled
      uploadButton.disabled = false;
      
      console.log('Button state forcefully updated via DOM manipulation');
    }
  }

  // Reset form
  resetForm(): void {
    this.selectedFile = null;
    this.csvData = [];
    this.errors = {};
    this.successMessage = '';
    this.uploadProgress = 0;
    
    // Reset file input
    const fileInput = document.getElementById('csvFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  // Navigate back to dashboard
  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  // Download sample CSV template
  downloadSampleCsv(): void {
    const csvContent = [
      'firstname,lastname,mobilenumber,email,presentaddress',
      'John,Doe,9876543210,john.doe@example.com,"123 Main St, City"',
      'Jane,Smith,9876543211,jane.smith@example.com,"456 Oak Ave, Town"'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sample_import_template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
