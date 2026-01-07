import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface EmployeeProfile {
  id: number;
  name: string;
  dateofbirth: string;
  joindate: string;
  emailid: string;
  mobilenumber: string;
  designation: string;
  qualification?: string;
  dept?: string;
  organizationid?: number;
  profilePicture?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  profile: EmployeeProfile | null = null;
  loading = true;
  error: string | null = null;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const usernameID = localStorage.getItem('usernameID');
    
    if (!usernameID) {
      this.error = 'User ID not found. Please login again.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = null;

    // Call the API to get employee details
    this.http.get<EmployeeProfile>(`${environment.apiUrl}/employees/${usernameID}`).subscribe({
      next: (profile) => {
        this.profile = profile;
        this.loading = false;
        this.error = null;
        
        // Force change detection to update UI
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.error = 'Failed to load profile information. Please try again.';
        this.loading = false;
        this.profile = null;
        
        // Force change detection to update UI
        this.cdr.detectChanges();
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }

      // Validate file size (100KB limit)
      if (file.size > 100 * 1024) {
        alert('File size must be less than 100KB. Please select a smaller image.');
        return;
      }

      this.selectedFile = file;
      
      // Create preview and convert to base64
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadProfilePicture(): void {
    if (!this.selectedFile) {
      alert('Please select a file first.');
      return;
    }

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      
      // Prepare data for API
      const uploadData = {
        employeeId: this.profile?.id || 0,
        profilePicture: base64String, // This includes the data:image/jpeg;base64, prefix
        fileName: this.selectedFile?.name || 'profile.jpg',
        fileSize: this.selectedFile?.size || 0
      };

      console.log('Uploading profile picture:', {
        employeeId: uploadData.employeeId,
        fileName: uploadData.fileName,
        fileSize: uploadData.fileSize,
        base64Length: base64String.length
      });

      // Send to API
      this.http.post(`${environment.apiUrl}/upload-profile-picture`, uploadData).subscribe({
        next: (response) => {
          console.log('Profile picture uploaded successfully:', response);
          alert('Profile picture uploaded successfully!');
          this.loadProfile(); // Reload profile to get updated picture
          this.selectedFile = null;
          this.previewUrl = null;
        },
        error: (error) => {
          console.error('Error uploading profile picture:', error);
          alert('Failed to upload profile picture. Please try again.');
        }
      });
    };

    reader.onerror = () => {
      alert('Error reading file. Please try again.');
    };

    // Read file as base64
    reader.readAsDataURL(this.selectedFile);
  }

  removePreview(): void {
    this.selectedFile = null;
    this.previewUrl = null;
    
    // Reset file input
    const fileInput = document.getElementById('profilePictureInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  }
}
