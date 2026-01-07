import { Component, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import * as QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-qr-code-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-code-generator.component.html',
  styleUrls: ['./qr-code-generator.component.css']
})
export class QrCodeGeneratorComponent {
  qrForm: {
    name: string;
    contactperson: string;
    mobilenumber: string;
    emailid: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    referer: string;
    createtime: string;
    modifiedby: string;
  } = {
    name: '',
    contactperson: '',
    mobilenumber: '',
    emailid: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    referer: '', // Added referer field
    createtime: new Date().toISOString(),
    modifiedby: localStorage.getItem('userId') || ''
  };

  loading = false;
  qrCodeDataUrl = '';
  showQrCode = false;
  qrToken = '';
  qrUrl = '';
  
  errors: any = {};

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    // Set current timestamp for createtime
    this.qrForm.createtime = new Date().toISOString();
    
    // Set modifiedby from localStorage
    const userId = localStorage.getItem('usernameID') || '';
    this.qrForm.modifiedby = userId;
    
    // Generate initial QR token and URL
    this.generateQrToken();
  }

  generateQrToken(): void {
    // Generate 10-character random string with URL-safe characters only
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 10; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.qrToken = token;
    this.qrUrl = `${environment.qrBaseUrl}?token=${this.qrToken}`;
    console.log('Generated token:', this.qrToken);
    console.log('Generated URL:', this.qrUrl);
    console.log('Environment qrBaseUrl:', environment.qrBaseUrl);
  }

  validateForm(): boolean {
    this.clearErrors();
    let isValid = true;

    // Required field validations
    if (!this.qrForm.name.trim()) {
      this.errors.name = 'Name is required';
      isValid = false;
    }

    if (!this.qrForm.contactperson.trim()) {
      this.errors.contactperson = 'Contact person is required';
      isValid = false;
    }

    if (!this.qrForm.address.trim()) {
      this.errors.address = 'Address is required';
      isValid = false;
    }

    if (!this.qrForm.city.trim()) {
      this.errors.city = 'City is required';
      isValid = false;
    }

    if (!this.qrForm.pincode.trim()) {
      this.errors.pincode = 'Pincode is required';
      isValid = false;
    }

    if (!this.qrForm.emailid.trim()) {
      this.errors.emailid = 'Email ID is required';
      isValid = false;
    } else if (!this.isValidEmail(this.qrForm.emailid)) {
      this.errors.emailid = 'Please enter a valid email address';
      isValid = false;
    }

    if (!this.qrForm.mobilenumber.trim()) {
      this.errors.mobilenumber = 'Mobile number is required';
      isValid = false;
    } else if (!this.isValidMobile(this.qrForm.mobilenumber)) {
      this.errors.mobilenumber = 'Please enter a valid mobile number';
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidMobile(mobile: string): boolean {
    const mobileRegex = /^[0-9]{10}$/;
    return mobileRegex.test(mobile.replace(/\s+/g, ''));
  }

  clearErrors(): void {
    Object.keys(this.errors).forEach(key => {
      (this.errors as any)[key] = '';
    });
  }

  generateQrCode(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.clearErrors();

    // Update timestamps and user info
    this.qrForm.createtime = new Date().toISOString();
    this.qrForm.modifiedby = localStorage.getItem('usernameID') || '';

    // Generate new QR token and URL
    this.generateQrToken();
    
    console.log('Generated QR URL:', this.qrUrl);
    
    // First save customer details to database before generating QR code
    this.saveQrCodeCustomer();
  }

  // Save QR code customer details to database before generating QR code
  saveQrCodeCustomer(): void {
    const customerData = {
      name: this.qrForm.name,
      contactperson: this.qrForm.contactperson,
      presentaddress: this.qrForm.address, // mapping address to presentaddress
      city: this.qrForm.city,
      pincode: this.qrForm.pincode,
      emailid: this.qrForm.emailid,
      mobilenumber: this.qrForm.mobilenumber,
      createtime: this.qrForm.createtime,
      referer: this.qrForm.referer, // now using form field
      modifiedby: this.qrForm.modifiedby,
      qrtoken: this.qrToken
    };

    console.log('Saving QR code customer data:', customerData);

    this.http.post(`${environment.apiUrl}/saveqrcodecustomers`, customerData).subscribe({
      next: (response: any) => {
        console.log('Customer data saved successfully:', response);
        // After successful save, generate QR code
        this.generateQrCodeImage(this.qrUrl);
      },
      error: (error: any) => {
        console.error('Error saving customer data:', error);
        this.errors.general = 'Failed to save customer data: ' + (error.error?.message || error.message || 'Unknown error');
        this.loading = false;
        // Still generate QR code even if save fails
        this.generateQrCodeImage(this.qrUrl);
      }
    });
  }

  generateQrCodeImage(data: string): void {
    // Create custom QR code design with logo and text
    this.createCustomQrDesign(data);
  }

  createCustomQrDesign(data: string): void {
    console.log('Starting createCustomQrDesign with data:', data);
    
    // Create canvas for custom design
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      this.errors.general = 'Canvas not supported';
      this.loading = false;
      return;
    }

    // Set canvas dimensions
    canvas.width = 400;
    canvas.height = 600;

    // Fill white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let yPosition = 20;

    // Try to load and draw logo
    const logoImg = new Image();
    logoImg.onload = () => {
      console.log('Logo loaded successfully');
      // Draw logo
      const logoWidth = 100;
      const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
      const logoX = (canvas.width - logoWidth) / 2;
      
      ctx.drawImage(logoImg, logoX, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 30;
      
      // Continue with text and QR
      this.drawTextAndQr(ctx, canvas, data, yPosition);
    };
    
    logoImg.onerror = () => {
      console.log('Logo not found, creating programmatic logo');
      // Create programmatic logo as fallback
      const centerX = canvas.width / 2;
      const logoRadius = 40;
      
      // Draw circle background
      ctx.beginPath();
      ctx.arc(centerX, yPosition + logoRadius, logoRadius, 0, 2 * Math.PI);
      ctx.fillStyle = '#1e3a8a'; // Blue background
      ctx.fill();
      
      // Draw "OA" text in the circle
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('OA', centerX, yPosition + logoRadius);
      
      yPosition += (logoRadius * 2) + 30;
      
      // Continue with text and QR
      this.drawTextAndQr(ctx, canvas, data, yPosition);
    };
    
    logoImg.src = './logo.png';
  }
  
  private drawTextAndQr(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, data: string, yPosition: number): void {
    // Reset text baseline
    ctx.textBaseline = 'alphabetic';
    
    // Draw first promotional text
    ctx.fillStyle = '#4b5563';
    ctx.font = '18px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Get Loan with Low Interest rate..', canvas.width / 2, yPosition);
    yPosition += 30;

    // Draw second promotional text
    ctx.font = '16px Arial';
    ctx.fillText('Discover & connect with top-rated Banks', canvas.width / 2, yPosition);
    yPosition += 40;

    // Draw business name from form
    if (this.qrForm.name) {
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(this.qrForm.name.toUpperCase(), canvas.width / 2, yPosition);
      yPosition += 40;
    }

    // Generate and draw QR code
    QRCode.toDataURL(data, {
      width: 200,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    .then((qrDataUrl: string) => {
      console.log('QR code generated, adding to canvas');
      const qrImg = new Image();
      
      qrImg.onload = () => {
        console.log('Drawing QR code on canvas...');
        // Draw QR code centered
        const qrSize = 200;
        ctx.drawImage(qrImg, (canvas.width - qrSize) / 2, yPosition, qrSize, qrSize);
        
        console.log('Converting canvas to data URL...');
        // Convert final canvas to data URL
        this.qrCodeDataUrl = canvas.toDataURL('image/png');
        this.showQrCode = true;
        this.loading = false;
        
        console.log('Custom QR design completed successfully');
        console.log('showQrCode set to:', this.showQrCode);
        console.log('loading set to:', this.loading);
        console.log('qrCodeDataUrl length:', this.qrCodeDataUrl.length);
        
        // Force UI update using comprehensive change detection + DOM manipulation
        setTimeout(() => {
          this.forceAngularUpdate();
        }, 100);
      };
      
      qrImg.onerror = (error) => {
        console.error('Error loading QR image:', error);
        this.errors.general = 'Failed to load QR code image.';
        this.loading = false;
      };
      
      qrImg.src = qrDataUrl;
    })
    .catch((error: any) => {
      console.error('QR Code generation failed:', error);
      this.errors.general = 'Failed to generate QR code: ' + error.message;
      this.loading = false;
    });
  }

  // Force Angular update using comprehensive change detection + DOM manipulation
  private forceAngularUpdate(): void {
    console.log('🔄 Starting comprehensive Angular update...');
    
    // Multiple change detection approaches
    this.ngZone.run(() => {
      console.log('Running in NgZone...');
      
      // Force multiple change detection cycles
      setTimeout(() => {
        this.showQrCode = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.showQrCode = true;
          this.cdr.detectChanges();
          
          setTimeout(() => {
            this.cdr.markForCheck();
            this.cdr.detectChanges();
            
            console.log('Angular change detection completed, now applying DOM manipulation...');
            this.forceUIUpdate();
          }, 50);
        }, 50);
      }, 50);
    });
  }

  // Force UI update using direct DOM manipulation (fixes Angular change detection issues)
  private forceUIUpdate(): void {
    console.log('Forcing UI update via direct DOM manipulation...');
    
    // Hide loading state
    const loadingElements = document.querySelectorAll('.loading-spinner, .loading-text');
    loadingElements.forEach(element => {
      (element as HTMLElement).style.display = 'none';
    });
    
    // Force show QR code section (bypass *ngIf="showQrCode")
    const qrSection = document.querySelector('.qr-section');
    if (qrSection) {
      (qrSection as HTMLElement).style.display = 'block';
      (qrSection as HTMLElement).style.visibility = 'visible';
      console.log('QR section made visible via DOM manipulation');
    } else {
      console.log('QR section not found - creating it manually');
      // If *ngIf prevented creation, we need to trigger Angular change detection
      setTimeout(() => {
        const qrSectionRetry = document.querySelector('.qr-section');
        if (qrSectionRetry) {
          (qrSectionRetry as HTMLElement).style.display = 'block';
          (qrSectionRetry as HTMLElement).style.visibility = 'visible';
          console.log('QR section found on retry and made visible');
        }
      }, 50);
    }
    
    // Hide generate button loading state
    const generateBtn = document.querySelector('button[type="submit"]');
    if (generateBtn) {
      generateBtn.textContent = 'Generate QR Code';
      (generateBtn as HTMLButtonElement).disabled = false;
      console.log('Generate button reset via DOM manipulation');
    }
    
    // Force display of QR code image and buttons
    setTimeout(() => {
      const qrImage = document.querySelector('.qr-code-image');
      if (qrImage && this.qrCodeDataUrl) {
        (qrImage as HTMLImageElement).src = this.qrCodeDataUrl;
        (qrImage as HTMLElement).style.display = 'block';
        console.log('QR code image updated via DOM manipulation');
      } else {
        console.log('QR code image not found in DOM');
      }
      
      // Make export buttons visible
      const exportButtons = document.querySelectorAll('.download-btn, .new-qr-btn');
      exportButtons.forEach(button => {
        (button as HTMLElement).style.display = 'inline-block';
        (button as HTMLElement).style.visibility = 'visible';
      });
      console.log('Export buttons made visible:', exportButtons.length, 'buttons found');
    }, 100);
    
    console.log('UI update completed via direct DOM manipulation');
  }

  // Export QR code as PDF with stylish professional layout
  exportToPdf(): void {
    console.log('🚨 PDF EXPORT BUTTON CLICKED - METHOD CALLED!');
    alert('PDF Export method called! Check console for details.');
    console.log('Starting stylish PDF export...');
    
    if (!this.qrCodeDataUrl) {
      console.error('No QR code data available for PDF export');
      this.errors.general = 'No QR code available. Please generate QR code first.';
      return;
    }

    try {
      console.log('Creating stylish PDF document...');
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      console.log('PDF page dimensions:', pageWidth, 'x', pageHeight);
      
      // Set light background color
      pdf.setFillColor(248, 249, 250); // Light gray background
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');
      
      let yPosition = 30;
      
      // Try to load and add logo
      const logoImg = new Image();
      logoImg.onload = () => {
        console.log('Adding logo to stylish PDF...');
        
        // Add logo (larger size like reference: 330px -> ~80mm)
        const logoWidth = 80;
        const logoHeight = (logoImg.height / logoImg.width) * logoWidth;
        const logoX = (pageWidth - logoWidth) / 2;
        
        // Convert logo to canvas and add to PDF
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = logoImg.width;
          canvas.height = logoImg.height;
          ctx.drawImage(logoImg, 0, 0);
          const logoDataUrl = canvas.toDataURL('image/png');
          
          pdf.addImage(logoDataUrl, 'PNG', logoX, yPosition, logoWidth, logoHeight);
          yPosition += logoHeight + 20;
        }
        
        this.addStylishContentToPdf(pdf, yPosition);
      };
      
      logoImg.onerror = () => {
        console.log('Logo not found, continuing with stylish PDF without logo');
        this.addStylishContentToPdf(pdf, yPosition);
      };
      
      logoImg.src = './logo.png';
      
    } catch (error) {
      console.error('Error during stylish PDF export:', error);
      this.errors.general = 'Failed to export PDF: ' + (error as Error).message;
    }
  }
  
  private addStylishContentToPdf(pdf: any, yPosition: number): void {
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // Add main heading with better typography
    pdf.setFontSize(20);
    pdf.setTextColor(51, 51, 51); // Dark gray
    pdf.setFont('helvetica', 'bold');
    const heading1 = 'Get Loan with Low Interest rate..';
    const h1Width = pdf.getTextWidth(heading1);
    pdf.text(heading1, (pageWidth - h1Width) / 2, yPosition);
    yPosition += 15;
    
    // Add subheading
    pdf.setFontSize(16);
    pdf.setTextColor(108, 117, 125); // Light gray
    pdf.setFont('helvetica', 'normal');
    const heading2 = 'Discover & connect with top-rated Banks';
    const h2Width = pdf.getTextWidth(heading2);
    pdf.text(heading2, (pageWidth - h2Width) / 2, yPosition);
    yPosition += 20;
    
    // Add business name with emphasis
    if (this.qrForm.name) {
      pdf.setFontSize(18);
      pdf.setTextColor(220, 53, 69); // Bootstrap danger red
      pdf.setFont('helvetica', 'bold');
      const businessName = this.qrForm.name.toUpperCase();
      const businessWidth = pdf.getTextWidth(businessName);
      pdf.text(businessName, (pageWidth - businessWidth) / 2, yPosition);
      yPosition += 25;
    }
    
    // Create stylish card for QR code (inspired by your reference) - BIGGER SIZE
    const cardWidth = 140; // Increased from 100
    const cardHeight = 160; // Increased from 120
    const cardX = (pageWidth - cardWidth) / 2;
    const cardY = yPosition;
    
    // Card background (white)
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(222, 226, 230); // Light border
    pdf.setLineWidth(0.5);
    pdf.roundedRect(cardX, cardY, cardWidth, cardHeight, 3, 3, 'FD');
    
    // Card header with "SCAN" text (like your reference) - BIGGER HEADER
    const headerHeight = 20; // Increased from 15
    pdf.setFillColor(0, 123, 255); // Bootstrap primary blue
    pdf.roundedRect(cardX, cardY, cardWidth, headerHeight, 3, 3, 'F');
    
    // Add "SCAN" text in header - BIGGER TEXT
    pdf.setFontSize(18); // Increased from 14
    pdf.setTextColor(255, 255, 255); // White text
    pdf.setFont('helvetica', 'bold');
    const scanText = 'SCAN';
    const scanWidth = pdf.getTextWidth(scanText);
    pdf.text(scanText, cardX + (cardWidth - scanWidth) / 2, cardY + headerHeight - 5);
    
    // Add QR code in card body - MUCH BIGGER QR CODE
    const qrSize = 110; // Increased from 70 - much bigger QR code
    const qrX = cardX + (cardWidth - qrSize) / 2;
    const qrY = cardY + headerHeight + 20; // More space from header
    
    console.log('Adding QR code to stylish card...');
    pdf.addImage(this.qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    
    // Add subtle footer text
    yPosition = cardY + cardHeight + 20;
    pdf.setFontSize(10);
    pdf.setTextColor(108, 117, 125);
    pdf.setFont('helvetica', 'normal');
    const footerText = 'Scan this QR code to access your loan application';
    const footerWidth = pdf.getTextWidth(footerText);
    pdf.text(footerText, (pageWidth - footerWidth) / 2, yPosition);
    
    // Generate filename and save
    const fileName = `qr-code-${this.qrForm.name || 'business'}-${Date.now()}.pdf`;
    console.log('Saving stylish PDF with filename:', fileName);
    pdf.save(fileName);
    
    console.log('Stylish PDF export completed successfully!');
  }

  // Download QR code as image
  downloadQrCode(): void {
    if (this.qrCodeDataUrl) {
      const link = document.createElement('a');
      link.href = this.qrCodeDataUrl;
      link.download = `qr-code-${this.qrForm.name || 'business'}-${Date.now()}.png`;
      link.click();
    }
  }

  // Reset form to initial state
  resetForm(): void {
    this.qrForm = {
      name: '',
      contactperson: '',
      mobilenumber: '',
      emailid: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      referer: '', // Added referer field
      createtime: new Date().toISOString(),
      modifiedby: localStorage.getItem('userId') || ''
    };
    this.showQrCode = false;
    this.qrCodeDataUrl = '';
    this.errors = {};
    this.generateQrToken();
  }

  // Navigate back to track leads
  goBack(): void {
    this.router.navigate(['/trackleads']);
  }
}