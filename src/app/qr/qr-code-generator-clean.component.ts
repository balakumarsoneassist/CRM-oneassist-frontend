import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import * as QRCode from 'qrcode';
import jsPDF from 'jspdf';

@Component({
  selector: 'app-qr-code-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './qr-code-generator.component.html',
  styleUrls: ['./qr-code-generator.component.css']
})
export class QrCodeGeneratorComponent {
  qrForm = {
    name: '',
    contactperson: '',
    mobilenumber: '',
    emailid: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    referer: '',
    createtime: new Date().toISOString(),
    modifiedby: localStorage.getItem('userId') || ''
  };

  loading = false;
  qrCodeDataUrl = '';
  showQrCode = false;
  qrToken = '';
  qrUrl = '';
  
  errors: any = {};

  constructor(private http: HttpClient, private router: Router) {
    this.generateQrToken();
  }

  // Generate random 10-character token with alphanumeric and special characters
  generateQrToken(): void {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let token = '';
    for (let i = 0; i < 10; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.qrToken = token;
    this.qrUrl = `${environment.qrBaseUrl}?token=${this.qrToken}`;
  }

  // Validate form fields
  validateForm(): boolean {
    this.errors = {};
    let isValid = true;

    if (!this.qrForm.name.trim()) {
      this.errors.name = 'Business name is required';
      isValid = false;
    }

    if (!this.qrForm.contactperson.trim()) {
      this.errors.contactperson = 'Contact person is required';
      isValid = false;
    }

    if (!this.qrForm.mobilenumber.trim()) {
      this.errors.mobilenumber = 'Mobile number is required';
      isValid = false;
    } else if (!this.isValidMobile(this.qrForm.mobilenumber)) {
      this.errors.mobilenumber = 'Please enter a valid 10-digit mobile number';
      isValid = false;
    }

    if (!this.qrForm.emailid.trim()) {
      this.errors.emailid = 'Email ID is required';
      isValid = false;
    } else if (!this.isValidEmail(this.qrForm.emailid)) {
      this.errors.emailid = 'Please enter a valid email address';
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

  // Generate QR code
  generateQrCode(): void {
    if (!this.validateForm()) {
      return;
    }

    this.loading = true;
    this.errors = {};

    // Update timestamps and user info
    this.qrForm.createtime = new Date().toISOString();
    this.qrForm.modifiedby = localStorage.getItem('userId') || '';

    // Generate new QR token and URL
    this.generateQrToken();
    
    // Generate QR code with custom design
    this.createCustomQrDesign(this.qrUrl);
  }

  // Create custom QR code design with programmatic logo
  createCustomQrDesign(data: string): void {
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

    // Create programmatic logo (blue circle with "OA" text)
    const centerX = canvas.width / 2;
    const logoRadius = 40;
    
    // Draw circle background
    ctx.beginPath();
    ctx.arc(centerX, yPosition + logoRadius, logoRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e3a8a'; // Blue background
    ctx.fill();
    
    // Draw "OA" text in the circle (One Assist)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('OA', centerX, yPosition + logoRadius);
    
    // Reset text baseline for subsequent text
    ctx.textBaseline = 'alphabetic';
    
    yPosition += (logoRadius * 2) + 20;

    // Draw "ONE ASSIST" text
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ONE ASSIST', canvas.width / 2, yPosition);
    yPosition += 30;

    // Draw "MONETARY CONSULTANT" text
    ctx.font = 'bold 14px Arial';
    ctx.fillText('MONETARY CONSULTANT', canvas.width / 2, yPosition);
    yPosition += 40;

    // Draw first static text
    ctx.fillStyle = '#4b5563';
    ctx.font = '18px Arial';
    ctx.fillText('Get Loan with Low Interest rate..', canvas.width / 2, yPosition);
    yPosition += 30;

    // Draw second static text
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

    // Draw "SCAN" button-like text
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(50, yPosition, canvas.width - 100, 40);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px Arial';
    ctx.fillText('SCAN', canvas.width / 2, yPosition + 25);
    yPosition += 60;

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
      const qrImg = new Image();
      qrImg.onload = () => {
        // Draw QR code centered
        const qrSize = 200;
        ctx.drawImage(qrImg, (canvas.width - qrSize) / 2, yPosition, qrSize, qrSize);
        
        // Convert canvas to data URL
        this.qrCodeDataUrl = canvas.toDataURL('image/png');
        this.showQrCode = true;
        this.loading = false;
      };
      qrImg.src = qrDataUrl;
    })
    .catch((error: any) => {
      console.error('QR Code generation failed:', error);
      this.errors.general = 'Failed to generate QR code. Please try again.';
      this.loading = false;
    });
  }

  // Export QR code as PDF
  exportToPdf(): void {
    if (!this.qrCodeDataUrl) {
      return;
    }

    const pdf = new jsPDF();
    const imgData = this.qrCodeDataUrl;
    const imgWidth = 100;
    const imgHeight = 150;
    
    // Calculate position to center the image
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;
    
    // Add image to PDF
    pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
    
    // Generate filename with business name and timestamp
    const fileName = `qr-code-${this.qrForm.name || 'business'}-${Date.now()}.pdf`;
    pdf.save(fileName);
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
      referer: '',
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
